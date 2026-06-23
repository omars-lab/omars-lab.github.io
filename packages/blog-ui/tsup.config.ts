import {defineConfig} from 'tsup';

// Build the library: one ESM entry + type declarations, with the components' CSS-modules
// bundled into a single dist/index.css the consumer imports once
// (`import '@omars-lab/blog-ui/style.css'`). react/react-dom stay external (peerDeps).
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  injectStyle: false, // emit a separate dist/index.css instead of injecting at runtime
  // tsup uses esbuild's CSS-modules support: *.module.css → scoped class names + one css file.
  loader: {'.css': 'local-css'},
});
