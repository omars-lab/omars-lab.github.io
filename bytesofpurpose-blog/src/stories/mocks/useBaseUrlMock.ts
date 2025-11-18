/**
 * Mock useBaseUrl hook for Storybook
 * 
 * PURPOSE:
 * Mocks @docusaurus/useBaseUrl hook to allow Storybook to build components
 * that depend on Docusaurus-specific URL resolution.
 * 
 * WHY NEEDED:
 * - Docusaurus components use useBaseUrl to resolve asset paths relative to the site's base URL
 * - Storybook doesn't have access to Docusaurus configuration or base URL context
 * - When Storybook's webpack encounters `import useBaseUrl from '@docusaurus/useBaseUrl'`,
 *   it fails with "Module not found" errors since Docusaurus modules aren't available
 * - This mock provides a minimal implementation that returns paths as-is or with a simple prefix
 * 
 * HOW IT WORKS:
 * - Configured via webpack alias in `.storybook/main.ts`:
 *   `config.resolve.alias!['@docusaurus/useBaseUrl'] = path.resolve(rootDir, 'src/stories/mocks/useBaseUrlMock.ts')`
 * - When components import `@docusaurus/useBaseUrl`, webpack automatically resolves
 *   to this mock file instead
 * - This mock is a React hook that returns a function to resolve URLs
 * 
 * API COMPATIBILITY:
 * This mock maintains the same API as @docusaurus/useBaseUrl:
 * - It's a React hook (can be called in components)
 * - Returns a function that accepts a path string and returns the resolved path
 * - In Storybook, we return paths as-is or prepend a simple base path
 * 
 * USED BY:
 * - CardImage component
 * - Any other components that use useBaseUrl for asset paths
 * 
 * NOTE:
 * This mock is ONLY used in Storybook. In the actual Docusaurus site, components
 * use the real @docusaurus/useBaseUrl hook. The mock is never included in the
 * Docusaurus build.
 */

import { useMemo } from 'react';

/**
 * Mock useBaseUrl hook
 * In Storybook, we return a function that resolves paths as-is or prepends a simple base path
 * For static assets, we assume they're in the /static directory or root
 */
const useBaseUrl = (url: string, options?: { forcePrependBaseUrl?: boolean }): string => {
  return useMemo(() => {
    // If the URL already starts with http://, https://, or /, return as-is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
      return url;
    }
    
    // For relative paths, prepend / to make them absolute
    // In Storybook, static assets are typically served from the root
    return `/${url}`;
  }, [url]);
};

export default useBaseUrl;

