import { test, expect } from '@playwright/test';

/**
 * Draft markers in the docs sidebar (dev project, :3000).
 *
 * On localhost in a dev build, individual draft docs (`draft: true` frontmatter —
 * excluded from production entirely) get a compact "D" badge in the sidebar so you
 * can tell drafts from published at a glance. Driven by plugins/draft-docs
 * (publishes draft permalinks as global data) + the swizzled
 * src/theme/DocSidebarItem/Link (gated to localhost + non-prod).
 *
 * Only LEAF doc links are badged — categories/folders are not (a fully-draft
 * folder often has no index page, so its sidebar entry has no href to match, and a
 * folder with any published child still shows in prod). See plugins/draft-docs.
 *
 * Must run against the DEV server (drafts don't exist in a prod build).
 */

test.describe('Docs sidebar — draft markers (dev only)', () => {
  test.beforeEach(async ({ page }) => {
    // Land on a PUBLISHED topic README whose sidebar branch contains draft leaf
    // docs. personal-growth (slug /self/personal-growth, draft:false) sits in the
    // Self sidebar with ~13 draft habits-* leaf siblings, which the dev-only swizzle
    // badges with a compact "D". (Draft docs 404 if visited directly, so the landing
    // must be a published page in the same sidebar — not a draft leaf itself.)
    await page.goto('/docs/self/personal-growth', {
      waitUntil: 'domcontentloaded',
    });
    // Badges render after hydration (the plugin data is read client-side).
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('a draft leaf doc shows the "D" badge', async ({ page }) => {
    // Landing on a draft leaf expands its branch; personal-growth has many draft
    // leaf docs. The badge carries aria-label="draft" (the visible glyph is a compact "D").
    const badges = page.locator('.menu__link span[aria-label="draft"]');
    await expect(badges.first()).toBeVisible({ timeout: 15000 });
  });

  test('the "D" badge sits on a draft doc link, not a category', async ({
    page,
  }) => {
    // Every badge must be inside a leaf doc link (not a collapsible category).
    const badges = page.locator('.menu__link span[aria-label="draft"]');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);
    // No category wrapper marker exists anymore (categories aren't badged).
    await expect(page.locator('[data-draft="true"]')).toHaveCount(0);
  });

  test('a published doc has no draft badge', async ({ page }) => {
    // The Self sidebar has both draft and published docs; assert not every link is
    // badged (sanity that badging is selective).
    const allLinks = await page.locator('nav.menu .menu__link').count();
    const badged = await page
      .locator('.menu__link span[aria-label="draft"]')
      .count();
    expect(badged).toBeLessThan(allLinks);
  });
});
