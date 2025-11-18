import React from 'react';

/**
 * Mock Link component for Storybook
 * 
 * PURPOSE:
 * Mocks @docusaurus/Link component to allow Storybook to build components
 * that depend on Docusaurus-specific navigation modules.
 * 
 * WHY NEEDED:
 * - Docusaurus components use Link for internal navigation with client-side routing
 * - Storybook doesn't have access to Docusaurus routing infrastructure
 * - When Storybook's webpack encounters `import Link from '@docusaurus/Link'`,
 *   it fails with "Module not found" errors since Docusaurus modules aren't available
 * - This mock provides a minimal implementation that matches the Docusaurus Link API
 * 
 * HOW IT WORKS:
 * - Configured via webpack alias in `.storybook/main.ts`:
 *   `config.resolve.alias!['@docusaurus/Link'] = path.resolve(rootDir, 'src/stories/mocks/LinkMock.tsx')`
 * - When components import `@docusaurus/Link`, webpack automatically resolves
 *   to this mock file instead
 * - This mock renders as a simple anchor tag or button for Storybook display
 * 
 * API COMPATIBILITY:
 * This mock maintains the same API as @docusaurus/Link:
 * - Accepts `to` prop (navigation path)
 * - Accepts `href` prop (external link)
 * - Accepts `className` prop
 * - Accepts standard HTML anchor props
 * - Renders as an anchor tag for display purposes
 * 
 * USED BY:
 * - HomepageFeatures component
 * - Any other components that use Docusaurus Link
 * 
 * NOTE:
 * This mock is ONLY used in Storybook. In the actual Docusaurus site, components
 * use the real @docusaurus/Link module. The mock is never included in the
 * Docusaurus build.
 */
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string;
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

const Link: React.FC<LinkProps> = ({ to, href, children, className, ...props }) => {
  // In Storybook, render as a simple anchor tag
  // Use 'to' prop if provided, otherwise use 'href'
  const linkHref = to || href || '#';
  
  return (
    <a
      href={linkHref}
      className={className}
      onClick={(e) => {
        // Prevent navigation in Storybook, just log for demo purposes
        e.preventDefault();
        console.log('Link clicked:', linkHref);
      }}
      {...props}
    >
      {children}
    </a>
  );
};

export default Link;

