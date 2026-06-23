import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

// Register iconify icon packs on mermaid so `architecture-beta` diagrams can use real
// provider icons (AWS / Azure / GCP / brand logos) beyond mermaid's 5 built-ins
// (cloud/database/disk/internet/server).
//
// @docusaurus/theme-mermaid owns mermaid's lifecycle (it imports the `mermaid` singleton
// and calls mermaid.initialize + render). registerIconPacks() mutates that SAME singleton,
// so registering here — from a client module that runs before any diagram renders — makes
// the icons available to theme-mermaid's render. Lazy `loader` keeps the ~MB icon JSON out
// of the main bundle (loaded only when a diagram references a `logos:` icon).
//
// Reference in a diagram as `logos:<icon>`, e.g. service api(logos:aws-api-gateway)[API].
// Browse names at icones.js.org (the `logos` set). Registered via clientModules in
// docusaurus.config.js.

if (ExecutionEnvironment.canUseDOM) {
  // dynamic import so this only runs in the browser (mermaid is a client lib)
  import('mermaid')
    .then(({default: mermaid}) => {
      if (typeof mermaid.registerIconPacks !== 'function') return;
      mermaid.registerIconPacks([
        {
          name: 'logos',
          loader: () => import('@iconify-json/logos').then((m) => m.icons),
        },
      ]);
    })
    .catch(() => {
      // mermaid not present / older version without registerIconPacks — diagrams fall
      // back to the 5 built-in icons; no hard failure.
    });
}
