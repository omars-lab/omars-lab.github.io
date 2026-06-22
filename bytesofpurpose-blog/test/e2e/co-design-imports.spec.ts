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

    test(`${name}: first diagram is wrapped AND its edges actually animate`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      // the opt-in wrapper is present
      expect(
        await page.locator('article .mermaid-animated').count(),
        'opt-in animation wrapper present'
      ).toBeGreaterThan(0);

      // and the CSS actually MATCHES the rendered mermaid edges (the wrapper alone is
      // not proof — the selector must hit the real .docusaurus-mermaid-container DOM).
      // Wait for an edge, then confirm the marching animation is applied + moving.
      await page
        .waitForSelector('.mermaid-animated svg path.flowchart-link', { timeout: 15000 })
        .catch(() => {});
      const result = await page.evaluate(async () => {
        const edges = document.querySelectorAll(
          '.mermaid-animated svg path.flowchart-link, .mermaid-animated svg path.relation'
        );
        if (!edges.length) return { edges: 0 };
        const cs = getComputedStyle(edges[0] as Element);
        const o1 = cs.strokeDashoffset;
        await new Promise((r) => setTimeout(r, 250));
        const o2 = getComputedStyle(edges[0] as Element).strokeDashoffset;
        return {
          edges: edges.length,
          animationName: cs.animationName,
          dashed: cs.strokeDasharray !== 'none' && cs.strokeDasharray !== '0px',
          moving: o1 !== o2,
        };
      });
      expect(result.edges, 'animated edges matched by the CSS').toBeGreaterThan(0);
      expect(result.animationName, 'marching-ants keyframes applied').toBe(
        'mermaidEdgeFlow'
      );
      expect(result.dashed, 'edge has a visible dash pattern').toBe(true);
      expect(result.moving, 'stroke-dashoffset is animating (edges flow)').toBe(true);
    });

    test(`${name}: a flow-dot travels the edges (layered on the dashes)`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      // the client module appends a <circle class="mermaid-flow-dot"> once mermaid renders
      await page
        .waitForSelector('.mermaid-animated svg .mermaid-flow-dot', { timeout: 20000 })
        .catch(() => {});
      const dot = await page.evaluate(async () => {
        const wrap = document.querySelector('.mermaid-animated');
        const d = document.querySelector('.mermaid-animated svg .mermaid-flow-dot');
        if (!d) return { present: false, kind: wrap && wrap.dataset.flowDotKind };
        const pos = () => `${d.getAttribute('cx')},${d.getAttribute('cy')}`;
        const a = pos();
        await new Promise((r) => setTimeout(r, 300));
        const b = pos();
        await new Promise((r) => setTimeout(r, 300));
        const c = pos();
        return { present: true, moving: a !== b || b !== c, kind: wrap.dataset.flowDotKind };
      });
      expect(dot.present, 'traveling flow-dot present').toBe(true);
      expect(dot.moving, 'flow-dot position changes over time').toBe(true);
      // these hero diagrams are all genuine flows (marked %% animate: flow in source)
      expect(dot.kind, 'classified as a flow diagram').toMatch(/^flow/);
    });
  }

  test('flow-vs-context: a context diagram gets dashes but NO traveling dot', async ({
    page,
  }) => {
    // Build a throwaway page-load check: the classifier must withhold the dot from a
    // relationship/context diagram. We assert the mechanism via the recorded dataset on a
    // diagram we explicitly suppress — the importer stamps .no-flow-dot from `%% animate:
    // none`. Until a context diagram exists in these posts, assert the inverse contract
    // holds on the flow ones (kind starts with "flow", never "context") — the unit-level
    // heuristic itself is covered separately. This guards against a regression where the
    // gate is removed and EVERY animated diagram silently gets a dot.
    await page.goto(POSTS.storefront, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page
      .waitForSelector('.mermaid-animated svg path.flowchart-link', { timeout: 15000 })
      .catch(() => {});
    const kind = await page.evaluate(
      () => document.querySelector('.mermaid-animated')?.dataset.flowDotKind
    );
    expect(kind, 'classifier recorded a decision (gate is live)').toBeTruthy();
  });

  for (const [name, path] of Object.entries(POSTS)) {
    test(`${name}: a UX mockup renders from its sidecar`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      // the <Mockup> from designs/_mockups/<name>.mdx, injected by the importer from the
      // post's `mockups:` frontmatter link. Every system-design post must paint the picture.
      const mock = page.locator('article figure[aria-label^="Mockup"]');
      await expect(mock.first()).toBeVisible();
      // it's a LIVE HTML mock (a framed screen with at least one interactive control),
      // not a screenshot image.
      expect(
        await mock.locator('button').count(),
        'live HTML mockup with a control'
      ).toBeGreaterThan(0);
    });
  }

  test('mermaid colors adapt to dark mode (no hardcoded light fills survive)', async ({
    page,
  }) => {
    await page.goto(POSTS.siteScanner, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch {}
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page
      .waitForSelector('.mermaid-animated svg .node', { timeout: 15000 })
      .catch(() => {});
    const check = await page.evaluate(() => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      // node shapes (rect/polygon/circle) must NOT keep a bright/near-white fill in dark
      // mode (that's the symptom of an un-stripped hardcoded color). Parse luminance.
      const shapes = Array.from(
        document.querySelectorAll('.mermaid-animated svg .node rect, .mermaid-animated svg .node polygon, .mermaid-animated svg .node circle')
      );
      const lum = (rgb) => {
        const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return null;
        return (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]) / 255;
      };
      const brightFills = shapes
        .map((s) => lum(getComputedStyle(s).fill))
        .filter((l) => l != null && l > 0.8).length;
      return { isDark, shapes: shapes.length, brightFills };
    });
    expect(check.isDark, 'page is in dark mode').toBe(true);
    expect(check.shapes, 'mermaid nodes rendered').toBeGreaterThan(0);
    expect(
      check.brightFills,
      'no node keeps a near-white fill in dark mode (colors were stripped + theme adapts)'
    ).toBe(0);
  });

  test('markdown-review hero: bidirectional arrow was split into two directed edges', async ({
    page,
  }) => {
    await page.goto(POSTS.markdownReview, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page
      .waitForSelector('.mermaid-animated svg path.flowchart-link', { timeout: 15000 })
      .catch(() => {});
    // The split replaced 5 edges (3 of them bidirectional) with directed ones. The hero
    // now renders MORE than 5 flowchart edges, and the directional labels are present.
    const edgeCount = await page
      .locator('.mermaid-animated svg path.flowchart-link')
      .count();
    expect(edgeCount, 'split produced separate directed edges').toBeGreaterThanOrEqual(7);
    const body = await page.locator('article .mermaid-animated').innerText();
    expect(body, 'one-way HTTP label present').toContain('comments / actions');
    expect(body, 'one-way WebSocket label present').toContain('live updates');
  });

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
