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

// Only auto-start the :3000 dev server when the dev project will actually run.
// The build-backed projects (prod, posthog-prod) talk to an external :4173, so
// we must NOT spin up (or block on) :3000 when only those are selected.
// Handle both `--project=name` and `--project name` arg forms.
const argv = process.argv.join(' ');
const selectedProjects = (argv.match(/--project[= ]([^\s]+)/g) || []).map((m) =>
  m.replace(/--project[= ]/, '')
);
const BUILD_BACKED = new Set(['prod', 'posthog-prod', 'bookmark-proof']);
const runningOnlyProd =
  selectedProjects.length > 0 && selectedProjects.every((p) => BUILD_BACKED.has(p));

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

  // Visual-regression tolerances: font anti-aliasing differs slightly machine-to-machine, so allow a
  // small per-pixel + total-pixel slack. The seam/white-out/overflow artifacts this guards against are
  // FAR larger than this threshold, so they still fail the diff. Tune up only if it flakes on AA noise.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.012,
      threshold: 0.2,
      animations: 'disabled',
    },
  },

  projects: [
    {
      // Docs/graph specs against the dev server (:3000). The graph renders hot
      // doc content and doesn't depend on build-only transforms.
      name: 'dev',
      // graph-* specs + the DebugMenu spec. The DebugMenu renders ONLY on the
      // dev server (localhost + non-prod build) — it's stripped from prod — so it
      // must run here against :3000, not the build-backed projects.
      testMatch: /(graph-.*|debug-menu|draft-sidebar|blog-draft-badge|craft-self-split|navbar-auth|navbar-overflow|reconstruction-posts|co-design-imports|showcase-components|homepage|hero-loading)\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'], baseURL: DEV_BASE },
    },
    {
      // HERO SCROLL PERFORMANCE against the dev server (:3000). CHROMIUM-only: it uses CDP
      // `Emulation.setCPUThrottlingRate` to slow the CPU down (reproduce slow-hardware scroll lag on a
      // fast runner), which Firefox/WebKit can't do. Catches the pickets layout-thrash class of bug that
      // correctness tests + a fast-box frame budget both miss. Runs its own throttled contexts.
      name: 'hero-perf',
      testMatch: /hero-perf\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: DEV_BASE },
    },
    {
      // A11y + SEO scans against a PRODUCTION build (:4173). These MUST run on a
      // real build, not the dev server, because build-only transforms (e.g. the
      // task-list aria-label rehype plugin) don't run in `yarn start`. Start the
      // build/serve first — `make test-a11y` / `make test-seo` handle that.
      name: 'prod',
      testMatch: /(accessibility|seo|dev-only-surfaces|reconstruction-posts|co-design-imports|kanban-board)\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'], baseURL: PROD_BASE },
    },
    {
      // PostHog/A-B specs against the test-mode production build (:4173).
      name: 'posthog-prod',
      testMatch: /(posthog-events|support-ab-test|ingress-attribution|vote|support-page)\.spec\.ts$/,
      use: { ...devices['Desktop Firefox'], baseURL: PROD_BASE },
    },
    {
      // Manual proof harness: launches its OWN real headed Chrome (ignores this
      // project's browser) to read the on-disk bookmark store. Gated behind
      // PROVE_BOOKMARK=1 inside the spec; NOT part of `make test-regression`.
      // Run: PROVE_BOOKMARK=1 npx playwright test --project=bookmark-proof
      name: 'bookmark-proof',
      testMatch: /(bookmark-rewrite-proof|bookmarklet-proof)\.spec\.ts$/,
      use: { baseURL: PROD_BASE },
    },
    {
      // VISUAL REGRESSION against the dev server (:3000). Screenshots key surfaces (esp. the homepage
      // hero, both A/B variants) across a MATRIX of pixel densities (DPR 1 + 2), viewports, and
      // light/dark, comparing to committed baselines (toHaveScreenshot). This is what catches retina-
      // only / animation-frame artifacts (a compositing seam, a flash white-out, overflow) that a
      // single-DPR functional spec is blind to. Uses CHROMIUM for stable, deterministic raster (the
      // baselines are Chromium-rendered). The visual.spec drives the DPR/viewport matrix itself via
      // its own browser contexts, so the project browser is only the default fallback.
      // Run: npx playwright test --project=visual   (first run / intentional change: add --update-snapshots)
      name: 'visual',
      testMatch: /visual\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: DEV_BASE },
    },
    {
      // Premium hard-gate proof against an ENCRYPTED production build (:4173). Asserts the
      // gated body is ciphertext when anonymous (V3) and decrypts when signed in (round-trip).
      // The build MUST be produced with STATICRYPT_PASSPHRASE=e2e-premium-passphrase (the spec
      // stubs /api/unlock-key with that value). Run via `make test-premium-e2e`.
      name: 'premium',
      testMatch: /(premium-gating|signin-redirect)\.spec\.ts$/,
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
