import { test, expect, Page } from '@playwright/test';

/**
 * Component-showcase rendering (dev project, :3000).
 *
 * The showcases under docs/legend/components/* are the site's component reference (the
 * "🎛️ Components" section under Legend). Each is a `kind: showcase` doc that demonstrates ONE
 * embeddable ability live AND carries an auto-generated "Used in" list (the <UsedIn> component,
 * fed by generate-component-usage.js → component-usage.json).
 *
 * What this proves (Phase 3 of #71):
 *   1. Each showcase URL loads (200, no React crash) at its NEW /legend/components/* slug
 *      (the Phase-1 move; a regression here would mean a broken slug or a missing redirect).
 *   2. The <UsedIn> "Used in" block renders on every showcase — with REAL post links where the
 *      technique is used, and the honest empty line where it isn't (the two code paths).
 *   3. The live DEMONSTRATION renders for the interactive ones (mermaid → an <svg>; Card → the
 *      card markup; TOCInline → an inline table of contents) — not just prose.
 *
 * Runs against the dev server (:3000, drafts visible) because some showcases are draft:true and
 * <UsedIn> renders client-side (needs a real browser, not the SSR shell).
 */

// Representative showcases across the four groups. `usedIn` says whether the generated index
// has entries for this slug (so we assert the populated path) or not (the honest-empty path).
// (Counts come from component-usage.json at authoring time; the assertion only checks
// populated-vs-empty, not an exact count, so it stays robust as the corpus grows.)
const SHOWCASES: Array<{ slug: string; label: string; usedIn: boolean }> = [
  { slug: '/legend/components/structural/card', label: 'Card', usedIn: false },
  { slug: '/legend/components/structural/details', label: 'Details', usedIn: true },
  { slug: '/legend/components/structural/timeline', label: 'Timeline', usedIn: false },
  { slug: '/legend/components/structural/table-of-content', label: 'Table of Contents', usedIn: false },
  { slug: '/legend/components/structural/links', label: 'Linking Posts', usedIn: true },
  { slug: '/legend/components/diagrams/diagrams-mermaid', label: 'Mermaid', usedIn: true },
  { slug: '/legend/components/diagrams/diagrams-flow-charts', label: 'Flow Charts', usedIn: true },
  { slug: '/legend/components/external/videos-youtube', label: 'YouTube', usedIn: true },
  { slug: '/legend/components/code/code-gists', label: 'Gists', usedIn: false },
];

async function loadShowcase(page: Page, slug: string) {
  const response = await page.goto(slug, { waitUntil: 'domcontentloaded' });
  if (!response || response.status() !== 200) {
    throw new Error(`Showcase ${slug} failed to load. Status: ${response?.status()}, URL: ${page.url()}`);
  }
  await page.waitForLoadState('networkidle');
  // No React error boundary.
  const crashed = await page.locator('text=This page crashed').isVisible().catch(() => false);
  expect(crashed, `${slug} crashed (React error boundary)`).toBe(false);
}

// The <UsedIn> block: a labelled "Used in" region. Scope to the article so we don't match the
// navbar/sidebar. The component renders a "Used in" heading then either a <ul> of links or the
// empty line.
function usedInBlock(page: Page) {
  // styles.module.css → class `usedIn` (hashed at build, so match by the heading text instead).
  return page.locator('main').getByText('Used in', { exact: true }).first();
}

test.describe('Component showcases (/legend/components/*)', () => {
  for (const { slug, label, usedIn } of SHOWCASES) {
    test(`${label}: loads + renders its "Used in" block`, async ({ page }) => {
      await loadShowcase(page, slug);

      // The doc body rendered (an <article>/main with content).
      await expect(page.locator('main')).toBeVisible();

      // The "Used in" block is present on every showcase.
      const heading = usedInBlock(page);
      await expect(heading, `${slug} is missing its <UsedIn> "Used in" block`).toBeVisible({ timeout: 10000 });

      if (usedIn) {
        // Populated path: at least one real post link under the block, and NOT the empty line.
        const emptyLine = page.getByText('Not used in a published post yet.');
        await expect(emptyLine, `${slug} should have usages but shows the empty line`).toHaveCount(0);
        // The block's sibling list has at least one link.
        const list = page.locator('main ul').filter({ has: page.locator('a') });
        expect(await list.count(), `${slug} should render a non-empty used-in list`).toBeGreaterThan(0);
      } else {
        // Honest-empty path: the quiet "not used yet" line shows.
        await expect(
          page.getByText('Not used in a published post yet.'),
          `${slug} has no usages and should show the honest empty line`,
        ).toBeVisible();
      }
    });
  }

  test('Mermaid showcase renders a live diagram (an <svg>)', async ({ page }) => {
    await loadShowcase(page, '/legend/components/diagrams/diagrams-mermaid');
    // Docusaurus renders mermaid to an inline <svg> (class contains "mermaid").
    const svg = page.locator('.docusaurus-mermaid-container svg, svg[id^="mermaid"], .mermaid svg').first();
    await expect(svg, 'mermaid showcase should render an <svg> diagram').toBeVisible({ timeout: 15000 });
  });

  test('Card showcase renders the live card demo (not just prose)', async ({ page }) => {
    await loadShowcase(page, '/legend/components/structural/card');
    // The Card component renders avatar/card markup; the demo uses the "Docux Card component" text.
    await expect(page.getByText('Docux Card component').first()).toBeVisible({ timeout: 10000 });
  });

  test('Table of Contents showcase renders an inline TOC', async ({ page }) => {
    await loadShowcase(page, '/legend/components/structural/table-of-content');
    // <TOCInline> renders a nav/list of in-page anchors inside the article body.
    const inlineToc = page.locator('main .table-of-contents, main nav ul a[href^="#"]').first();
    await expect(inlineToc, 'TOCInline should render an in-body table of contents').toBeVisible({ timeout: 10000 });
  });
});
