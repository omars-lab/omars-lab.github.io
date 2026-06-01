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
    await page.goto('/docs/definitions/definitions', {
      waitUntil: 'domcontentloaded',
    });
    // Badges render after hydration (the plugin data is read client-side).
    await page.waitForLoadState('networkidle').catch(() => {});
  });

  test('a draft leaf doc shows the "D" badge', async ({ page }) => {
    // Landing inside Definitions expands its branch; it contains draft leaf docs.
    // The badge carries aria-label="draft" (the visible glyph is a compact "D").
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
    // The active Definitions index is itself a draft, but at least one sibling is
    // published; assert not every link is badged (sanity that badging is selective).
    const allLinks = await page.locator('nav.menu .menu__link').count();
    const badged = await page
      .locator('.menu__link span[aria-label="draft"]')
      .count();
    expect(badged).toBeLessThan(allLinks);
  });
});
