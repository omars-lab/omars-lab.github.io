import { test, expect } from '@playwright/test';

/**
 * Reconstruction posts render + privacy verification.
 *
 * Two posts tell the "recreate a pattern with the bikar/qiyas CLIs" story:
 *   - DESIGNS: /designs/design-rosette-of-zeros  (SvgVariantGrid of bikar-rendered
 *     ring-of-zeros SVGs + a qiyas zone-audit image + the .igp recipe)
 *   - INITIATIVES: /initiatives/recreating-an-image-as-dsl  (the image->DSL journey, with
 *     <Evidence> footnotes that permalink into the sibling source repos)
 *
 * BOTH are currently `draft: true`, so they exist ONLY in the dev build (:3000) and
 * 404 in the production build (:4173). That split is exactly what these two projects
 * assert:
 *
 *   • dev project (:3000)  — the posts render correctly: the bikar SVGs appear, there
 *     is NO <text> element anywhere (the hard "no letters in the SVG" constraint,
 *     asserted in the rendered DOM, not just the source), the iteration table and the
 *     recipe code block are present, the qiyas image actually loads, and in dev the
 *     <Evidence> permalinks ARE clickable links (the dev-only-link rule).
 *
 *   • prod project (:4173) — the draft posts are ABSENT (404). The Evidence privacy
 *     rule is also asserted defensively: IF either post is ever published (draft:false)
 *     and thus present in prod, the prod build must NOT ship any PRIVATE
 *     github.com/NaqshCoffee/<repo>/blob/ permalink href (private repos degrade to prose).
 *     While the posts are draft this assertion holds vacuously; it starts biting the
 *     day they go live, which is the moment a private-link leak would matter.
 *
 * Run (dev):   npx playwright test --project=dev reconstruction-posts
 * Run (prod):  E2E_PROD_BASE_URL=http://localhost:4173 \
 *                npx playwright test --project=prod reconstruction-posts
 *   (prod needs a built+served :4173 — see make test-a11y / test-seo for the build/serve)
 */

const ROSETTE = '/designs/design-rosette-of-zeros';
const IMAGE_TO_DSL = '/initiatives/recreating-an-image-as-dsl';

// Private permalinks that must never ship in a prod bundle (private sibling repos).
const PRIVATE_PERMALINK = /github\.com\/NaqshCoffee\/[^"']*\/blob\//;

// ---------------------------------------------------------------------------
// DEV: the posts render as authored (drafts are served only here, on :3000).
// ---------------------------------------------------------------------------
test.describe('Reconstruction posts render in dev', () => {
  test.skip(
    ({ baseURL }) => !!baseURL && baseURL.includes('4173'),
    'dev-only: drafts do not exist in the prod build'
  );

  test('rosette post: bikar SVGs render and contain NO <text> (the no-letters rule)', async ({
    page,
  }) => {
    const res = await page.goto(ROSETTE, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), 'rosette draft must be served in dev').toBe(200);
    await page.waitForLoadState('networkidle').catch(() => {});

    // SvgVariantGrid injects each bikar variant as an inline <svg>. The post renders
    // two groups (final + iters) → at least 2 inline SVGs in the article body.
    const article = page.locator('article');
    const svgs = article.locator('svg');
    expect(await svgs.count(), 'inline bikar SVGs from SvgVariantGrid').toBeGreaterThanOrEqual(2);

    // THE HARD CONSTRAINT: not a single <text> element anywhere in the rendered post.
    // bikar has no text primitive; every "0" is a drawn ring. Assert it in the DOM.
    expect(await article.locator('svg text').count(), 'no <text> in any rendered SVG').toBe(0);
  });

  test('rosette post: iteration table, recipe code block, and qiyas image all present', async ({
    page,
  }) => {
    await page.goto(ROSETTE, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const article = page.locator('article');

    // The honest iteration log is a markdown table with multiple rows.
    expect(await article.locator('table tbody tr').count(), 'iteration table rows').toBeGreaterThanOrEqual(3);

    // The .igp recipe is shown as a fenced code block (starts `blueprint rz`).
    await expect(article.locator('pre code', { hasText: 'blueprint rz' })).toBeVisible();

    // The qiyas zone-audit image is embedded AND actually loads (decoded pixels).
    // Docusaurus lazy-loads images, so scroll it into view and wait for decode
    // rather than relying on networkidle (which can fire before the load starts).
    const img = article.locator('img[src*="rosette-zeros-qiyas-zones"]');
    await expect(img).toBeVisible();
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () => img.evaluate((el: HTMLImageElement) => el.naturalWidth),
        { message: 'qiyas image decoded (naturalWidth > 0)', timeout: 10000 }
      )
      .toBeGreaterThan(0);
  });

  test('image->DSL post: Evidence footnotes render as clickable permalinks in dev', async ({
    page,
  }) => {
    const res = await page.goto(IMAGE_TO_DSL, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), 'image->DSL draft must be served in dev').toBe(200);
    await page.waitForLoadState('networkidle').catch(() => {});
    const article = page.locator('article');

    // Each <Evidence> renders a span prefixed "Evidence:". There are several.
    const evidence = article.locator('span', { hasText: /^Evidence:/ });
    expect(await evidence.count(), 'Evidence citation spans').toBeGreaterThan(0);

    // In DEV, even private-repo evidence renders the clickable GitHub permalink
    // (dev-only-link rule). At least one real blob permalink must be present.
    const permalinks = article.locator('a[href*="github.com/"][href*="/blob/"]');
    expect(await permalinks.count(), 'dev-only Evidence permalinks').toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// PROD: drafts are absent, and no private permalink may ship if ever published.
// ---------------------------------------------------------------------------
test.describe('Reconstruction posts in the production build', () => {
  test.skip(
    ({ baseURL }) => !baseURL || baseURL.includes('3000'),
    'prod-only: needs the built :4173 serve'
  );

  test('both draft posts 404 in prod', async ({ page }) => {
    const r1 = await page.goto(ROSETTE, { waitUntil: 'domcontentloaded' });
    expect(r1?.status(), 'rosette draft absent from prod').toBe(404);
    const r2 = await page.goto(IMAGE_TO_DSL, { waitUntil: 'domcontentloaded' });
    expect(r2?.status(), 'image->DSL draft absent from prod').toBe(404);
  });

  test('NO private permalink ships in prod for the image->DSL post (vacuous while draft, bites when published)', async ({
    page,
  }) => {
    const res = await page.goto(IMAGE_TO_DSL, { waitUntil: 'domcontentloaded' });
    // While draft this is a 404 and the body has no private href — the privacy rule
    // holds. When published, the page exists and this asserts the prose-only fallback.
    if (res && res.status() === 200) {
      await page.waitForLoadState('networkidle').catch(() => {});
      const html = await page.content();
      expect(PRIVATE_PERMALINK.test(html), 'no private NaqshCoffee blob permalink in prod').toBe(false);
    } else {
      expect(res?.status(), 'draft → 404 (privacy rule trivially holds)').toBe(404);
    }
  });
});
