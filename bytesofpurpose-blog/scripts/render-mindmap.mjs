#!/usr/bin/env node
// render-mindmap.mjs : render Mermaid mindmap text to a standalone .svg and .png,
// WITHOUT building the blog. This is the fast half of the visual-validation loop:
// convert a .mindnode bundle to mermaid text, render it here, and eyeball the PNG
// against the bundle's own QuickLook/Preview.jpg to confirm the <MindMap>
// component reproduces the original.
//
// It reuses the component's OWN pure layout + SVG serializer (parser.ts /
// layout.ts / render.ts in packages/blog-ui), bundled on the fly with esbuild, so
// the preview is pixel-faithful to what ships in a post. PNG rasterization uses
// Playwright's bundled Chromium (a real browser, matching Docusaurus); if that is
// unavailable it falls back to `rsvg-convert` (brew install librsvg).
//
// Usage:
//   # from mermaid text on stdin:
//   python3 scripts/convert-mindnode.py path/to/Foo.mindnode \
//     | node scripts/render-mindmap.mjs --out static/img/foo/mindmap --title "Foo"
//
//   # or straight from a .mindnode bundle (runs the python converter for you):
//   node scripts/render-mindmap.mjs --mindnode "path/to/Foo.mindnode" \
//     --out static/img/foo/mindmap
//
// Flags:
//   --out <prefix>     output path prefix; writes <prefix>.svg and <prefix>.png
//   --title <text>     accessible title (default: derived from --mindnode or "Mind Map")
//   --layout ltr|spread   layout mode (default ltr)
//   --theme light|dark    palette (default light)
//   --mindnode <path>  read a .mindnode bundle (invokes convert-mindnode.py)
//   --svg-only         skip PNG rasterization

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..'); // repo root (…/omars-lab.github.io)
const MINDMAP_DIR = resolve(REPO, 'packages/blog-ui/src/components/MindMap');

function parseArgs(argv) {
  const args = { layout: 'ltr', theme: 'light', style: 'mindnode', density: 'comfortable', svgOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--title') args.title = argv[++i];
    else if (a === '--layout') args.layout = argv[++i];
    else if (a === '--theme') args.theme = argv[++i]; // color MODE: light|dark
    else if (a === '--style') args.style = argv[++i]; // visual STYLE: mindnode|blog
    else if (a === '--density') args.density = argv[++i]; // comfortable|compact
    else if (a === '--mindnode') args.mindnode = argv[++i];
    else if (a === '--svg-only') args.svgOnly = true;
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function usage() {
  console.log(
    'Usage: node scripts/render-mindmap.mjs --out <prefix> [--title T] [--layout ltr|spread]\n' +
      '       [--style mindnode|blog] [--theme light|dark] [--density comfortable|compact]\n' +
      '       [--mindnode PATH | mermaid text on stdin] [--svg-only]',
  );
}

// Bundle the component's pure modules (no React) into one ESM file we can import.
async function loadMindCore() {
  const esbuild = require('esbuild');
  const tmp = resolve(HERE, `.mindmap-core.${process.pid}.mjs`);
  const entry =
    `export { parseMindmap } from ${JSON.stringify(resolve(MINDMAP_DIR, 'parser.ts'))};\n` +
    `export { computeMindLayout } from ${JSON.stringify(resolve(MINDMAP_DIR, 'layout.ts'))};\n` +
    `export { toSVGString } from ${JSON.stringify(resolve(MINDMAP_DIR, 'render.ts'))};\n`;
  const entryFile = resolve(HERE, `.mindmap-entry.${process.pid}.ts`);
  writeFileSync(entryFile, entry);
  try {
    await esbuild.build({
      entryPoints: [entryFile],
      outfile: tmp,
      bundle: true,
      format: 'esm',
      platform: 'node',
      logLevel: 'silent',
    });
    const mod = await import(pathToFileURL(tmp).href + `?t=${process.pid}`);
    return mod;
  } finally {
    rmSync(entryFile, { force: true });
    rmSync(tmp, { force: true });
  }
}

function readMermaid(args) {
  if (args.mindnode) {
    const py = resolve(HERE, 'convert-mindnode.py');
    return execFileSync('python3', [py, args.mindnode], { encoding: 'utf8' });
  }
  return readFileSync(0, 'utf8'); // stdin
}

// Rasterize SVG -> PNG. Prefer Playwright (bundled Chromium); fall back to rsvg-convert.
async function rasterize(svg, pngPath) {
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ deviceScaleFactor: 2 });
      // Wrap the SVG so the page sizes exactly to it (transparent around the card).
      const wm = svg.match(/width="(\d+)"\s+height="(\d+)"/);
      const w = wm ? Number(wm[1]) : 800;
      const h = wm ? Number(wm[2]) : 600;
      await page.setViewportSize({ width: w, height: h });
      await page.setContent(
        `<!doctype html><html><body style="margin:0">${svg}</body></html>`,
        { waitUntil: 'networkidle' },
      );
      const el = await page.$('svg');
      await el.screenshot({ path: pngPath, omitBackground: true });
    } finally {
      await browser.close();
    }
    return 'playwright';
  } catch (err) {
    // Fallback: rsvg-convert
    const svgTmp = pngPath.replace(/\.png$/, '.tmp.svg');
    writeFileSync(svgTmp, svg);
    const r = spawnSync('rsvg-convert', ['-z', '2', '-o', pngPath, svgTmp], {
      encoding: 'utf8',
    });
    rmSync(svgTmp, { force: true });
    if (r.status !== 0) {
      throw new Error(
        `PNG rasterization failed. Playwright error: ${err.message}\n` +
          `rsvg-convert fallback also failed (install with: brew install librsvg). ` +
          `The .svg was written; open it in a browser, or pass --svg-only.`,
      );
    }
    return 'rsvg-convert';
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.out) {
    usage();
    process.exit(args.help ? 0 : 1);
  }
  const title =
    args.title ||
    (args.mindnode ? basename(args.mindnode).replace(/\.mindnode$/, '') : 'Mind Map');

  const source = readMermaid(args);
  const { parseMindmap, computeMindLayout, toSVGString } = await loadMindCore();

  const { root } = parseMindmap(source);
  const model = computeMindLayout(root, title, args.layout, args.density);
  const svg = toSVGString(model, title, args.theme, args.style);

  const outSvg = args.out.endsWith('.svg') ? args.out : `${args.out}.svg`;
  const outPng = args.out.replace(/\.svg$/, '') + '.png';
  mkdirSync(dirname(resolve(outSvg)), { recursive: true });
  writeFileSync(outSvg, svg);
  console.log(`wrote ${outSvg}  (${model.nodes.length} nodes, ${model.svgW}x${model.svgH})`);

  if (!args.svgOnly) {
    const via = await rasterize(svg, outPng);
    console.log(`wrote ${outPng}  (via ${via})`);
  }
}

main().catch((err) => {
  console.error(String(err && err.stack ? err.stack : err));
  process.exit(1);
});
