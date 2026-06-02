import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import { rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * PROOF (not assertion): can the BOOKMARKLET concept carry an ingress tag?
 *
 * A bookmarklet is a bookmark whose URL is `javascript:…`. When the user clicks it,
 * the browser runs that JS against the current page. The proposed use: the bookmarklet
 * pings analytics and/or redirects to our page WITH `?im=bookmarklet`, so we attribute
 * the visit.
 *
 * We prove each link of the chain in a REAL Chrome:
 *   1. javascript: executes when invoked (the core mechanic).
 *   2. it can fire a network beacon (sendBeacon / fetch) — the "ping analytics" step.
 *   3. it can redirect to a tagged URL, and our ingress reader picks up ?im= on arrival.
 *   4. CSP check: does navigating the address bar to a javascript: URL run or get blocked?
 *
 * Tenet: never assume — always prove and test. Page console logs are surfaced in-test.
 * Gated behind PROVE_BOOKMARKLET=1; launches its own headed Chrome.
 * Run: PROVE_BOOKMARKLET=1 npx playwright test --project=bookmark-proof bookmarklet-proof
 */

const PH_BASE = process.env.PH_BASE_URL || 'http://localhost:4173';
const TARGET = `${PH_BASE}/welcome`;

test('PROOF: bookmarklet javascript: can beacon + redirect with ?im=bookmarklet', async () => {
  test.skip(
    !process.env.PROVE_BOOKMARKLET,
    'Launches a real headed Chrome; run with PROVE_BOOKMARKLET=1.',
  );

  const userDataDir = join(tmpdir(), `bmlet-proof-${Date.now()}`);
  rmSync(userDataDir, { recursive: true, force: true });
  mkdirSync(userDataDir, { recursive: true });

  let ctx: BrowserContext | undefined;
  try {
    ctx = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome',
      args: ['--no-first-run', '--no-default-browser-check'],
    });
    const page: Page = ctx.pages()[0] || (await ctx.newPage());
    page.on('console', (m) => console.log(`  [page:${m.type()}] ${m.text()}`));

    // Record beacons the bookmarklet sends (the "ping analytics" step).
    const beacons: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('im=bookmarklet') || r.url().includes('/__beacon')) {
        beacons.push(`${r.method()} ${r.url()}`);
      }
    });

    await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

    // ---- LINK 1 + 2: does javascript: execute and can it beacon? ------------
    // Simulate clicking a saved bookmarklet by evaluating its body in the page,
    // exactly as the browser does when a javascript: bookmark is clicked.
    const bookmarkletBody = `
      console.log('[bookmarklet] executing in page context: ' + location.pathname);
      try {
        navigator.sendBeacon('${PH_BASE}/__beacon?im=bookmarklet&path=' + location.pathname);
        console.log('[bookmarklet] sendBeacon fired');
      } catch (e) { console.log('[bookmarklet] beacon failed: ' + e); }
    `;
    const ran = await page.evaluate((body) => {
      try {
        // eslint-disable-next-line no-new-func
        new Function(body)();
        return true;
      } catch (e) {
        return 'threw: ' + (e as Error).name;
      }
    }, bookmarkletBody);
    console.log('\nLINK 1 (javascript: executes):', ran);
    await page.waitForTimeout(300);
    console.log('LINK 2 (beacon fired):', beacons.length > 0, JSON.stringify(beacons));

    // ---- LINK 3: redirect to tagged URL → our ingress reader strips ?im= -----
    // (That `?im=` fires the `ingress` event is already proven by the
    // ingress-attribution spec; here we prove the bookmarklet's REDIRECT reaches
    // that reader, observed via the deterministic side effect: the param is
    // stripped on arrival — which only happens inside the `if (marker)` branch
    // right after posthog.capture('ingress', …).)
    await page.evaluate((base) => {
      location.href = base + '/welcome?im=bookmarklet';
    }, PH_BASE);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof (window as any).posthog === 'object', {
      timeout: 10000,
    });
    const stripped = await page
      .waitForFunction(() => !window.location.search.includes('im='), { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    const urlAfter = page.url();
    console.log('\nLINK 3 (redirect reached ingress reader → ?im= stripped):', stripped);
    console.log('       URL after arrival:', urlAfter);

    // ---- LINK 4: CSP — does address-bar navigation to javascript: run? ------
    // (Modern browsers block javascript: typed/navigated into the address bar; a
    // SAVED bookmark is the supported path. We record what this build does.)
    let cspBlocked = 'unknown';
    try {
      await page.goto('javascript:void(document.title="BMLET_RAN")');
      const t = await page.title();
      cspBlocked = t === 'BMLET_RAN' ? 'ran (not blocked)' : 'navigated but did not set title';
    } catch (e) {
      cspBlocked = 'blocked/threw: ' + (e as Error).message.slice(0, 60);
    }
    console.log('LINK 4 (address-bar javascript: navigation):', cspBlocked);

    // The shippable claim we actually care about: a bookmarklet body CAN beacon AND
    // its redirect lands a tagged URL our reader attributes.
    expect(ran).toBe(true);
    expect(beacons.length).toBeGreaterThan(0);
    expect(stripped).toBe(true);
    expect(urlAfter).not.toContain('im=');
  } finally {
    await ctx?.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
});
