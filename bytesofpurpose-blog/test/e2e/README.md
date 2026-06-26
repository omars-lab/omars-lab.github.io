# E2E / regression tests

End-to-end tests (Playwright, Firefox) for the site. Two kinds of specs live here:
the GraphRenderer docs tests and the PostHog/A-B analytics tests. They have
**different server requirements**, so the suite is split into two Playwright
**projects** — mixing them is what used to produce false failures.

## Two projects (server modes)

| Project | Specs | Server it talks to | Why |
|---|---|---|---|
| `dev` | `graph-*.spec.ts`, `debug-menu.spec.ts`, `showcase-components.spec.ts` | Docusaurus **dev** server (`yarn start`, :3000) — auto-started | render docs pages incl. hot/draft content; the DebugMenu renders ONLY on localhost+dev (stripped from prod), so it must run here; the showcases include draft:true docs + a client-rendered `<UsedIn>` (needs a real browser) |
| `prod` | `accessibility`, `seo` | a **production build** served on :4173 | build-only transforms (e.g. the task-list aria-label rehype plugin) DON'T run in `yarn start`, so these must scan a real build |
| `posthog-prod` | `posthog-events`, `support-ab-test` | a **`POSTHOG_TEST_MODE=1` production build** served on :4173 | PostHog only inits in a prod build; its bot filter must be off for events to land |

The config (`playwright.config.ts`) auto-starts the :3000 dev server for the `dev`
project, and **skips** it when you run only the build-backed projects (`prod` /
`posthog-prod`) — those use an externally-served :4173 build (the `make` targets
build + serve + tear it down for you).

## Setup

Install Playwright browsers (first time only):
```bash
yarn playwright install
```

## Running tests

```bash
# Dev-server specs (graph/docs) — boots :3000 automatically:
make test-e2e                 # == yarn playwright test --project=dev

# A11y + SEO scans — build, serve :4173, run "prod" project, tear down:
make test-a11y                # axe WCAG 2 A/AA scan only
make test-seo                 # on-page SEO checks only
make test-prod-checks         # both (the whole "prod" project)

# PostHog/A-B specs — builds test-mode, serves :4173, runs, tears down:
make test-posthog             # == --project=posthog-prod against :4173

# Full regression (all three projects), from repo root:
make test-regression

# Interactive / debugging:
yarn test:e2e:ui              # UI mode
yarn test:e2e:headed          # see the browser
yarn test:e2e:debug           # step through
```

To run the prod specs by hand, start the :4173 test-mode build yourself (see the
spec headers / `make test-posthog`) and:
```bash
PH_BASE_URL=http://localhost:4173 yarn playwright test --project=posthog-prod
```

## Test files

- **`showcase-components.spec.ts`** — the component showcases under `/legend/components/*`
  (the "🎛️ Components" reference): each showcase loads at its new slug (no 404/crash), its
  `<UsedIn>` "Used in" block renders (both the populated-with-links and the honest-empty
  paths), and the live demos render (mermaid → `<svg>`, Card markup, inline TOCInline) (dev).
  Owned by the `maintain-showcase` skill.
- **`debug-menu.spec.ts`** — the floating localhost-only DebugMenu: renders on
  localhost, lists the registered experiment, and toggling a variant actually
  flips the rendered `<Support/>` copy (control ↔ test) + clear-overrides reverts (dev)
- **`draft-sidebar.spec.ts`** — dev-only docs-sidebar "D" badge on draft leaf docs:
  draft docs are badged, badging is selective, categories are never badged (dev).
  See `designs/design-draft-aware-sidebar`.
- **`dev-only-surfaces.spec.ts`** — asserts the dev-only surfaces (DebugMenu, draft
  badges) are ABSENT from the production build, and draft routes 404 (prod)
