# Development Guide

This guide covers everything you need to know to develop, test, and maintain the Bytes of Purpose blog and documentation site.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Component Development](#component-development)
- [Storybook](#storybook)
- [Testing](#testing)
- [Build System](#build-system)
- [TypeScript & Babel Configuration](#typescript--babel-configuration)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)

## Prerequisites

- **Node.js**: v16 or higher
- **Yarn**: Package manager (install globally: `npm install -g yarn`)
- **Git**: Version control

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/omars-lab/omars-lab.github.io.git
cd omars-lab.github.io
```

### 2. Install Dependencies

```bash
# Install dependencies for the Docusaurus site
make install
```

### 3. Verify Installation

```bash
# Check Docusaurus version
make version

# View all available commands
make help
```

## Development Workflow

### Starting the Development Server

```bash
# Start Docusaurus dev server (includes Storybook build)
make start

# Start on a custom port
PORT=8080 make start

# Start in production mode
make start-prod
```

The development server will:
- Start Docusaurus on `http://localhost:3000` (or your specified port)
- Automatically build Storybook to `static/storybook/`
- Enable hot-reloading for changes
- Serve Storybook at `/storybook/` route

### Available Make Commands

```bash
# Development
make start              # Start dev server (builds Storybook first)
make start-prod         # Start dev server in production mode
make storybook          # Start Storybook dev server (port 6006)
make build-storybook    # Build Storybook static site

# Building
make build              # Build for production (includes Storybook)
make serve              # Serve production build locally

# Maintenance
make install            # Install dependencies
make clear              # Clear Docusaurus cache
make clean              # Clean build artifacts and dependencies
make upgrade            # Upgrade Docusaurus packages
make version            # Show Docusaurus version

# Content Management
make fix-frontmatter    # Fix frontmatter issues using AI
make fix-blog-posts     # Fix frontmatter for blog posts
make check              # Check MDX files for issues

# Deployment
make deploy             # Deploy to GitHub Pages

# Help
make help               # Show all available commands
```

> **Note**: For advanced usage or direct access to underlying tools, see `bytesofpurpose-blog/package.json` for all available scripts.

## Component Development

### Component Structure

Components are located in `bytesofpurpose-blog/src/components/`:

```
src/components/
├── Graph/                    # Graph visualization components
│   ├── GraphRenderer.tsx     # Main graph component
│   ├── GraphCanvas.tsx       # Canvas wrapper
│   ├── GraphMenuBar.tsx      # Menu bar controls
│   ├── GraphInfoPanel.tsx    # Side panel
│   ├── useGraphState.ts      # State management hook
│   ├── useGraphData.ts       # Data transformation hook
│   ├── useGraphInteractions.ts # Event handlers hook
│   ├── *.stories.tsx         # Storybook stories
│   └── docs/                 # Component documentation
├── Card/                     # Card components
│   ├── CardHeader/
│   ├── CardBody/
│   ├── CardFooter/
│   └── CardImage/
├── TimeLine/                 # Timeline components
├── ContributionTimeline.tsx  # Contribution timeline
├── HomepageFeatures.tsx      # Homepage features
└── ...                       # Other components
```

### Creating a New Component

1. **Create the component file**:

```typescript
// src/components/MyComponent.tsx
import React from 'react';
import styles from './MyComponent.module.css';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div className={styles.container} onClick={onClick}>
      <h2>{title}</h2>
    </div>
  );
}
```

2. **Create styles** (if needed):

```css
/* src/components/MyComponent.module.css */
.container {
  padding: 1rem;
  border: 1px solid #ccc;
}
```

3. **Create Storybook stories**:

```typescript
// src/components/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import MyComponent from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Hello World',
  },
};
```

4. **Use in MDX/Docusaurus**:

```mdx
import MyComponent from '@site/src/components/MyComponent';

<MyComponent title="My Title" />
```

### Component Best Practices

- **TypeScript**: All components should be written in TypeScript
- **Props Interface**: Define clear prop interfaces
- **CSS Modules**: Use CSS modules for component styles
- **Documentation**: Add JSDoc comments for complex components
- **Stories**: Create Storybook stories for all components
- **Testing**: Write unit tests for component logic

## Storybook

### Overview

Storybook is integrated into the Docusaurus site and provides:
- Interactive component documentation
- Isolated component development
- Visual testing
- Component showcase

### Accessing Storybook

**In Development:**
- **Standalone**: `http://localhost:6006` (when running `yarn storybook`)
- **Integrated**: `http://localhost:3000/storybook/` (when running `yarn start`)

**In Production:**
- Available at `/storybook/` route in the built site

### Storybook Configuration

**Main Config**: `.storybook/main.ts`
- Defines story file patterns
- Configures webpack
- Sets up Babel integration
- Handles TypeScript processing

**Preview Config**: `.storybook/preview.ts`
- Global decorators
- Default parameters
- Theme configuration

### Creating Stories

Stories are located alongside components or in `src/stories/`:

```typescript
// src/components/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import MyComponent from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Default Title',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Clickable',
    onClick: () => alert('Clicked!'),
  },
};
```

### Existing Stories

**Graph Components:**
- `src/components/Graph/Graph.stories.tsx` - Architecture overview
- `src/components/Graph/GraphMenuBar.stories.tsx` - Menu bar stories
- `src/components/Graph/GraphInfoPanel.stories.tsx` - Info panel stories

**Example Stories:**
- `src/stories/Button.stories.ts` - Button examples
- `src/stories/Header.stories.ts` - Header examples
- `src/stories/Page.stories.ts` - Page examples

### Storybook Development

```bash
# Start Storybook dev server (standalone)
make storybook

# Build Storybook for production
make build-storybook
```

The built Storybook is output to `static/storybook/` and is automatically served by Docusaurus at `/storybook/`.

### Storybook Integration with Docusaurus

Storybook is integrated into Docusaurus via:
- **Build Process**: Storybook builds to `static/storybook/` before Docusaurus starts
- **Route**: Docusaurus page at `src/pages/storybook.tsx` iframes the Storybook build
- **Public Path**: Configured to use relative paths for proper asset loading

## Testing

### Unit Tests

Tests are located in `bytesofpurpose-blog/test/`. Run tests directly:

```bash
cd bytesofpurpose-blog
yarn test              # Run all tests
yarn test:watch        # Watch mode
yarn test:coverage     # With coverage
```

### End-to-End Tests

E2E tests use Playwright and are in `bytesofpurpose-blog/test/e2e/`. Run tests directly:

```bash
cd bytesofpurpose-blog
yarn test:e2e          # Run E2E tests
yarn test:e2e:ui       # With UI
yarn test:e2e:headed   # Headed mode (see browser)
yarn test:e2e:debug   # Debug mode
```

> **Note**: Test commands are run directly via yarn as they require specific test configurations.

### Test Configuration

- **Jest**: `jest.config.js` - Unit test configuration
- **Playwright**: `playwright.config.ts` - E2E test configuration
- **Test Utils**: `test/utils/` - Shared test utilities

## Build System

### Development Build

```bash
# Start dev server (auto-rebuilds on changes)
make start
```

### Production Build

```bash
# Build for production (includes Storybook)
make build

# Serve the built site locally
make serve

# The built site is in bytesofpurpose-blog/build/
```

### Build Process

1. **Storybook Build**: `yarn build-storybook` → `static/storybook/`
2. **Docusaurus Build**: `yarn build` → `build/`
3. **Static Assets**: Copied from `static/` to `build/`

### Build Output

```
bytesofpurpose-blog/
├── build/              # Production build
│   ├── blog/           # Blog pages
│   ├── docs/           # Documentation pages
│   ├── storybook/      # Storybook static site
│   └── assets/         # Bundled assets
└── static/             # Static assets (copied to build)
    └── storybook/      # Storybook build output
```

## TypeScript & Babel Configuration

### Overview

This project uses a unified Babel + TypeScript setup:
- **TypeScript**: Type checking and IDE support
- **Babel**: Transpilation (removes types, converts syntax)
- **Shared Config**: One `babel.config.js` and `tsconfig.json` for both Docusaurus and Storybook

### TypeScript Configuration

**File**: `bytesofpurpose-blog/tsconfig.json`

```json
{
  "extends": "@docusaurus/tsconfig",
  "compilerOptions": {
    "baseUrl": ".",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true
  },
  "include": [
    "src/**/*",
    ".storybook/**/*"
  ]
}
```

**Key Points:**
- Extends Docusaurus TypeScript config
- Includes both `src/` and `.storybook/` directories
- Uses modern module resolution for bundler compatibility

### Babel Configuration

**File**: `bytesofpurpose-blog/babel.config.js`

```javascript
module.exports = {
  presets: [
    [require.resolve('@babel/preset-typescript'), { 
      isTSX: true, 
      allExtensions: true 
    }],
    require.resolve('@docusaurus/core/lib/babel/preset'),
  ],
};
```

**Key Points:**
- `@babel/preset-typescript`: Strips TypeScript types
- `@docusaurus/core/lib/babel/preset`: Docusaurus transformations
- Shared by both Docusaurus and Storybook

### How It Works

1. **TypeScript** checks types (in IDE and optionally during build)
2. **Babel** transpiles TypeScript → JavaScript (removes types, converts syntax)
3. **Webpack** bundles the JavaScript
4. **Storybook/Docusaurus** serve the bundled code

**Important**: TypeScript doesn't compile code - it only checks types. Babel does the actual transpilation.

### Storybook Integration

Storybook uses `babel-loader` to process TypeScript files:

**Configuration**: `.storybook/main.ts`

```typescript
webpackFinal: async (config) => {
  // Ensure babel-loader processes TypeScript files FIRST
  if (config.module?.rules) {
    config.module.rules.unshift({
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [{ loader: require.resolve('babel-loader') }],
    });
  }
  return config;
}
```

**Key Points:**
- `babel-loader` must run **before** other loaders (using `unshift()`)
- Automatically uses `babel.config.js` from project root
- Handles `import type` and other TypeScript syntax

For more details, see: `blog/2025-11-16-storybook-typescript-babel-setup.md`

## Project Structure

```
omars-lab.github.io/
├── bytesofpurpose-blog/       # Main Docusaurus site
│   ├── .storybook/           # Storybook configuration
│   │   ├── main.ts           # Storybook webpack config
│   │   └── preview.ts        # Storybook preview config
│   ├── blog/                 # Blog posts
│   ├── designs/              # Design posts
│   ├── docs/                 # Documentation
│   ├── src/                  # Source code
│   │   ├── components/      # React components
│   │   ├── pages/           # Docusaurus pages
│   │   ├── stories/         # Example Storybook stories
│   │   └── css/             # Global styles
│   ├── static/              # Static assets
│   │   └── storybook/       # Storybook build output
│   ├── test/                # Tests
│   │   ├── e2e/             # E2E tests
│   │   └── unit/            # Unit tests
│   ├── babel.config.js      # Babel configuration
│   ├── tsconfig.json        # TypeScript configuration
│   └── package.json         # Dependencies and scripts
├── Makefile                 # Build automation
└── README.md                # Project overview
```

## Common Tasks

### Adding a New Component

1. Create component in `src/components/`
2. Create Storybook stories
3. Add to documentation if needed
4. Write tests

### Updating Dependencies

```bash
# Upgrade Docusaurus packages
make upgrade

# For other packages, update bytesofpurpose-blog/package.json and run:
make install
```

### Clearing Cache

```bash
# Clear Docusaurus cache
make clear

# Clean build artifacts and dependencies
make clean
```

### Debugging Build Issues

1. **Clear cache**: `make clear`
2. **Rebuild**: `make build`
3. **Check logs**: Look for specific error messages
4. **Type check**: Run `yarn typecheck` in `bytesofpurpose-blog/` directory

### Type Checking

```bash
# Type check (run from bytesofpurpose-blog directory)
cd bytesofpurpose-blog
yarn typecheck
```

### Viewing Storybook

- **Development**: `http://localhost:6006` (standalone) or `http://localhost:3000/storybook/` (integrated)
- **Production**: `/storybook/` route in built site

### Running Tests

```bash
# Run tests from bytesofpurpose-blog directory
cd bytesofpurpose-blog

# Unit tests
yarn test

# E2E tests
yarn test:e2e
```

## Troubleshooting

### Storybook Not Loading

1. **Rebuild Storybook**: `make build-storybook`
2. **Check paths**: Ensure `static/storybook/index.html` exists
3. **Clear cache**: `make clear`
4. **Check console**: Look for JavaScript errors

### TypeScript Errors

1. **Run typecheck**: `cd bytesofpurpose-blog && yarn typecheck`
2. **Check tsconfig.json**: Ensure files are included
3. **Restart IDE**: Sometimes IDE cache needs refresh

### Build Failures

1. **Clear cache**: `make clear`
2. **Reinstall**: `make clean && make install`
3. **Check Node version**: Ensure Node.js v16+
4. **Check logs**: Look for specific error messages

### Component Not Rendering

1. **Check imports**: Ensure correct import paths
2. **Check types**: Run `yarn typecheck`
3. **Check Storybook**: View component in Storybook
4. **Check console**: Look for runtime errors

## Additional Resources

- **Docusaurus Docs**: https://docusaurus.io/docs
- **Storybook Docs**: https://storybook.js.org/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Babel Docs**: https://babeljs.io/docs
- **Blog Post**: `blog/2025-11-16-storybook-typescript-babel-setup.md` - Detailed setup explanation

## Getting Help

- **Issues**: Check existing GitHub issues
- **Documentation**: Review component docs in `src/components/*/docs/`
- **Blog**: See technical posts in `blog/` directory
- **Makefile**: Run `make help` for available commands

---

*Last updated: 2025-11-16*

