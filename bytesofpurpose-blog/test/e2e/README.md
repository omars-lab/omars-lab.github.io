# E2E / regression tests

End-to-end tests (Playwright, Firefox) for the site. Two kinds of specs live here:
the GraphRenderer docs tests and the PostHog/A-B analytics tests. They have
**different server requirements**, so the suite is split into two Playwright
**projects** — mixing them is what used to produce false failures.

## Two projects (server modes)

| Project | Specs | Server it talks to | Why |
|---|---|---|---|
| `dev` | `graph-*.spec.ts` | Docusaurus **dev** server (`yarn start`, :3000) — auto-started | render docs pages incl. hot/draft content |
| `posthog-prod` | `posthog-events`, `support-ab-test` | a **`POSTHOG_TEST_MODE=1` production build** served on :4173 | PostHog only inits in a prod build; its bot filter must be off for events to land |

The config (`playwright.config.ts`) auto-starts the :3000 dev server for the `dev`
project, and **skips** it when you run `--project=posthog-prod` alone (those specs
use an externally-served :4173 build).

## Setup

Install Playwright browsers (first time only):
```bash
yarn playwright install
```

## Running tests

```bash
# Dev-server specs (graph/docs) — boots :3000 automatically:
make test-e2e                 # == yarn playwright test --project=dev

# PostHog/A-B specs — builds test-mode, serves :4173, runs, tears down:
make test-posthog             # == --project=posthog-prod against :4173

# Full regression (both projects, both server modes), from repo root:
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

- **`graph-renderer.spec.ts`** — general graph rendering / interactions / zoom (dev)
- **`graph-title-rendering.spec.ts`** — title rendering, ellipsis-only regression (dev)
- **`graph-selection-state.spec.ts`** — node/edge selection state via the AI-framework
  doc graph (dev). Targets the **doc** route
  `/docs/mental-models/understanding-the-genai-domain/ai-framework-landscape`
  (NOT `/blog/...` — that was a long-standing wrong path that 404'd).
- **`posthog-events.spec.ts`** — PostHog init + $pageview/autocapture/scroll (posthog-prod)
- **`support-ab-test.spec.ts`** — Support-button A/B variant rendering (posthog-prod)
- **`accessibility.spec.ts`** — axe-core WCAG 2 A/AA scan of home/blog/docs/post in
  **both color modes** (dev). `make test-a11y`.
- **`seo.spec.ts`** — on-page SEO essentials (title, meta description, canonical,
  OG/Twitter tags, no generic link text) across key pages (dev). `make test-seo`.

## Accessibility scanning (axe-core)

`accessibility.spec.ts` scans the key templates with `@axe-core/playwright` against
WCAG 2.0/2.1 A & AA, in light **and** dark mode (contrast differs by mode — axe
catches dark-mode issues Lighthouse's default light-only run misses).

- **Zero-tolerance pages:** home, blog index, docs shell — any violation fails.
- **Baselined pages:** authored articles may carry pre-existing content/theme debt
  (Prism code-token contrast, markdown task-list `<input>` labels, prose link
  underlines). Each such page allow-lists specific rule IDs in the spec, so the gate
  stays green yet still fails on anything **new**. Burn the baseline down (tracked
  task) and tighten to `[]`.

Run: `make test-a11y` (boots the :3000 dev server automatically).

## Known flaky / open

- 3 cases in `graph-selection-state.spec.ts` (deep-link edge selection: "clicking
  node after clicking edge", "clicking edge after clicking node", "selecting node
  from pane unselects edge") intermittently time out waiting for the edge-details
  pane after a `#...-edge-...` URL hash. These are graph-component/canvas-timing
  issues, not infra — the page loads and 17/20 graph cases pass. Track separately.

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

