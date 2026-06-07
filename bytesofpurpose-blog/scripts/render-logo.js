#!/usr/bin/env node
// Thin CLI for ad-hoc terminal renders of the binary-pyramid logo.
// Geometry source of truth: src/lib/binary-pyramid-logo.js (ESM).
//
//   node scripts/render-logo.js '<json-config>' '<fill>' > out.svg
//   node scripts/render-logo.js '{"pillar":"ionic","colMode":"arch","volute":"spiral"}' '#676767' | rsvg-convert -w 600 -o out.png

(async () => {
  const { generateLogoSvg } = await import('../src/lib/binary-pyramid-logo.js');
  const cfg = JSON.parse(process.argv[2] || '{}');
  const fill = process.argv[3] || '#676767';
  process.stdout.write(generateLogoSvg(cfg, fill));
})();
