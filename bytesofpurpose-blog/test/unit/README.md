# GraphRenderer Unit Tests

This directory contains unit tests for the GraphRenderer component. 

- **E2E tests** are in [`../e2e/`](../e2e/)

## Running Tests

### Unit Tests (Jest)
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

See [`../README.md`](../README.md) for an overview of all test types.

## Test Structure

### Unit Tests (`GraphRenderer.title.test.ts`)
Tests for isolated title display logic:
- Text truncation to 10 characters (7 chars + "...")
- Single line rendering
- Ellipsis handling
- Edge cases

## What the Tests Catch

The unit tests verify:
- ✅ **Truncation logic**: Text is truncated to exactly 10 chars (7 + "...")
- ✅ **Edge cases**: Empty strings, exactly 10 chars, very long text
- ✅ **Ellipsis handling**: Ellipsis is added correctly when truncating

**Note**: For actual rendering behavior (canvas drawing, zoom levels, node sizes), see E2E tests in `test/e2e/`

## Test Utilities

The `test/utils/canvasMock.ts` file provides utilities for:
- Creating mock canvas 2D contexts with call tracking
- `getFillTextCalls()`: Returns all text that was drawn to canvas
- `getMeasureTextCalls()`: Returns all text measurements
- Creating mock node objects

## Example: Testing for "Ellipsis Only" Bug

```typescript
import { truncateToMaxChars } from './GraphRenderer.title.test';

it('should truncate to 10 chars correctly', () => {
  const result = truncateToMaxChars('A very long title');
  
  expect(result.length).toBe(10);
  expect(result).toBe('A very l...');
  expect(result.endsWith('...')).toBe(true);
});
```

## Limitations

The current unit tests test isolated logic functions but don't actually render the React component. For full rendering and interaction testing, use:

1. **E2E tests** (`test/e2e/`) - Test actual rendering in a real browser with Playwright
2. **Visual regression testing** - To catch visual issues

## Adding New Tests

When adding new tests:

1. **Unit tests**: Test isolated logic functions (truncation, formatting, etc.)
2. **E2E tests**: Test actual rendering, user interactions, and visual behavior
3. **Test current implementation**: Max 10 chars (7 + "..."), single line rendering

## Debugging Failed Tests

If a test fails, check:
1. Truncation logic - Is the text being truncated correctly?
2. Character count - Does the result have exactly 10 chars when truncated?
3. Ellipsis placement - Is "..." added at the end correctly?

