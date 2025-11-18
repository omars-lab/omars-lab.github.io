/**
 * Mock for @docusaurus/theme-common
 * 
 * PURPOSE:
 * Mocks the useColorMode hook from @docusaurus/theme-common to allow Storybook
 * to build components that depend on Docusaurus theme functionality.
 * 
 * WHY NEEDED:
 * - Components use `useColorMode()` to detect the current theme (light/dark) from
 *   the Docusaurus theme context
 * - Storybook doesn't have Docusaurus theme context, so imports fail with
 *   "Module not found" errors
 * - This mock provides a minimal implementation that matches the Docusaurus API
 * 
 * HOW IT WORKS:
 * - Configured via webpack alias in `.storybook/main.ts`:
 *   `config.resolve.alias!['@docusaurus/theme-common'] = path.resolve(rootDir, 'src/stories/mocks/theme-common-mock.ts')`
 * - When components import `{ useColorMode } from '@docusaurus/theme-common'`,
 *   webpack automatically resolves to this mock file instead
 * - Returns 'light' by default (can be enhanced to detect Storybook's theme if needed)
 * 
 * API COMPATIBILITY:
 * This mock maintains the same API as @docusaurus/theme-common's useColorMode:
 * - Returns an object with `colorMode: 'light' | 'dark'`
 * - Returns `setColorMode: (mode: 'light' | 'dark') => void` (no-op in Storybook)
 * 
 * USED BY:
 * - GraphRenderer.tsx
 * - NodeRendererDemo.tsx
 * - AIFrameworkGraph.tsx
 * - useGraphState.ts
 * 
 * FUTURE ENHANCEMENT:
 * Could be enhanced to detect Storybook's theme if using @storybook/addon-themes
 * by accessing Storybook's theme context.
 * 
 * NOTE:
 * This mock is ONLY used in Storybook. In the actual Docusaurus site, components
 * use the real @docusaurus/theme-common module. The mock is never included in the
 * Docusaurus build.
 * 
 * @returns Object with colorMode ('light' | 'dark') and setColorMode function
 */
export function useColorMode(): {
  colorMode: 'light' | 'dark';
  setColorMode: (mode: 'light' | 'dark') => void;
} {
  return {
    colorMode: 'light',
    setColorMode: () => {
      // No-op in Storybook - theme changes would need to be handled via Storybook's theming system
    },
  };
}

