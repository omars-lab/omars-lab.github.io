import {defineConfig} from 'tsup';

// Build the library: one ESM entry + type declarations, with the components' CSS-modules
// bundled into a single dist/index.css the consumer imports once
// (`import '@omars-lab/blog-ui/style.css'`). react/react-dom stay external (peerDeps).
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: false, // no .map files in the published tarball — consumers don't need them
  clean: true,
  external: ['react', 'react-dom'],
  // Bundle react-icons INTO the dist (tree-shaken to just the icons we import). The blog
  // consumes this package via a `file:` ref and does NOT install react-icons, so it must
  // ship inside our bundle — otherwise the runtime import resolves to nothing and the
  // Question component crashes ("Element type is invalid").
  noExternal: ['react-icons'],
  injectStyle: false, // emit a separate dist/index.css instead of injecting at runtime
  // tsup uses esbuild's CSS-modules support: *.module.css → scoped class names + one css file.
  loader: {'.css': 'local-css'},
});
