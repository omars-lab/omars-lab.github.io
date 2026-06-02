import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import NavbarCoffee from '@site/src/components/NavbarCoffee';
import AuthNavbarItem from '@site/src/components/AuthNavbarItem';

// Register a custom navbar item type so the "Buy Me a Coffee?" link can be a
// React component (reads the support-button-copy A/B flag) instead of a static
// type:'html' string. Use it in docusaurus.config.js navbar items via:
//   { type: 'custom-coffee', position: 'right' }
//
// NOTE: currently UNUSED — the support-button-copy experiment moved off the
// navbar onto the dedicated /support page's CTA (src/components/Support/
// CoffeeButton). This registration is kept (inert) so the navbar coffee button
// can be re-enabled by re-adding the { type: 'custom-coffee' } navbar item.
export default {
  ...ComponentTypes,
  'custom-coffee': NavbarCoffee,
  // LinkedIn-via-Cloudflare-Access auth control (button ⇆ avatar). Use in
  // docusaurus.config.js navbar items via { type: 'custom-auth', position:
  // 'right' } so it renders beside the color-mode toggle.
  'custom-auth': AuthNavbarItem,
};
