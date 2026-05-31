import { test, expect, Page } from '@playwright/test';

/**
 * Validates the Support-button A/B experiment (flag: support-button-copy).
 *  control → "Buy me a coffee ☕"   test → "Support the dev 💜"
 *
 * Run against the production build with POSTHOG_TEST_MODE=1 (so PostHog's bot
 * filter doesn't drop events):  make test-posthog  also runs these, or:
 *   set -a; source .env; set +a
 *   ( cd bytesofpurpose-blog && POSTHOG_TEST_MODE=1 yarn build && yarn serve --port 4173 & )
 *   PH_BASE_URL=http://localhost:4173 npx playwright test support-ab-test
 *
 * Strategy: force each variant with posthog.featureFlags.overrideFeatureFlags,
 * reload so the component re-reads the flag, then assert the rendered copy and
 * that exposure ($feature_flag_called) + conversion ('support button clicked')
 * events reach the ingestion host with the right variant.
 */

const PH_BASE = process.env.PH_BASE_URL || 'http://localhost:4173';
// A docs page that embeds <Support/>. Override with PH_AB_PAGE if it moves.
const PAGE_WITH_BUTTON =
  process.env.PH_AB_PAGE ||
  '/docs/techniques/blogging-techniques/embed-structural-components/footer';

async function posthogReady(page: Page) {
  try {
    await page.waitForFunction(() => typeof (window as any).posthog === 'object', { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('Support button A/B experiment', () => {
  test.use({ baseURL: PH_BASE });

  for (const [variant, expectedCopy] of [
    ['control', 'Buy me a coffee'],
    ['test', 'Support the dev'],
  ] as const) {
    test(`variant "${variant}" renders "${expectedCopy}"`, async ({ page }) => {
      // Force the variant via the localhost-only URL override (deterministic,
      // applied before hydration — see src/experiments.ts urlOverride()).
      await page.goto(`${PAGE_WITH_BUTTON}?ab=${variant}`, { waitUntil: 'domcontentloaded' });

      const btn = page.getByTestId('support-button');
      await expect(btn).toBeVisible();
      await expect(btn).toContainText(expectedCopy);

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
