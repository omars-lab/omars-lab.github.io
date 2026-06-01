import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration.
 *
 * The suite has TWO server modes that must not be mixed (mixing them is what
 * produced false failures historically):
 *
 *   1. "dev" project — specs that render docs pages (graph-*). They run against
 *      the Docusaurus dev server (`yarn start`, :3000), which serves drafts and
 *      hot content. This config auto-starts that server (webServer below).
 *
 *   2. "posthog-prod" project — specs that need real PostHog (posthog-events,
 *      support-ab-test). PostHog only initialises in a *production* build, and
 *      its bot filter must be disabled, so these run against a separately-built
 *      `POSTHOG_TEST_MODE=1` production build served on :4173. Start it yourself
 *      (see make test-posthog / the spec headers) and point PH_BASE_URL at it.
 *
 * Run everything:        E2E_PROD_BASE_URL=http://localhost:4173 npx playwright test
 *   (after starting the :4173 test-mode serve — or run the projects separately)
 * Run only dev specs:    npx playwright test --project=dev
 * Run only prod specs:   PH_BASE_URL=http://localhost:4173 npx playwright test --project=posthog-prod
 *
 * `make test-posthog` orchestrates the prod build + serve + posthog-prod project.
 */

const DEV_BASE = process.env.E2E_DEV_BASE_URL || 'http://localhost:3000';
// PH_BASE_URL kept for backward-compat with the spec headers / make test-posthog.
const PROD_BASE =
  process.env.E2E_PROD_BASE_URL || process.env.PH_BASE_URL || 'http://localhost:4173';

// Only auto-start the dev server when the dev project will actually run. When a
// developer runs `--project=posthog-prod`, we must NOT spin up :3000 (the prod
// specs talk to an external :4173), and we must not block on it either.
// Handle both `--project=posthog-prod` and `--project posthog-prod` arg forms.
const argv = process.argv.join(' ');
const selectedProjects = (argv.match(/--project[= ]([^\s]+)/g) || []).map((m) =>
  m.replace(/--project[= ]/, '')
);
const runningOnlyProd =
  selectedProjects.length > 0 && selectedProjects.every((p) => p === 'posthog-prod');

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    // Output folder is OUTSIDE test-results to avoid the "reporter folder clashes
    // with tests output folder" warning (test-results is Playwright's artifact dir).
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      // Docs-page specs against the dev server (:3000).
      name: 'dev',
      testMatch: /graph-.*\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'], baseURL: DEV_BASE },
    },
    {
      // PostHog/A-B specs against the test-mode production build (:4173).
      name: 'posthog-prod',
      testMatch: /(posthog-events|support-ab-test)\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'], baseURL: PROD_BASE },
    },
  ],

  // Dev server for the "dev" project only. Skipped when running posthog-prod
  // in isolation (those specs use an externally-served :4173 build).
  webServer: runningOnlyProd
    ? undefined
    : {
        command: 'yarn start',
        url: DEV_BASE,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
