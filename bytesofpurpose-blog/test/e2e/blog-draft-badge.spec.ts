import { test, expect } from '@playwright/test';

/**
 * Draft markers on the BLOG instances — Initiatives (/initiatives) and Designs
 * (/designs) — (dev project, :3000).
 *
 * Sibling of draft-sidebar.spec.ts (which covers the docs sidebar). The blogs have
 * no docs sidebar, so drafts surface in three places, all badged with the same
 * dev-only "D" (aria-label="draft"):
 *   1. the "Posts" blog sidebar list  (swizzled src/theme/BlogSidebar/{Desktop,Mobile})
 *   2. the post-list cards            (swizzled BlogPostItem/Header/Title, <h2>)
 *   3. the post-page header           (same swizzle, <h1>)
 *
 * The sidebar reads blogDraftPermalinks from plugins/draft-docs; the card/header
 * reads frontMatter.draft directly. All gated to localhost + non-prod (drafts are
 * excluded from the production build, so the badge never ships).
 *
 * Must run against the DEV server (drafts don't exist in a prod build).
 */

for (const route of ['/initiatives', '/designs']) {
  test.describe(`Blog draft markers (dev only) — ${route}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Badges render after hydration (plugin data / frontmatter read client-side).
      await page.waitForLoadState('networkidle').catch(() => {});
    });

    test('the "Posts" sidebar badges draft posts', async ({ page }) => {
      const badges = page.locator('aside nav a span[aria-label="draft"]');
      await expect(badges.first()).toBeVisible({ timeout: 15000 });
    });

    test('badging is selective — not every sidebar link is a draft', async ({
      page,
    }) => {
      const allLinks = await page.locator('aside nav a').count();
      const badged = await page
        .locator('aside nav a span[aria-label="draft"]')
        .count();
      expect(badged).toBeGreaterThan(0);
      // At least the published posts are unbadged (both blogs have published posts).
      expect(badged).toBeLessThan(allLinks);
    });

    test('a draft post-list card shows the "D" badge on its title', async ({
      page,
    }) => {
      // The list renders each post title as a linked <h2>; a draft card carries the badge.
      const cardBadge = page.locator('article h2 span[aria-label="draft"]').first();
      await expect(cardBadge).toBeVisible({ timeout: 15000 });
    });
  });
}

test('a draft post PAGE shows the "D" badge in its <h1>', async ({ page }) => {
  // markdown-review-studio is a draft Designs post; its header H1 carries the badge.
  await page.goto('/designs/design-markdown-review-studio', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  const h1Badge = page.locator('h1 span[aria-label="draft"]');
  await expect(h1Badge).toBeVisible({ timeout: 15000 });
});
