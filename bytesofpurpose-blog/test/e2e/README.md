# GraphRenderer E2E Tests

End-to-end tests for the GraphRenderer component using Playwright. These tests verify the actual rendering behavior in a real browser environment.

## Setup

1. Install Playwright browsers (first time only):
   ```bash
   yarn playwright install
   ```

2. The development server will start automatically when running tests (via `webServer` config).
   If you want to run tests against an already-running server, that's fine too - Playwright will reuse it.

## Running Tests

### Run all E2E tests
```bash
yarn test:e2e
```

### Run tests in headed mode (see browser)
```bash
yarn test:e2e:headed
```

### Run tests with UI mode (interactive)
```bash
yarn test:e2e:ui
```

### Debug tests
```bash
yarn test:e2e:debug
```

### Run specific test file
```bash
yarn playwright test test/e2e/graph-renderer.spec.ts
```

### Run tests in specific browser
```bash
yarn playwright test --project=chromium
yarn playwright test --project=firefox
yarn playwright test --project=webkit
```

## Test Files

- **`graph-renderer.spec.ts`**: General E2E tests for graph rendering, interactions, and zoom behavior
- **`graph-title-rendering.spec.ts`**: Specific tests for title rendering, including ellipsis-only regression test

## What the Tests Verify

### General Rendering
- ✅ Canvas is rendered and visible
- ✅ Canvas has content (non-transparent pixels)
- ✅ Graph nodes are displayed
- ✅ Multiple nodes are rendered

### Title Rendering
- ✅ Text content is rendered (not just ellipsis)
- ✅ Text is visible at different zoom levels
- ✅ No "ellipsis-only" nodes (regression test)
- ✅ Text remains visible after rapid zoom changes
- ✅ Nodes with different title lengths render correctly

### Interactions
- ✅ Zoom in/out works correctly
- ✅ Pan/drag interactions work
- ✅ Node clicks are handled
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

