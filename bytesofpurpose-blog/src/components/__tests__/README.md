# GraphRenderer Tests

This directory contains unit tests for the GraphRenderer component. 

- **Integration tests** are in [`test/integ/`](../../../test/integ/)
- **E2E tests** are in [`test/e2e/`](../../../test/e2e/)

## Running Tests

### Unit & Integration Tests (Jest)
```bash
# Run all tests
yarn test

# Run tests in watch mode (for development)
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

### End-to-End Tests (Playwright)
```bash
# Run all E2E tests
yarn test:e2e

# Run E2E tests in headed mode (see browser)
yarn test:e2e:headed

# Run E2E tests with UI mode (interactive)
yarn test:e2e:ui

# Debug E2E tests
yarn test:e2e:debug
```

See [`test/README.md`](../../../test/README.md) for an overview of all test types.

## Test Structure

### Unit Tests (`GraphRenderer.title.test.ts`)
Tests for isolated title display logic:
- Text truncation to 20 characters
- Text distribution across 3 lines
- Ellipsis handling
- Edge cases

**Note**: Integration tests have been moved to [`test/integ/GraphRenderer.integration.test.ts`](../../../test/integ/GraphRenderer.integration.test.ts)

## What the Tests Catch

The integration tests will catch issues like:
- ✅ **"Ellipsis only" rendering**: Verifies no line is drawn as just `...`
- ✅ **Empty text rendering**: Ensures no empty strings are drawn
- ✅ **Missing text**: Verifies text is actually drawn to canvas
- ✅ **Zoom level issues**: Tests behavior across different zoom levels
- ✅ **Node size issues**: Tests both small (leaf) and large (root) nodes

## Test Utilities

The `src/test/utils/canvasMock.ts` file provides utilities for:
- Creating mock canvas 2D contexts with call tracking
- `getFillTextCalls()`: Returns all text that was drawn to canvas
- `getMeasureTextCalls()`: Returns all text measurements
- Creating mock node objects

## Example: Testing for "Ellipsis Only" Bug

```typescript
import { createMockCanvasContext, createMockNode } from '../../test/utils/canvasMock';
import { simulateDrawTitle } from './GraphRenderer.integration.test';

it('should NOT render only ellipsis', () => {
  const mockCtx = createMockCanvasContext();
  const node = createMockNode('test', 0, 0, false);
  
  simulateDrawTitle(mockCtx, node, 8, 'Long Title', 1.0);
  
  const fillTextCalls = mockCtx.getFillTextCalls();
  
  // Critical assertion: No line should be just ellipsis
  fillTextCalls.forEach(call => {
    expect(call.text).not.toBe('...');
    expect(call.text.trim().length).toBeGreaterThan(3);
  });
});
```

## Limitations

The current tests simulate the rendering pipeline but don't actually render the React component in a browser. For true end-to-end testing that simulates real browser behavior, consider:

1. **Playwright** - For visual regression and E2E tests
2. **Cypress** - For component testing in a real browser
3. **Visual regression testing** - To catch visual issues

## Adding New Tests

When adding new tests:

1. **Unit tests**: Test isolated logic functions
2. **Integration tests**: Use `simulateDrawTitle()` to test full rendering pipeline
3. **Canvas verification**: Always check `getFillTextCalls()` to verify what was drawn
4. **Zoom testing**: Test at multiple zoom levels (0.5x, 1.0x, 2.0x, 3.0x)
5. **Node size testing**: Test both leaf (radius 8) and root (radius 12) nodes

## Debugging Failed Tests

If a test fails, check:
1. `fillTextCalls` - What text was actually drawn?
2. `measureTextCalls` - What text was measured?
3. Font size - Was the font size calculated correctly?
4. Available width - Was the width calculation correct?