- **`graph-renderer.spec.ts`** — general graph rendering / interactions / zoom (dev)
- **`graph-title-rendering.spec.ts`** — title rendering, ellipsis-only regression (dev)
- **`graph-selection-state.spec.ts`** — node/edge selection state via the AI-framework
  doc graph (dev). Targets the **doc** route
  `/craft/generative-ai/mental-models/2025-11-10-ai-framework-landscape`
  (NOT `/blog/...` — that was a long-standing wrong path that 404'd).
- **`posthog-events.spec.ts`** — PostHog init + $pageview/autocapture/scroll (posthog-prod)
- **`support-ab-test.spec.ts`** — Support-button A/B variant rendering (posthog-prod)
- **`accessibility.spec.ts`** — axe-core WCAG 2 A/AA scan of home/blog/docs/post in
  **both color modes** (prod). `make test-a11y`.
- **`seo.spec.ts`** — on-page SEO essentials (title, meta description, canonical,
  OG/Twitter tags, no generic link text) across key pages (prod). `make test-seo`.

## Accessibility scanning (axe-core)

`accessibility.spec.ts` scans the key templates with `@axe-core/playwright` against
WCAG 2.0/2.1 A & AA, in light **and** dark mode (contrast differs by mode — axe
catches dark-mode issues Lighthouse's default light-only run misses).

- **Zero-tolerance pages:** home, blog index, docs shell — any violation fails.
- **Baselined pages:** authored articles may carry pre-existing content/theme debt.
  Each such page allow-lists specific rule IDs in the spec, so the gate stays green
  yet still fails on anything **new**. There are currently **no baselines** — all
  pages (including the `evolution-of-a-repo` post) are strict `[]`. The former
  `color-contrast` debt (Prism string/builtin/boolean/class-name/literal-property
  tokens), task-list labels (rehype plugin), and prose-link underlines are all fixed.

Runs against a **production build** (`make test-a11y` builds + serves :4173), because
the task-list aria-label rehype plugin only runs at build time, not in `yarn start`.

## Known flaky / open

- 3 cases in `graph-selection-state.spec.ts` (deep-link edge selection: "clicking
  node after clicking edge", "clicking edge after clicking node", "selecting node
  from pane unselects edge") intermittently time out waiting for the edge-details
  pane after a `#...-edge-...` URL hash. These are graph-component/canvas-timing
  issues, not infra — the page loads and 17/20 graph cases pass. Track separately.
- `draft-sidebar.spec.ts` lands on `/self/personal-growth` (a published README whose Self
  sidebar carries ~13 draft `habits-*` leaves) and asserts the dev-only "D" badge. It is
  green on a CLEAN dev server; if it fails, suspect a stale prod `.docusaurus/` cache
  (see the cache gotcha below) before anything else.

## Gotchas that look like failures (but aren't)

Before calling any failure a code regression, rule these out (each cost real debugging
time at least once):

- **Stale `:3000` dev server.** The `dev` project uses `reuseExistingServer: !CI`, so it
  attaches to whatever is already on :3000. If that server is mid-compile-error, its
  `#webpack-dev-server-client-overlay` iframe intercepts every click → all click-based
  specs fail spuriously. **Fix:** start a fresh server on another port and point specs at
  it via `E2E_DEV_BASE_URL=http://localhost:3100` (don't fight the user's :3000).
- **Stale production `.docusaurus/` cache → draft-less sidebar.** `yarn build` sets
  `NODE_ENV=production` and writes content artifacts to `.docusaurus/` that EXCLUDE draft
  docs (`isDraft = isProduction(env) && draft`). A dev server (`yarn start`) that reuses
  that cache serves a **draft-less sidebar**, so `draft-sidebar.spec.ts` (and anything
  depending on draft docs appearing) fails — looking flaky/order-dependent when it isn't.
  **Fix:** `yarn docusaurus clear` before the dev e2e run. `make test-e2e` already does
  this; if you run the `dev` project by hand after a build, clear first. Verify the dev
  cache is correct: `grep -c habits-reading .docusaurus/routes.js` should be > 0 (drafts
  present in dev). Drafts ARE kept in dev — the trap is purely the leftover prod cache.
- **Test hardcodes a moved slug.** A spec's `goto('/docs/<old-slug>')` after an IA move
  lands on the redirect **stub** (no canvas/content) → timeout. `make validate-links`
  catches this (`test-stale-slug`); fix the spec to the new slug.
- **`make test-regression` STOPS at the first failing project**, so a `dev` failure hides
  the `prod`/`posthog` results entirely. Run `make test-a11y` / `make test-posthog`
  directly to see them.

### Verification mechanics (serve/build URL shapes)

- The docs are **two separate instances**: `craft` (routeBasePath **`/craft`**) and
  `self` (routeBasePath **`/self`**) — there is NO `/docs` route anymore. Doc↔doc links
  and redirect `to:` use `/craft/<slug>` / `/self/<slug>`; slugs in frontmatter are
  instance-RELATIVE (a topic README has `slug: /`, a nested doc `slug: /generative-ai`).
  The Welcome chooser is a standalone page at **`/welcome`** (in neither instance).
- The prod build emits **`build/craft/<slug>.html`** / **`build/self/<slug>.html`**, NOT
  `.../index.html`. Checking for the wrong shape makes real pages look "missing."
- `docusaurus serve` **301-redirects a trailing slash** to the non-slash form. When
  curling, hit the path **without** a trailing `/` (or follow redirects) — else every
  request looks like a 301 regardless of the real status. Client redirects are
  HTTP-200 pages with a `<meta http-equiv="refresh" … url=…>` tag — grep that to confirm
  the target.
- **`@docusaurus/plugin-client-redirects` must pin to the EXACT `@docusaurus/core`
  version** (e.g. `3.9.2`, not `^3.9.1`) — a `^` range can resolve to a newer minor and
  the build throws `Invalid name=… version number=…`.

## What the Tests Verify

### General Rendering
- ✅ Canvas is rendered and visible
- ✅ Canvas has content (non-transparent pixels)
- ✅ Graph nodes are displayed
- ✅ Multiple nodes are rendered

### Title Rendering
- ✅ Text content is rendered (not just ellipsis)
- ✅ Titles are truncated to max 10 chars (7 + "...")
- ✅ Single line rendering (not multi-line)
- ✅ Text is visible at different zoom levels
- ✅ No "ellipsis-only" nodes (regression test)
- ✅ Text remains visible after rapid zoom changes
- ✅ Nodes with different title lengths render correctly

### Interactions
- ✅ Zoom in/out works correctly
- ✅ Pan/drag interactions work
- ✅ Node clicks select nodes (sun-like theming)
- ✅ Node selection via URL fragment works
- ✅ Canvas remains stable after interactions

### Visual Verification
- Screenshots are saved to `test/e2e/screenshots/` for manual inspection:
  - `graph-rendered.png` - Initial graph rendering
  - `graph-multiple-nodes.png` - Graph with multiple nodes
  - `title-rendering.png` - Title rendering verification
  - `different-title-lengths.png` - Different title lengths
  - `ellipsis-regression-test.png` - Ellipsis-only regression test

## Debugging Failed Tests

1. **View screenshots**: Check `test/e2e/screenshots/` for visual evidence
2. **Run in headed mode**: Use `yarn test:e2e:headed` to see what's happening
3. **Use debug mode**: Use `yarn test:e2e:debug` to step through tests
4. **Check Playwright report**: After running tests, the HTML report is saved to `test-results/html-report/index.html`. Open it in your browser to view results offline.

## Test Strategy

Since extracting exact text from canvas is challenging, these tests use:

1. **Pixel analysis**: Check for non-transparent pixels and high-contrast regions
2. **Text region detection**: Identify areas that likely contain text
3. **Visual verification**: Screenshots for manual inspection
4. **Stability checks**: Verify canvas remains stable after interactions

For more precise text verification, consider:
- Using OCR libraries (e.g., Tesseract.js)
- Adding test-specific data attributes to nodes
- Using canvas text measurement APIs
- Visual regression testing with pixel comparison

## CI/CD Integration

The tests are configured to:
- Run in CI environments
- Retry failed tests (2 retries in CI)
- Generate HTML reports
- Take screenshots on failure
- Capture traces for debugging

## Test Execution Notes

**Browser Cleanup**: Playwright automatically handles browser and page cleanup. No manual cleanup needed.

**Server Process**: The `webServer` process may stay running after tests complete (when `reuseExistingServer: true`). This is expected behavior:
- Tests will complete and exit normally
- The dev server stays alive for faster test re-runs
- To stop the server after tests, set `reuseExistingServer: false` in `playwright.config.ts`

**Test Speed**: Tests use optimized timeouts and single-worker execution for faster, more reliable runs.

## Limitations

- Text extraction from canvas is approximate (uses pixel analysis)
- Tests rely on visual patterns rather than exact text matching
- Some tests may be flaky if graph layout changes between runs
- Screenshots are for manual verification, not automated comparison

## Future Improvements

- [ ] Add OCR-based text extraction for precise text verification
- [ ] Add visual regression testing with pixel comparison
- [ ] Add tests for specific graph data structures
- [ ] Add performance tests for large graphs
- [ ] Add accessibility tests

