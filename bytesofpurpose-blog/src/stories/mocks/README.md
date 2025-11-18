# Storybook Mocks for Docusaurus Components

This directory contains mock implementations of Docusaurus-specific modules that are required for Storybook to build and run components that depend on Docusaurus features.

## Overview

Storybook runs in a browser-only environment and doesn't have access to Docusaurus-specific modules. When components import Docusaurus modules like `@docusaurus/BrowserOnly` or `@docusaurus/theme-common`, Storybook's webpack build fails with "Module not found" errors.

These mocks provide minimal implementations that match the Docusaurus API and allow components to render in Storybook without Docusaurus dependencies.

## Files

- **`BrowserOnlyMock.tsx`** - Mocks `@docusaurus/BrowserOnly` component
- **`theme-common-mock.ts`** - Mocks `@docusaurus/theme-common` module (useColorMode hook)
- **`LinkMock.tsx`** - Mocks `@docusaurus/Link` component for navigation
- **`useBaseUrlMock.ts`** - Mocks `@docusaurus/useBaseUrl` hook for URL resolution

For detailed documentation about each mock (why it's needed, how it works, which components use it), see the comments at the top of each file.

## Configuration

These mocks are automatically used via webpack aliases configured in `.storybook/main.ts`. When Storybook's webpack encounters Docusaurus imports, it automatically resolves them to these mock files.

## Important Note

These mocks are **only used in Storybook**. In the actual Docusaurus site, components use the real Docusaurus modules. The mocks are never included in the Docusaurus build.

