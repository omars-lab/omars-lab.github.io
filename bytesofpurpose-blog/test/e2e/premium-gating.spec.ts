import {test, expect} from '@playwright/test';

/**
 * Premium content hard-gate — V3 (anonymous = ciphertext) + the lock/unlock ROUND-TRIP.
 *
 * Runs against an ENCRYPTED production build (:4173) built with
 * STATICRYPT_PASSPHRASE=e2e-premium-passphrase (the value the stubbed /api/unlock-key
 * returns below). The demo page docs/craft/premium-gating-demo.mdx carries the sentinels
 * PREMIUMSENTINELBODY / PREMIUMSENTINELCODE in its gated body.
 *
 * Proves BOTH halves the user asked for:
 *   1. Locked down — anonymous: the body sentinel is NOT in the served HTML, NOT in any JS
 *      chunk, and the page shows the teaser + a lock; the encrypted sidecar is ciphertext;
 *      /api/me & /api/unlock-key are gated (we don't stub them in the anonymous test).
 *   2. Unlocked — signed in: with /api/me + /api/unlock-key stubbed (as the real Worker
 *      would respond), the gate decrypts the sidecar in-browser and the sentinel appears.
 *
 * The Worker isn't reachable in CI, so we stub /api/* via route interception — exactly the
 * shapes workers/access-gate/src/index.ts returns ({email} and {passphrase}).
 */

const DEMO = '/craft/premium-gating-demo';
const E2E_PASSPHRASE = 'e2e-premium-passphrase';
const SENTINEL = 'PREMIUMSENTINELBODY';

test.describe('Premium hard-gate (V3 + round-trip)', () => {
  test('locked down: anonymous body is ciphertext (not in HTML or JS), shows teaser + lock', async ({
    page,
    request,
    baseURL,
  }) => {
    // The RAW served HTML must not contain the gated sentinel (it was encrypted at compile).
    const html = await (await request.get(`${baseURL}${DEMO}`)).text();
    expect(html).not.toContain(SENTINEL);

    // Capture every JS chunk this page loads and assert the sentinel is in NONE of them —
    // the JS-bundle half of the hard-gate proof. (The earlier HTML-only check is insufficient
    // because Docusaurus compiles bodies into JS chunks.)
    const jsUrls: string[] = [];
    page.on('response', (res) => {
      const u = res.url();
      if (u.endsWith('.js')) jsUrls.push(u);
    });

    await page.goto(DEMO, {waitUntil: 'networkidle'});
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain(SENTINEL);
    // Disclaimer-only info pane says ONLY that this is premium (the teaser text).
    await expect(page.getByText(/premium content/i).first()).toBeVisible();
    await expect(page.getByText(/live demo of premium gating/i)).toBeVisible(); // teaser

    // None of the loaded JS chunks may contain the gated sentinel.
    for (const u of jsUrls) {
      const js = await (await request.get(u)).text();
      expect(js, `JS chunk leaked the sentinel: ${u}`).not.toContain(SENTINEL);
    }

    // GOLD info pane, not generic: a non-transparent left rail in the premium-gold
    // colour — proves the gold tint shipped.
    const notice = page.locator('[class*="notice"]').first();
    const leftBorder = await notice.evaluate(
      (el) => getComputedStyle(el).borderLeftWidth,
    );
    expect(leftBorder).toBe('4px');

    // Two CTA cards live in the BODY (not the disclaimer). The sign-in card has a direct
    // LinkedIn button; the "make it free" card has its own demand-signal button.
    await expect(
      page.getByRole('button', {name: /sign in with linkedin/i}).last(),
    ).toBeVisible();
    const freeBtn = page.getByRole('button', {name: /make this free/i});
    await expect(freeBtn).toBeVisible();

    // The "make it free" CTA records a demand signal + flips to a thank-you state
    // (idempotent — can't be spammed).
    await freeBtn.click();
    await expect(page.getByRole('button', {name: /thanks for the nudge/i})).toBeVisible();
  });

  test('unlocked: signed-in reader decrypts the body in-browser (round-trip)', async ({
    page,
  }) => {
    // Stub the Worker exactly as it responds for a valid Access session.
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({email: 'member@example.com', name: 'Member'}),
      }),
    );
    await page.route('**/api/unlock-key', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({passphrase: E2E_PASSPHRASE}),
      }),
    );

    await page.goto(DEMO, {waitUntil: 'networkidle'});

    // The gate fetches the key + payload, decrypts client-side, injects the body. The
    // sentinel — absent from HTML/JS — now appears in the rendered DOM.
    await expect(page.getByText(new RegExp(SENTINEL))).toBeVisible({timeout: 15000});
    // The locked CTA cards are gone once unlocked.
    await expect(page.getByRole('button', {name: /make this free/i})).toHaveCount(0);
  });
});
