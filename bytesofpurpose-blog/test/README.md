# Test Directory

This directory contains all tests for the project, organized by test type.

## Directory Structure

```
test/
├── e2e/              # End-to-end tests (Playwright)
│   ├── helpers/      # E2E test utilities
│   └── screenshots/  # Test screenshots
├── unit/             # Unit tests (Jest)
├── utils/            # Test utilities (canvasMock, etc.)
├── setup.ts          # Jest setup file
└── README.md         # This file
```

## Test Types

### Unit Tests
- **Location**: `test/unit/`
- **Framework**: Jest
- **Purpose**: Test isolated functions and logic (e.g., text truncation)
- **Run**: `yarn test`

### End-to-End Tests
- **Location**: `test/e2e/`
- **Framework**: Playwright
- **Purpose**: Test full application flow in real browser
- **Run**: `yarn test:e2e`

## Running Tests

### All Tests
```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e
```

### Unit Tests (Jest)
```bash
# Run all Jest tests
yarn test

# Watch mode
yarn test:watch

# With coverage
yarn test:coverage
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
yarn test:e2e

# Run in headed mode (see browser)
yarn test:e2e:headed

# Run with UI mode (interactive)
yarn test:e2e:ui

# Debug mode
yarn test:e2e:debug
```

## Test Organization Philosophy

- **Unit tests**: Centralized in `test/unit/` for isolated function testing
- **E2E tests**: Centralized in `test/e2e/` for full application testing in real browser
- **Test utilities**: Shared utilities in `test/utils/` for mocking and helpers

## More Information

- [E2E Tests README](./e2e/README.md) - Detailed E2E test documentation
- [Unit Tests README](./unit/README.md) - Detailed Jest unit test documentation

