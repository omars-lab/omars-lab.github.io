import React from 'react';

/**
 * Mock BrowserOnly component for Storybook
 * 
 * PURPOSE:
 * Mocks @docusaurus/BrowserOnly component to allow Storybook to build components
 * that depend on Docusaurus-specific modules.
 * 
 * WHY NEEDED:
 * - Docusaurus components use BrowserOnly to prevent server-side rendering (SSR) issues
 *   by only rendering children in the browser
 * - Storybook always runs in the browser, so SSR is not a concern
 * - When Storybook's webpack encounters `import BrowserOnly from '@docusaurus/BrowserOnly'`,
 *   it fails with "Module not found" errors since Docusaurus modules aren't available
 * - This mock provides a minimal implementation that matches the Docusaurus API
 * 
 * HOW IT WORKS:
 * - Configured via webpack alias in `.storybook/main.ts`:
 *   `config.resolve.alias!['@docusaurus/BrowserOnly'] = path.resolve(rootDir, 'src/stories/mocks/BrowserOnlyMock.tsx')`
 * - When components import `@docusaurus/BrowserOnly`, webpack automatically resolves
 *   to this mock file instead
 * - This mock simply renders children directly since we're always in browser context
 * 
 * API COMPATIBILITY:
 * This mock maintains the same API as @docusaurus/BrowserOnly:
 * - Accepts `fallback` prop (unused in Storybook, but kept for API compatibility)
 * - Accepts `children` as either a function `(() => ReactNode)` or `ReactNode`
 * - Renders children directly since we're always in browser context
 * 
 * USED BY:
 * - GraphRenderer.tsx
 * - NodeRendererDemo.tsx
 * 
 * NOTE:
 * This mock is ONLY used in Storybook. In the actual Docusaurus site, components
 * use the real @docusaurus/BrowserOnly module. The mock is never included in the
 * Docusaurus build.
 */
interface BrowserOnlyProps {
  fallback?: React.ReactNode;
  children: (() => React.ReactNode) | React.ReactNode;
}

const BrowserOnly: React.FC<BrowserOnlyProps> = ({ fallback, children }) => {
  // In Storybook, we're always in browser context
  // Just render the children directly
  if (typeof children === 'function') {
    return <>{children()}</>;
  }
  return <>{children}</>;
};

export default BrowserOnly;

