# Test Directory

This directory contains all tests for the project, organized by test type.

## Directory Structure

```
test/
├── e2e/              # End-to-end tests (Playwright)
│   ├── helpers/      # E2E test utilities
│   └── screenshots/  # Test screenshots
├── integ/            # Integration tests (Jest)
└── README.md         # This file
```

**Note**: Unit tests remain co-located with their components in `src/**/__tests__/` directories.

## Test Types

### Unit Tests
- **Location**: `src/**/__tests__/` (next to components)
- **Framework**: Jest
- **Purpose**: Test isolated functions and components in isolation
- **Run**: `yarn test`

### Integration Tests
- **Location**: `test/integ/`
- **Framework**: Jest
- **Purpose**: Test component interactions and rendering pipelines
- **Run**: `yarn test` (runs with unit tests)

### End-to-End Tests
- **Location**: `test/e2e/`
- **Framework**: Playwright
- **Purpose**: Test full application flow in real browser
- **Run**: `yarn test:e2e`

## Running Tests

### All Tests
```bash
# Unit + Integration tests
yarn test

# E2E tests
yarn test:e2e
```

### Unit & Integration Tests (Jest)
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

- **Unit tests**: Co-located with components for easy discovery and maintenance
- **Integration tests**: Centralized in `test/integ/` for cross-component testing
- **E2E tests**: Centralized in `test/e2e/` for full application testing

## More Information

- [E2E Tests README](./e2e/README.md) - Detailed E2E test documentation
- [Unit/Integration Tests README](../src/components/__tests__/README.md) - Detailed Jest test documentation

