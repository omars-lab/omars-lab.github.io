import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useThemeConfig} from '@docusaurus/theme-common';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {ArchFlapLogo, ArchStatic} from '@site/src/components/DesignSystem';

/**
 * Navbar/Logo (swizzled) — the site's adopted brand mark.
 *
 * The real logo is the green cathedral arch housing a Vestaboard split-flap (the "chosen" direction
 * on /handbook/design-system/logos), rolling B → 0 → 1 → blank. Docusaurus's logo config only takes
 * a static image, so the live mark is rendered here instead of via `navbar.logo.src`.
 *
 * SSR / no-JS / reduced-motion get the non-animated <ArchStatic> (arch + resting "B") via
 * <BrowserOnly>'s fallback, so the header never looks broken before hydration. The wordmark
 * ("BytesOfPurpose", from `navbar.title`) stays beside the mark, matching the previous layout. The
 * link, brand/title classes, and home target mirror the upstream <Logo> so nothing else changes.
 */
export default function NavbarLogo(): React.JSX.Element {
  const {
    navbar: {title: navbarTitle, logo},
  } = useThemeConfig();
  const logoLink = useBaseUrl(logo?.href || '/');
  return (
    <Link to={logoLink} className="navbar__brand" aria-label={navbarTitle || 'Home'}>
      <span className="navbar__logo">
        <BrowserOnly fallback={<ArchStatic />}>
          {() => <ArchFlapLogo cadence="occasional" />}
        </BrowserOnly>
      </span>
      {navbarTitle != null && <b className="navbar__title text--truncate">{navbarTitle}</b>}
    </Link>
  );
}
