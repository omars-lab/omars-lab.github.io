// Jest stub for CSS-module imports. A test that renders a component importing
// `styles.module.css` only needs `styles.foo` to be a truthy, stable string; it
// never asserts on the real class names. This Proxy returns the requested key as
// its own value (like identity-obj-proxy) so `styles.box` === "box", with no
// extra dependency to install.
module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => (prop === '__esModule' ? false : String(prop)),
  },
);
