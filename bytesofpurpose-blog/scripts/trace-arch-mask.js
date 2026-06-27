#!/usr/bin/env node
/**
 * trace-arch-mask.js — DEV TOOL (not shipped): trace the arched opening from a scene PNG and emit
 * (1) a pixel-exact luminance MASK PNG (white interior on black, the polarity CSS `mask-mode:
 * luminance` wants) and (2) the arch's bounding GEOMETRY as panel-ready `ht-` params, so the Hero
 * Tuner / the CSS vars can be seeded to match the art exactly.
 *
 * WHY this works with ONE trace: every scene PNG in static/img/cards/ places the arch IDENTICALLY
 * (same position + size + shape), so the geometry from one image fits them all. (See the
 * "Building masks with Claude" design post + the tune-hero-visually skill.)
 *
 * Zero new dependencies: it drives the trace in a headless-browser CANVAS via Playwright (already a
 * devDependency), reading pixels with getImageData — no sharp/jimp/pngjs needed.
 *
 * Usage:
 *   node scripts/trace-arch-mask.js [scenePng] [outMaskPng]
 *   # defaults: static/img/cards/craft.png  →  static/img/cards/arch-inner.traced.png
 *
 * It prints the detected geometry (as %), a ready-to-paste `ht-` query string, and writes the mask.
 * Then OVERLAY-PROOF it: load the variant with the printed `ht-` params + the mask, and eyeball that
 * the mask lines up with the drawn arch (the panel's mask-overlay toggle does this live).
 */

const path = require('path');
const fs = require('fs');
const {chromium} = require('playwright');

const ROOT = path.join(__dirname, '..');
const sceneArg = process.argv[2] || 'static/img/cards/craft.png';
const outArg = process.argv[3] || 'static/img/cards/arch-inner.traced.png';
const scenePath = path.isAbsolute(sceneArg) ? sceneArg : path.join(ROOT, sceneArg);
const outPath = path.isAbsolute(outArg) ? outArg : path.join(ROOT, outArg);

if (!fs.existsSync(scenePath)) {
  console.error(`✗ scene PNG not found: ${scenePath}`);
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load the PNG as a data URL into a canvas, then trace the arch interior in-page.
  const dataUrl = `data:image/png;base64,${fs.readFileSync(scenePath).toString('base64')}`;

  const result = await page.evaluate(async (src) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = src;
    });
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const {data} = ctx.getImageData(0, 0, W, H);

    // The scene art draws the arch as a dark outline over a lighter interior on a transparent/light
    // surround. We define "interior" as the connected region of NON-transparent, reasonably-bright
    // pixels reachable from the image center, bounded by the dark arch stroke. A robust-enough proxy
    // that needs no full flood-fill: for each row, find the span between the leftmost and rightmost
    // dark-stroke pixels; the union of spans is the interior bbox + per-row width gives the arch.
    const idx = (x, y) => (y * W + x) * 4;
    const isDark = (x, y) => {
      const i = idx(x, y);
      const a = data[i + 3];
      if (a < 40) return false; // transparent surround
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      return lum < 70; // the dark arch stroke + dark interior content
    };
    const isOpaque = (x, y) => data[idx(x, y) + 3] > 40;

    // bounding box of all opaque pixels = the drawn artwork (arch + frame)
    let minX = W,
      minY = H,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (isOpaque(x, y)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Build the mask by flooding the OUTSIDE inward, then INSIDE = opaque-and-not-outside. Seeding the
    // interior directly is unreliable (the scene's content at the centre is often dark); instead we
    // flood from the image CORNERS (always the transparent/light surround) through transparent +
    // bright-surround pixels, stopping at the dark arch stroke. Whatever the flood does NOT reach AND
    // is opaque artwork is the arch interior → white. This gives a SOLID interior. Scanline-stack flood.
    const outside = new Uint8Array(W * H);
    // a pixel belongs to the "surround" the flood travels through: transparent, OR light (not the dark
    // arch stroke and not dark scene content — but scene content is INSIDE the arch, unreachable from
    // the corners anyway, so we just travel transparent + bright pixels).
    const surround = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return false;
      const i = idx(x, y);
      if (data[i + 3] < 40) return true; // transparent
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      return lum > 180; // bright surround (paper), not the dark stroke
    };
    const stack = [
      [0, 0],
      [W - 1, 0],
      [0, H - 1],
      [W - 1, H - 1],
    ];
    while (stack.length) {
      const [sx, sy] = stack.pop();
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      if (outside[sy * W + sx] || !surround(sx, sy)) continue;
      let xL = sx;
      while (xL - 1 >= 0 && surround(xL - 1, sy) && !outside[sy * W + (xL - 1)]) xL--;
      let xR = sx;
      while (xR + 1 < W && surround(xR + 1, sy) && !outside[sy * W + (xR + 1)]) xR++;
      for (let x = xL; x <= xR; x++) {
        outside[sy * W + x] = 1;
        if (sy > 0 && surround(x, sy - 1) && !outside[(sy - 1) * W + x]) stack.push([x, sy - 1]);
        if (sy < H - 1 && surround(x, sy + 1) && !outside[(sy + 1) * W + x]) stack.push([x, sy + 1]);
      }
    }
    // interior = NOT outside (so the dark arch stroke gets included in the white interior fill, which
    // is fine: the opening + its frame line read as the arch shape).
    const mask = ctx.createImageData(W, H);
    for (let p = 0; p < W * H; p++) {
      const v = outside[p] ? 0 : 255;
      const i = p * 4;
      mask.data[i] = v;
      mask.data[i + 1] = v;
      mask.data[i + 2] = v;
      mask.data[i + 3] = 255;
    }
    // export the mask as a PNG data URL
    const mc = document.createElement('canvas');
    mc.width = W;
    mc.height = H;
    mc.getContext('2d').putImageData(mask, 0, 0);
    const maskPng = mc.toDataURL('image/png');

    return {
      W,
      H,
      bbox: {minX, minY, maxX, maxY},
      maskPng,
    };
  }, dataUrl);

  await browser.close();

  const {W, H, bbox, maskPng} = result;
  // Geometry as % of the image (what the CSS vars / panel use). Center + size of the arch bbox.
  const cx = (((bbox.minX + bbox.maxX) / 2 / W) * 100).toFixed(1);
  const cy = (((bbox.minY + bbox.maxY) / 2 / H) * 100).toFixed(1);
  const wPct = (((bbox.maxX - bbox.minX) / W) * 100).toFixed(1);
  const hPct = (((bbox.maxY - bbox.minY) / H) * 100).toFixed(1);

  // write the mask PNG
  const b64 = maskPng.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));

  console.log(`✅ traced arch from ${path.relative(ROOT, scenePath)} (${W}×${H})`);
  console.log(`   arch bbox: x ${bbox.minX}..${bbox.maxX}, y ${bbox.minY}..${bbox.maxY}`);
  console.log(`   center ≈ (${cx}%, ${cy}%)   size ≈ ${wPct}% × ${hPct}%`);
  console.log(`   mask written → ${path.relative(ROOT, outPath)}`);
  console.log('');
  console.log('   Seed the Hero Tuner / CSS vars with:');
  console.log(`     ht-archX=${cx}%25  ht-archY=${cy}%25   (mask-position)`);
  console.log('   then open the panel, toggle the mask overlay, and nudge to pin it exactly.');
})();
