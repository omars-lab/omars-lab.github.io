import { test, expect, Page } from '@playwright/test';

/**
 * Craft/Self two-tier IA (dev project, :3000).
 *
 * The docs split into two halves, each its own navbar item + sidebar:
 *   - Craft   (/craft)   — outrospective: the professional topics.
 *   - Journey (/journey) — introspective: faith + personal growth.
 *
 * What this proves:
 *   1. The navbar has BOTH "Craft" and "Journey" (and no legacy "Learn").
 *   2. Landing in Craft shows ONLY craft topics in the sidebar (no Journey topics),
 *      and landing in Journey shows ONLY journey topics (no Craft) — the halves don't
 *      bleed into each other.
 *   3. Each section landing renders its DISTINCT framing (outrospective vs
 *      introspective) — they are not the same page.
 *   4. The shared Welcome is a chooser linking into BOTH halves.
 *
 * Craft topics (8): Generative AI, Software Development, Product Management,
 * Productivity, Blogging, Interview Prep, Companies, Entrepreneurship.
 * Self topics (2): Faith, Personal Growth.
 */

const CRAFT_TOPICS = [
  'Generative AI',
  'Software Development',
  'Product Management',
  'Productivity',
  'Blogging',
  'Interview Prep',
  'Companies',
  'Entrepreneurship',
];
const SELF_TOPICS = ['Faith', 'Personal Growth'];

// The sidebar nav (Docusaurus doc sidebar). Scope all sidebar queries to it so we
// don't accidentally match the navbar's own "Craft"/"Journey" items.
function sidebar(page: Page) {
  return page.locator('nav.menu, .theme-doc-sidebar-container').first();
}

async function sidebarLabels(page: Page): Promise<string[]> {
  await expect(sidebar(page)).toBeVisible({ timeout: 15000 });
  const links = sidebar(page).locator('.menu__link');
  await links.first().waitFor({ timeout: 15000 });
  return (await links.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
}

test.describe('Craft/Journey — navbar', () => {
  test('navbar shows Craft and Journey (and not the old "Learn")', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const navbar = page.locator('.navbar');
    await expect(navbar.getByRole('link', { name: 'Craft', exact: true })).toBeVisible();
    await expect(navbar.getByRole('link', { name: 'Journey', exact: true })).toBeVisible();
    await expect(navbar.getByRole('link', { name: 'Learn', exact: true })).toHaveCount(0);
  });
});

test.describe('Craft/Journey — sidebar isolation', () => {
  test('Craft sidebar shows ONLY craft topics (no Journey bleed-through)', async ({
    page,
  }) => {
    await page.goto('/craft', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const labels = await sidebarLabels(page);
    const joined = labels.join(' | ');
    // Every craft topic is present...
    for (const t of CRAFT_TOPICS) {
      expect(joined, `Craft sidebar should list "${t}"`).toContain(t);
    }
    // ...and NO journey topic leaks in.
    for (const t of SELF_TOPICS) {
      expect(joined, `Craft sidebar must NOT list journey topic "${t}"`).not.toContain(t);
    }
  });

  test('Journey sidebar shows ONLY journey topics (no Craft bleed-through)', async ({
    page,
  }) => {
    await page.goto('/journey', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const labels = await sidebarLabels(page);
    const joined = labels.join(' | ');
    for (const t of SELF_TOPICS) {
      expect(joined, `Journey sidebar should list "${t}"`).toContain(t);
    }
    for (const t of CRAFT_TOPICS) {
      expect(joined, `Journey sidebar must NOT list craft topic "${t}"`).not.toContain(t);
    }
  });
});

test.describe('Craft/Journey — distinct section welcomes', () => {
  test('Craft landing is outrospective; Journey landing is introspective', async ({
    page,
  }) => {
    await page.goto('/craft', { waitUntil: 'domcontentloaded' });
    const craftMain = page.locator('main');
    await expect(craftMain).toContainText('outrospective');
    await expect(craftMain).toContainText(/mastery of my craft/i);
    await expect(craftMain).toContainText(/outward/i);

    await page.goto('/journey', { waitUntil: 'domcontentloaded' });
    const selfMain = page.locator('main');
    await expect(selfMain).toContainText('introspective');
    await expect(selfMain).toContainText(/full potential|master(ing)? myself/i);
    await expect(selfMain).toContainText(/inward/i);

    // The two landings are genuinely different pages, not the same content.
    await expect(selfMain).not.toContainText('Browse the craft');
  });
});

test.describe('Homepage chooser', () => {
  test('homepage links into BOTH halves (Craft + Journey)', async ({ page }) => {
    // The /welcome chooser was folded into the homepage hero; /welcome now → /.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href$="/craft"]').first()).toBeVisible();
    await expect(page.locator('a[href$="/journey"]').first()).toBeVisible();
  });

  // NOTE: /welcome → / is a client redirect from @docusaurus/plugin-client-redirects,
  // which only emits stubs in a PRODUCTION build (not `yarn start`). So we don't assert
  // it in the dev project — it's verified at build time (build/welcome/index.html →
  // meta-refresh url=/). See the e2e README "verification mechanics".
});
