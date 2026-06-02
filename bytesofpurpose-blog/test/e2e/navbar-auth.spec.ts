import { test, expect } from '@playwright/test';

/**
 * Navbar auth control — V4 (dev project, :3000).
 *
 * The navbar shows a "Sign in with LinkedIn" button when anonymous and a profile
 * avatar + dropdown (email · Sign out) when signed in. Identity comes from ONE
 * /api/me fetch behind the AuthProvider (src/lib/auth.tsx); the control is
 * src/components/AuthNavbarItem, registered as the 'custom-auth' navbar item.
 *
 * Graceful degradation is the contract: when /api/* is unreachable (localhost has
 * no Worker — the dev server answers /api/me with the SPA-fallback HTML, never
 * JSON) the control must stay the "Sign in" button and never throw. The
 * signed-in path is proven by intercepting /api/me with a JSON identity (the
 * Worker isn't reachable in CI), exactly as the real Worker would respond.
 *
 * Runs against the DEV server (:3000) because the control is client-only and we
 * drive its state via route interception.
 */

test.describe('Navbar auth control (V4)', () => {
  test('anonymous / unreachable /api/me → "Sign in" button, no avatar', async ({
    page,
  }) => {
    // No interception: on :3000 /api/me returns the HTML fallback (the
    // "unreachable Worker" case). The control must degrade to the Sign in button.
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const signIn = page.locator('button[aria-label="Sign in with LinkedIn"]');
    await expect(signIn).toBeVisible({ timeout: 15000 });
    // It sits in the navbar's right group, next to the color-mode toggle.
    await expect(page.locator('.navbar__items--right')).toContainText('Sign in');
    // No avatar in the anonymous state.
    await expect(
      page.locator('button[aria-label^="Signed in as"]')
    ).toHaveCount(0);
  });

  test('signed in (valid /api/me) → avatar + dropdown with email and Sign out', async ({
    page,
  }) => {
    // Stub the Worker: a valid Access session returns {email, name} as JSON.
    await page.route('**/api/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'tester@example.com',
          name: 'Test Reader',
        }),
      })
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // The button is gone; an avatar appears, labelled with the signed-in email.
    const avatar = page.locator(
      'button[aria-label="Signed in as tester@example.com"]'
    );
    await expect(avatar).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('button[aria-label="Sign in with LinkedIn"]')
    ).toHaveCount(0);
    // Initials fallback derives from the name ("Test Reader" → "TR").
    await expect(avatar).toContainText('TR');

    // Opening the dropdown reveals the email and a Sign out menu item.
    await avatar.click();
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('tester@example.com');
    await expect(menu.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  });
});
