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
    await expect(page.getByText(/sign in with linkedin to read the rest/i)).toBeVisible();
    await expect(page.getByText(/live demo of premium gating/i)).toBeVisible(); // teaser

    // None of the loaded JS chunks may contain the gated sentinel.
    for (const u of jsUrls) {
      const js = await (await request.get(u)).text();
      expect(js, `JS chunk leaked the sentinel: ${u}`).not.toContain(SENTINEL);
    }

    // THEMED, not generic: the gate carries the brand accent (a non-transparent left
    // border rail in the brand colour) — proves #15 styling actually shipped.
    const gate = page.locator('[class*="gate"]').first();
    const leftBorder = await gate.evaluate(
      (el) => getComputedStyle(el).borderLeftWidth,
    );
    expect(leftBorder).toBe('4px');

    // Clicking the lock opens the THEMED sign-in modal.
    await gate.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      page.getByRole('button', {name: /sign in with linkedin to unlock/i}),
    ).toBeVisible();
    // The "I'd rather this were free" interest button is present (distinct CTA, #16).
    await expect(page.getByRole('button', {name: /rather this were free/i})).toBeVisible();
    // Modal is branded: a 4px brand top-band on the modal card.
    const topBand = await dialog
      .locator('[class*="modal"]')
      .first()
      .evaluate((el) => getComputedStyle(el).borderTopWidth);
    expect(topBand).toBe('4px');
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
    // The lock prompt is gone once unlocked.
    await expect(
      page.getByText(/sign in with linkedin to read the rest/i),
    ).toHaveCount(0);
  });
});
