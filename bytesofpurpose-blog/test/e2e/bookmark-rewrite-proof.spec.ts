import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * PROOF (not assertion): does the "rewrite the URL on ⌘D so the bookmark grabs the
 * tagged version" trick actually carry `?im=bookmark` into the REAL browser bookmark?
 *
 * We cannot answer this from the page (no API reads the bookmark store). So we drive a
 * REAL Chrome with a dedicated profile, trigger the native bookmark shortcut, then read
 * Chrome's on-disk `Bookmarks` JSON — the ground truth the browser actually stored.
 *
 * Tenet: never assume — always prove and test. Console logs from the page are captured
 * and surfaced in the test output so the evidence is visible.
 *
 * This spec is NOT part of any project's testMatch (it launches its own browser); run it
 * explicitly:  npx playwright test bookmark-rewrite-proof --project=posthog-prod
 * (any project works — it ignores the project browser and launches its own headed Chrome).
 */

const PH_BASE = process.env.PH_BASE_URL || 'http://localhost:4173';
const TARGET = `${PH_BASE}/docs/welcome/intro`;

function readBookmarkUrls(userDataDir: string): string[] {
  const file = join(userDataDir, 'Default', 'Bookmarks');
  if (!existsSync(file)) return [];
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const urls: string[] = [];
  const walk = (n: any) => {
    if (!n) return;
    if (n.type === 'url' && n.url) urls.push(n.url);
    (n.children || []).forEach(walk);
  };
  Object.values(data.roots || {}).forEach(walk);
  return urls;
}

test('PROOF: ⌘D rewrite trick — is ?im=bookmark carried into the real bookmark?', async () => {
  test.skip(
    !process.env.PROVE_BOOKMARK,
    'Launches a real headed Chrome + writes a bookmark; run with PROVE_BOOKMARK=1.',
  );

  const userDataDir = join(tmpdir(), `bm-proof-${Date.now()}`);
  rmSync(userDataDir, { recursive: true, force: true });
  mkdirSync(userDataDir, { recursive: true });

  const logs: string[] = [];
  let ctx: BrowserContext | undefined;
  try {
    ctx = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome',
      args: ['--no-first-run', '--no-default-browser-check'],
    });
    const page: Page = ctx.pages()[0] || (await ctx.newPage());

    // Capture page console logs INTO the test (user ask) and echo them live.
    page.on('console', (m) => {
      const line = `[page:${m.type()}] ${m.text()}`;
      logs.push(line);
      // eslint-disable-next-line no-console
      console.log('  ' + line);
    });

    await page.goto(TARGET, { waitUntil: 'domcontentloaded' });

    // Install the rewrite-on-⌘D trick the user proposed, with console tracing.
    await page.evaluate(() => {
      document.addEventListener(
        'keydown',
        (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
            console.log('[trick] ⌘D caught; url BEFORE rewrite = ' + location.href);
            const u = new URL(location.href);
            u.searchParams.set('im', 'bookmark');
            history.replaceState(null, '', u.pathname + u.search);
            console.log('[trick] url AFTER replaceState  = ' + location.href);
          }
        },
        true,
      );
    });

    // Fire the REAL native bookmark shortcut, then commit the bubble with Enter.
    await page.bringToFront();
    await page.keyboard.press('Meta+KeyD');
    await page.waitForTimeout(700);
    await page.keyboard.press('Enter'); // "Done" on the add-bookmark bubble
    await page.waitForTimeout(1200);

    const urlNowInAddressBar = page.url();
    const bookmarks = readBookmarkUrls(userDataDir);

    // eslint-disable-next-line no-console
    console.log('\n=== GROUND TRUTH (Chrome on-disk Bookmarks store) ===');
    bookmarks.forEach((u) => console.log('   • ' + u));

    const tagged = bookmarks.some((u) => u.includes('im=bookmark'));
    const cleanStored = bookmarks.some((u) => /\/docs\/welcome\/intro$/.test(u));

    // eslint-disable-next-line no-console
    console.log('\n=== RESULT ===');
    console.log('   address bar after ⌘D (user sees this):', urlNowInAddressBar);
    console.log('   tagged ?im=bookmark carried into bookmark?', tagged);
    console.log('   clean (untagged) URL stored instead?     ', cleanStored);
    console.log('   a bookmark was written at all?           ', bookmarks.length > 0);

    // The trick at minimum POLLUTES the address bar — that is provable regardless.
    expect(urlNowInAddressBar).toContain('im=bookmark');

    // Record (don't hard-assert) what the bookmark actually got, since the dialog
    // behavior under automation is itself a variable we are measuring.
    test.info().annotations.push({
      type: 'bookmark-store',
      description: JSON.stringify({ bookmarks, tagged, cleanStored }),
    });
  } finally {
    await ctx?.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
});
