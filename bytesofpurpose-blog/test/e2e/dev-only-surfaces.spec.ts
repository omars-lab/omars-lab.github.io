import { test, expect } from '@playwright/test';

/**
 * Dev-only surfaces must NOT appear in production (prod project, :4173 build).
 *
 * Two surfaces are intentionally localhost + dev-build only:
 *   - the floating DebugMenu (src/components/DebugMenu) — experiment toggler
 *   - the docs-sidebar "draft" badges (plugins/draft-docs + DocSidebarItem swizzle)
 *
 * Both are gated by `process.env.NODE_ENV !== 'production'` (tree-shaken from the
 * build) AND `isLocalhost()` (runtime). This spec runs against the PRODUCTION
 * build served on :4173 and asserts neither surface is present — the safety net
 * behind the build-time grep. If either ever leaks to prod, this fails.
 */

test.describe('Dev-only surfaces are absent in the production build', () => {
  test('no DebugMenu FAB on the homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    // The FAB has aria-label "Open debug menu" in dev; must not exist in prod.
    await expect(page.getByRole('button', { name: 'Open debug menu' })).toHaveCount(0);
    await expect(page.locator('text=/^Debug$/')).toHaveCount(0);
  });

  test('no draft badges in the docs sidebar', async ({ page }) => {
    // Drafts are excluded from the prod build entirely, AND the badge is gated.
    await page.goto('/docs/welcome/intro', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('[data-draft="true"]')).toHaveCount(0);
    // No "draft" pill anywhere in the sidebar nav.
    const sidebar = page.locator('nav.menu, .theme-doc-sidebar-container');
    await expect(sidebar.locator('text=/^draft$/i')).toHaveCount(0);
  });

  test('the draft category itself is gone (Definitions index was draft:true)', async ({
    page,
  }) => {
    // /docs/definitions/definitions is draft → 404 in prod (not just unbadged).
    const res = await page.goto('/docs/definitions/definitions', {
      waitUntil: 'domcontentloaded',
    });
    expect(res?.status(), 'draft doc should not exist in prod').toBe(404);
  });
});
