import {test, expect} from '@playwright/test';

/**
 * Sign-in REDIRECT flow — the post-LinkedIn bounce back to content.
 *
 * Regression guard for the bug where signing in navigated the top-level window to
 * `/api/me` (a JSON data endpoint) and, after auth, left the reader stranded on
 * `/api/me` → the SPA rendered "Page Not Found". The fix: signIn() targets the
 * Worker's `/api/redirect` route, which 303s an authenticated navigation back to the
 * (same-origin) content page. See workers/access-gate/src/index.ts + src/lib/auth.tsx
 * and the premium-content-gating design ("Workers & API endpoints").
 *
 * The real Worker/Access aren't reachable in CI, so we intercept `/api/redirect` and
 * emulate the Worker's behavior (303 → the sanitized same-origin redirect_url). What
 * this proves is the CLIENT wiring: (a) signIn() builds the right URL — `/api/redirect`,
 * NOT `/api/me`, carrying the current page as redirect_url; (b) following that redirect
 * lands the browser back on the content page, never on a JSON endpoint. The Worker's own
 * 303 + open-redirect sanitizer are proven separately in workers/access-gate/test.
 *
 * Runs in the same encrypted-prod `premium` project as premium-gating.spec.ts (:4173).
 */

const DEMO = '/craft/premium-gating-demo';

test.describe('Sign-in redirect flow', () => {
  test('clicking sign-in targets /api/redirect (not /api/me) with the page as redirect_url', async ({
    page,
  }) => {
    // Capture the would-be top-level navigation to /api/* instead of actually leaving
    // for Access/LinkedIn (which CI can't reach). Abort it so the test stays on-page.
    let loginUrl: string | null = null;
    await page.route('**/api/redirect*', (route) => {
      loginUrl = route.request().url();
      route.abort();
    });
    // If the old bug regressed, the click would navigate to /api/me — catch that too.
    let hitApiMeAsNavigation = false;
    await page.route('**/api/me*', (route) => {
      // A navigation (document) request to /api/me is the bug; a fetch() for identity
      // is normal. Distinguish by resource type.
      if (route.request().resourceType() === 'document') hitApiMeAsNavigation = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}), // anonymous: no email
      });
    });

    await page.goto(DEMO, {waitUntil: 'networkidle'});

    // The premium gate's "Unlock with LinkedIn" card has a direct sign-in button
    // (no intermediate modal) — clicking it kicks off signIn() → /api/redirect.
    await page.getByRole('button', {name: /sign in with linkedin/i}).last().click();

    await expect.poll(() => loginUrl, {timeout: 5000}).not.toBeNull();
    expect(hitApiMeAsNavigation, 'sign-in must NOT navigate to /api/me').toBe(false);

    const u = new URL(loginUrl!);
    expect(u.pathname).toBe('/api/redirect');
    // redirect_url must carry the content page we were on (same-origin path).
    const redirectUrl = u.searchParams.get('redirect_url');
    expect(redirectUrl).toBe(DEMO);
  });

  test('following /api/redirect lands back on the content page, not a JSON 404', async ({
    page,
  }) => {
    // Emulate the Worker: an authenticated GET /api/redirect 303s to the same-origin
    // redirect_url. Playwright follows the redirect, so the browser ends on the page.
    await page.route('**/api/redirect*', (route) => {
      const dest = new URL(route.request().url()).searchParams.get('redirect_url') || '/';
      route.fulfill({
        status: 303,
        headers: {Location: dest},
        body: '',
      });
    });

    // Drive the navigation the way signIn() does.
    await page.goto(`/api/redirect?redirect_url=${encodeURIComponent(DEMO)}`, {
      waitUntil: 'networkidle',
    });

    // We must have LANDED on the content page — its URL, and its content shell.
    await expect(page).toHaveURL(new RegExp(`${DEMO}$`));
    // The Docusaurus 404 must NOT be what we see.
    await expect(page.getByRole('heading', {name: /page not found/i})).toHaveCount(0);
    // The premium teaser (the real page) is present.
    await expect(page.getByText(/live demo of premium gating/i)).toBeVisible();
  });
});
