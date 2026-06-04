import { test, expect, Page } from '@playwright/test';

/**
 * SEO regression checks (dev project, :3000).
 *
 * Asserts the on-page SEO essentials Lighthouse's SEO category cares about, so
 * regressions fail in the normal test run rather than only in an occasional
 * manual Lighthouse pass:
 *   - a non-empty, reasonably-sized <title> and meta description
 *   - a canonical link
 *   - Open Graph + Twitter card tags (title, description, image)
 *   - no generic/non-descriptive link text (the Lighthouse `link-text` rule):
 *     bare "Read more" / "click here" / "here" etc.
 *
 * Pairs with the scripted Lighthouse run (make seo-scan), which scores the full
 * SEO category; this spec is the cheap always-on guard.
 */

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'blog-index', path: '/thoughts' },
  { name: 'blog-post', path: '/thoughts/evolution-of-a-repo' },
  { name: 'docs-page', path: '/welcome' },
];

const GENERIC_LINK_TEXT = [
  'read more',
  'click here',
  'here',
  'learn more',
  'link',
  'more',
];

async function meta(page: Page, selector: string): Promise<string | null> {
  const el = page.locator(selector).first();
  if ((await el.count()) === 0) return null;
  return el.getAttribute('content');
}

for (const { name, path } of PAGES) {
  test.describe(`SEO — ${name}`, () => {
    test.beforeEach(async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status(), `navigation to ${path}`).toBeLessThan(400);
      await page.waitForLoadState('networkidle').catch(() => {});
    });

    test('has a meaningful <title>', async ({ page }) => {
      const title = (await page.title()).trim();
      expect(title.length).toBeGreaterThan(5);
      expect(title.length).toBeLessThanOrEqual(70); // avoid SERP truncation
    });

    test('has a meta description', async ({ page }) => {
      const desc = await meta(page, 'meta[name="description"]');
      expect(desc, 'meta description present').toBeTruthy();
      expect((desc ?? '').length).toBeGreaterThan(20);
    });

    test('has a canonical link', async ({ page }) => {
      const canonical = page.locator('link[rel="canonical"]').first();
      expect(await canonical.count(), 'canonical link present').toBeGreaterThan(0);
    });

    test('has Open Graph + Twitter card tags', async ({ page }) => {
      expect(await meta(page, 'meta[property="og:title"]'), 'og:title').toBeTruthy();
      expect(await meta(page, 'meta[property="og:image"]'), 'og:image').toBeTruthy();
      expect(
        await meta(page, 'meta[name="twitter:card"]'),
        'twitter:card'
      ).toBeTruthy();
    });

    test('has no generic/non-descriptive link text', async ({ page }) => {
      const texts = await page.locator('a').allInnerTexts();
      const offenders = texts
        .map((t) => t.replace(/\s+/g, ' ').trim().toLowerCase())
        // Strip a trailing arrow glyph so "Read more →" is judged on its words.
        .map((t) => t.replace(/[→›»\->]+$/, '').trim())
        .filter((t) => GENERIC_LINK_TEXT.includes(t));
      expect(
        offenders,
        `links with non-descriptive text (bad for SEO): ${JSON.stringify(offenders)}`
      ).toEqual([]);
    });

    test('has valid JSON-LD structured data of the expected type', async ({ page }) => {
      // Collect + parse every ld+json block (must be valid JSON).
      const blocks = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      // home + blog-post carry structured data; blog index / docs need not.
      const expectedType: Record<string, string> = {
        home: 'WebSite',
        'blog-post': 'BlogPosting',
      };
      const want = expectedType[name];
      if (!want) return; // no structured-data requirement for this page

      expect(blocks.length, `${name} should emit JSON-LD`).toBeGreaterThan(0);
      const types = new Set<string>();
      for (const raw of blocks) {
        const data = JSON.parse(raw); // throws if invalid → test fails
        const nodes = data['@graph'] ?? [data];
        for (const n of nodes) {
          const t = n['@type'];
          (Array.isArray(t) ? t : [t]).forEach((x) => types.add(x));
        }
      }
      expect([...types], `${name} JSON-LD types`).toContain(want);
    });
  });
}
