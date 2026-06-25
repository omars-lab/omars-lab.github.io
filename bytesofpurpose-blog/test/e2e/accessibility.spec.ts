import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility regression scan (axe-core / WCAG 2.0+2.1 A & AA).
 *
 * Runs in the "dev" Playwright project against the Docusaurus dev server
 * (:3000) — no PostHog needed. Scans the key page templates in BOTH color
 * modes, since contrast issues differ between light and dark.
 *
 * Complements the scripted Lighthouse a11y check; axe catches rule-level WCAG
 * violations (contrast, names/roles, landmarks, …) and fails loudly with the
 * exact nodes, so a11y regressions can't slip in silently.
 *
 * ## Zero-tolerance pages vs. baselined pages
 *
 * The site templates we control end-to-end (home, blog index, docs shell) are
 * held to ZERO violations. Article *content* can carry pre-existing issues that
 * come from authored markdown or third-party theming, not from the layout — for
 * those pages we assert against a documented BASELINE of known rule IDs so the
 * gate stays green and still fails on anything NEW. Burn the baseline down via
 * the tracked a11y-debt task, then tighten these to zero.
 *
 * Known baseline (see task: "Burn down pre-existing a11y debt"):
 *   - color-contrast  → Prism syntax-highlight tokens + dense markdown tables
 *   - label           → markdown task-list checkboxes (`- [ ]`) render labelless
 *   - link-in-text-block → Docusaurus prose links rely on color alone (dark mode)
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

type PageSpec = {
  name: string;
  path: string;
  // Rule IDs allowed to remain (pre-existing content/theme debt). Empty = strict.
  baseline?: string[];
};

const PAGES: PageSpec[] = [
  { name: 'home', path: '/' },
  { name: 'blog-index', path: '/initiatives' },
  { name: 'docs-page', path: '/welcome' },
  {
    // Authored article — now strict ([] baseline). All Prism syntax-token
    // contrast debt (comment/function/property/atrule + string/builtin/boolean/
    // class-name/literal-property) was brought to AA in custom.css, in both
    // color modes. Fails on any NEW violation.
    name: 'blog-post',
    path: '/initiatives/evolution-of-a-repo',
  },
];

async function setColorMode(page: Page, mode: 'light' | 'dark') {
  await page.addInitScript((m) => {
    try {
      window.localStorage.setItem('theme', m as string);
    } catch {
      /* ignore */
    }
  }, mode);
}

function formatViolations(violations: any[]): string {
  return violations
    .map((v) => {
      const node = v.nodes[0]?.target?.join(' ') ?? '';
      return `  [${v.impact}] ${v.id} (${v.nodes.length}x): ${v.help}\n      e.g. ${node}`;
    })
    .join('\n');
}

for (const mode of ['light', 'dark'] as const) {
  test.describe(`Accessibility (axe, WCAG 2 A/AA) — ${mode} mode`, () => {
    for (const { name, path, baseline = [] } of PAGES) {
      test(`${name} (${mode})`, async ({ page }) => {
        await setColorMode(page, mode);
        const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
        expect(res?.status(), `navigation to ${path}`).toBeLessThan(400);
        await page.waitForLoadState('networkidle').catch(() => {});

        const { violations } = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .analyze();

        // Anything whose rule ID is NOT in this page's baseline is a regression.
        const unexpected = violations.filter((v) => !baseline.includes(v.id));
        if (unexpected.length) {
          throw new Error(
            `axe found ${unexpected.length} NEW violation(s) on ${path} (${mode}) ` +
              `beyond the documented baseline [${baseline.join(', ') || 'none'}]:\n` +
              formatViolations(unexpected)
          );
        }
        expect(unexpected, 'no non-baseline a11y violations').toEqual([]);
      });
    }
  });
}
