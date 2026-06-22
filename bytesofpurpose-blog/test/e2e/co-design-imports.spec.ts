import { test, expect, Page } from '@playwright/test';

/**
 * Imported co-design posts render correctly on the Designs blog.
 *
 * The /import-co-design skill turns public architecture HLDs
 * (work-git/docs/architecture/co-designs/public/CO-DESIGN-*-hld.md) into Designs-blog
 * .mdx posts via .claude/skills/import-co-design/import-co-design.js. The transformer
 * makes a series of changes the BUILD alone can't fully prove (mermaid renders
 * client-side as SVG, not in static HTML; the em-dash hook only sees source bytes).
 * This spec runs a real browser to assert the rendered result:
 *
 *   • each design page 200s with its H1
 *   • mermaid fences became inline SVG diagrams (NOT shown as raw ```mermaid text)
 *   • NO literal em-dash (U+2014) survives in the rendered prose (the de-em-dash
 *     contract) — entities in mermaid labels render as real em-dashes, which is fine,
 *     so this checks the ARTICLE PROSE, not the SVG labels
 *   • the cross-doc link (storefront → site-scanner) resolves to a /designs slug
 *   • footnotes (storefront) render as a GFM footnotes section
 *   • labeled scope-notes render as admonitions
 *   • the first diagram carries the .mermaid-animated opt-in wrapper
 *
 * All four posts are draft:true, so they exist ONLY in the dev build (:3000) and 404 in
 * prod (:4173) — the same split reconstruction-posts.spec.ts asserts. These tests run in
 * the dev project; a prod guard asserts the drafts are absent.
 *
 * Run (dev):  npx playwright test --project=dev co-design-imports
 * Run (prod): E2E_PROD_BASE_URL=http://localhost:4173 \
 *               npx playwright test --project=prod co-design-imports
 */

const POSTS = {
  buildAgents: '/designs/design-autonomous-build-agents',
  siteScanner: '/designs/design-ecommerce-site-scanner-and-lead-generation-engine',
  markdownReview: '/designs/design-markdown-review-studio',
  storefront: '/designs/design-self-healing-storefront',
};
const ALL = Object.values(POSTS);

// Mermaid renders asynchronously; give it a beat and a real assertion to poll on.
async function waitForMermaid(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect
    .poll(
      async () =>
        page.locator('article .mermaid svg, article .docusaurus-mermaid-container svg').count(),
      { message: 'mermaid rendered to inline SVG', timeout: 15000 }
    )
    .toBeGreaterThan(0);
}

// ---------------------------------------------------------------------------
// DEV: drafts are served on :3000 and render as authored.
// ---------------------------------------------------------------------------
test.describe('Imported co-design posts render in dev', () => {
  test.skip(
    ({ baseURL }) => !!baseURL && baseURL.includes('4173'),
    'dev-only: these posts are draft:true and do not exist in the prod build'
  );

  for (const [name, path] of Object.entries(POSTS)) {
    test(`${name}: 200s, has an H1, and renders mermaid as SVG`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status(), `${path} must be served in dev`).toBe(200);

      // H1 present and non-empty.
      const h1 = page.locator('article h1').first();
      await expect(h1).toBeVisible();
      expect((await h1.textContent())?.trim().length || 0).toBeGreaterThan(0);

      // Mermaid fences rendered to SVG (the thing static HTML can't show).
      await waitForMermaid(page);

      // And the raw fence text never leaked into the page as a visible code block.
      const rawFence = page.locator('article pre code', { hasText: 'graph LR' });
      expect(
        await rawFence.count(),
        'no un-rendered ```mermaid code block visible'
      ).toBe(0);
    });

    test(`${name}: NO literal em-dash in the rendered prose`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      // Read the article's prose text, EXCLUDING any <svg> (mermaid labels legitimately
      // render entities as em-dashes). The de-em-dash contract is about prose.
      const proseText = await page.locator('article').evaluate((el) => {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('svg').forEach((n) => n.remove());
        return clone.textContent || '';
      });
      expect(proseText.includes('—'), 'no U+2014 em-dash in rendered prose').toBe(
        false
      );
    });

    test(`${name}: first diagram has the .mermaid-animated wrapper`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      expect(
        await page.locator('article .mermaid-animated').count(),
        'opt-in animation wrapper present'
      ).toBeGreaterThan(0);
    });
  }

  test('storefront: scope-note + terminology render as admonitions', async ({ page }) => {
    await page.goto(POSTS.storefront, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const admonitions = page.locator('article .theme-admonition');
    expect(await admonitions.count(), 'admonitions rendered').toBeGreaterThanOrEqual(2);
  });

  test('storefront: footnotes render as a GFM footnotes section', async ({ page }) => {
    await page.goto(POSTS.storefront, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    // Docusaurus renders GFM footnotes as <section class="footnotes"> with back-refs.
    const footnotes = page.locator('article .footnotes, article section[class*="footnote"]');
    await expect(footnotes.first()).toBeVisible();
    const refs = page.locator('article a[href^="#user-content-fn-"], article .footnote-ref');
    expect(await refs.count(), 'footnote references in body').toBeGreaterThan(0);
  });

  test('storefront → site-scanner cross-doc link resolves to a /designs slug', async ({
    page,
  }) => {
    await page.goto(POSTS.storefront, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    // At least one link in the body points at the site-scanner design post.
    const xlink = page.locator(
      `article a[href*="${POSTS.siteScanner}"]`
    );
    expect(await xlink.count(), 'rewritten cross-doc link present').toBeGreaterThan(0);

    // And following it lands on the site-scanner post (200 + its H1).
    const href = await xlink.first().getAttribute('href');
    const res = await page.goto(href!, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), 'cross-doc link target resolves').toBe(200);
  });
});

// ---------------------------------------------------------------------------
// PROD: the draft posts are absent (404) until published.
// ---------------------------------------------------------------------------
test.describe('Imported co-design posts in the production build', () => {
  test.skip(
    ({ baseURL }) => !baseURL || baseURL.includes('3000'),
    'prod-only: needs the built :4173 serve'
  );

  test('all four draft posts 404 in prod', async ({ page }) => {
    for (const path of ALL) {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status(), `${path} (draft) absent from prod`).toBe(404);
    }
  });
});
