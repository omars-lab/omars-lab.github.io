import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import NavbarCoffee from '@site/src/components/NavbarCoffee';

// Register a custom navbar item type so the "Buy Me a Coffee?" link can be a
// React component (reads the support-button-copy A/B flag) instead of a static
// type:'html' string. Use it in docusaurus.config.js navbar items via:
//   { type: 'custom-coffee', position: 'right' }
export default {
  ...ComponentTypes,
  'custom-coffee': NavbarCoffee,
};
