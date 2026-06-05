import { test, expect, Page } from '@playwright/test';
import { EXPERIMENTS } from '../../src/experiments';

/**
 * Validates the Support-CTA A/B experiment (flag: support-button-copy).
 *
 * RE-SCOPED 2026-06-01 (copy → presentation): both arms now render the SAME copy
 * ("Buy me a $5 coffee ☕", defined once in src/experiments.ts); the only thing that
 * varies is PRESENTATION on the /support page coffee CTA:
 *   control → plain text LINK   test → styled BUTTON (button--primary button--lg)
 * (see src/components/Support/CoffeeButton + the experiment doc
 *  docs/craft/product-management/experiments/2026-05-31-support-button-copy.md).
 *
 * To avoid drifting from the live PostHog payload, the expected copy is read from
 * the component's source of truth (EXPERIMENTS) rather than hardcoded, and the
 * variant is forced deterministically via the localhost-only ?ab=<variant> URL
 * override (src/experiments.ts urlOverride()) — NOT the live flag assignment.
 *
 * Run against the production build with POSTHOG_TEST_MODE=1 (so PostHog's bot
 * filter doesn't drop events):  make test-posthog  also runs these, or:
 *   set -a; source .env; set +a
 *   ( cd bytesofpurpose-blog && POSTHOG_TEST_MODE=1 yarn build && yarn serve --port 4173 & )
 *   PH_BASE_URL=http://localhost:4173 npx playwright test support-ab-test
 */

const PH_BASE = process.env.PH_BASE_URL || 'http://localhost:4173';
// The /support page is the single home of the coffee CTA (CoffeeButton). Override
// with PH_AB_PAGE if it moves.
const PAGE_WITH_BUTTON = process.env.PH_AB_PAGE || '/support';

// Source of truth for the rendered copy — identical in both arms post-re-scope.
const EXP = EXPERIMENTS['support-button-copy'];

async function posthogReady(page: Page) {
  try {
    await page.waitForFunction(() => typeof (window as any).posthog === 'object', { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Support CTA A/B experiment (link vs button)', () => {
  test.use({ baseURL: PH_BASE });

  for (const variant of ['control', 'test'] as const) {
    test(`variant "${variant}" renders the ${variant === 'test' ? 'styled button' : 'plain link'}`, async ({
      page,
    }) => {
      // Force the variant via the localhost-only URL override (deterministic,
      // applied before hydration — see src/experiments.ts urlOverride()).
      await page.goto(`${PAGE_WITH_BUTTON}?ab=${variant}`, { waitUntil: 'domcontentloaded' });

      const btn = page.getByTestId('support-coffee-button');
      await expect(btn).toBeVisible();

      // Copy is IDENTICAL in both arms — assert it matches the registry source of
      // truth (so the test can never drift from the live flag payload). The control
      // (link) variant appends a trailing arrow when the copy lacks one.
      const copy = EXP.variants[variant];
      await expect(btn).toContainText(copy.replace(/\s*→\s*$/, ''));

      // Presentation is the variable under test: control is a plain text LINK
      // (no Infima button classes), test is a styled BUTTON.
      const className = (await btn.getAttribute('class')) || '';
      if (variant === 'test') {
        expect(className).toContain('button--primary');
      } else {
        expect(className).not.toContain('button--primary');
      }

      // Capture a per-variant screenshot artifact so control vs treatment can be eyeballed
      // (and embedded in the experiment timeline doc) without re-running. Artifacts only —
      // we do NOT diff against a baseline here, so this never fails on a visual change.
      await btn.screenshot({
        path: `test-results/ab/support-button-copy-${variant}.png`,
      });

      // The A/B behaviour under test is VARIANT RENDERING (asserted above). Event
      // ingestion is proven separately by posthog-events.spec.ts + server-side
      // readback (query-posthog), so we don't re-gate on PostHog's batch-flush
      // timing here. Best-effort: confirm capture() doesn't throw for this variant.
      if (await posthogReady(page)) {
        const ok = await page.evaluate(() => {
          try {
            (window as any).posthog.capture('support button clicked', { variant: 'forced' });
            return true;
          } catch {
            return false;
          }
        });
        expect(ok).toBe(true);
      }
    });
  }
});
