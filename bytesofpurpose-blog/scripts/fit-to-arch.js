#!/usr/bin/env node
/**
 * fit-to-arch.js — DEV TOOL (not shipped): clean a RAW arched image (a zellij window, a carved door,
 * a scene) so it ABIDES BY the canonical arch. It detects the raw image's arched content, scales +
 * shifts it to align with the canonical arch (the interior defined by arch-inner.png, the frame line
 * by arch.png, both 1024×1024), and CLIPS it to that arch: content INSIDE the arch is kept, everything
 * OUTSIDE (the raw's beige surround) becomes transparent. The output drops into the hero exactly like a
 * card scene.
 *
 * Output is a NEW file (never modifies the raw in place); pass an out path or it derives one by
 * stripping a leading "raw-" / "-raw" from the input name.
 *
 * Zero new dependencies: it does the detect + warp + clip in a headless-browser CANVAS via Playwright
 * (already a devDependency), reading pixels with getImageData. Pairs with trace-arch-mask.js and the
 * import-arched-image skill.
 *
 * Usage:
 *   node scripts/fit-to-arch.js <rawImage> [outImage] [--mask <archInner.png>] [--proof]
 *   # e.g. node scripts/fit-to-arch.js ~/Desktop/blog-assets/raw-window.png ~/Desktop/blog-assets/window.png --proof
 *
 * --mask : the canonical arch-inner.png (default: static/img/cards/arch-inner.png).
 * --proof: also write an <out>.proof.png overlaying arch.png's frame on the result, to eyeball align.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const {chromium} = require('playwright');

const ROOT = path.join(__dirname, '..');

function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}
function abs(p) {
  p = expandHome(p);
  return path.isAbsolute(p) ? p : path.join(ROOT, p);
}

// ---- args ----
const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const rawArg = positional[0];
if (!rawArg) {
  console.error('usage: node scripts/fit-to-arch.js <rawImage> [outImage] [--mask <png>] [--proof]');
  process.exit(1);
}
const rawPath = abs(rawArg);
// derive the out name by stripping a leading "raw-" or trailing "-raw" (never overwrite the raw).
function deriveOut(p) {
  const dir = path.dirname(p);
  const ext = path.extname(p);
  let base = path.basename(p, ext).replace(/^raw[-_]?/i, '').replace(/[-_]?raw$/i, '');
  if (!base || abs(path.join(dir, base + ext)) === p) base = base + '-fit';
  return path.join(dir, base + ext);
}
const outPath = positional[1] ? abs(positional[1]) : deriveOut(rawPath);
const maskFlag = args.indexOf('--mask');
const maskPath =
  maskFlag >= 0 && args[maskFlag + 1]
    ? abs(args[maskFlag + 1])
    : path.join(ROOT, 'static/img/cards/arch-inner.png');
// the canonical frame line (arch.png) for the optional proof: prefer static/, else next to the raw.
const archFrameCandidates = [
  path.join(ROOT, 'static/img/cards/arch.png'),
  path.join(path.dirname(rawPath), 'arch.png'),
];
const archFramePath = archFrameCandidates.find((p) => fs.existsSync(p)) || '';
const wantProof = args.includes('--proof');
const wantAlign = args.includes('--align'); // opt-in: scale the raw's detected interior to the arch

if (!fs.existsSync(rawPath)) {
  console.error(`✗ raw image not found: ${rawPath}`);
  process.exit(1);
}
if (!fs.existsSync(maskPath)) {
  console.error(`✗ canonical mask not found: ${maskPath}`);
  process.exit(1);
}
if (abs(outPath) === rawPath) {
  console.error('✗ refusing to overwrite the raw image; give a different out name.');
  process.exit(1);
}

// file:// URLs avoid data-URL size limits / CSP on the blank page (the raws are multi-MB).
const fileUrl = (p) => 'file://' + p;

(async () => {
  // --allow-file-access-from-files: treat all file:// as same-origin, so drawing the mask/frame (a
  // different file) onto the canvas does NOT taint it and getImageData stays allowed.
  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security'],
  });
  const page = await browser.newPage();
  await page.goto(fileUrl(rawPath));

  const result = await page.evaluate(
    async ({rawSrc, maskSrc, frameSrc, proof, align}) => {
      const load = (src) =>
        new Promise((res, rej) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = () => rej(new Error('failed to load ' + src));
          img.src = src;
        });
      const [raw, mask, frame] = await Promise.all([
        load(rawSrc),
        load(maskSrc),
        proof ? load(frameSrc) : Promise.resolve(null),
      ]);
      const W = mask.naturalWidth;
      const H = mask.naturalHeight; // canonical canvas = mask size (1024²)

      const px = (data, x, y, w) => (y * w + x) * 4;

      // --- 1. canonical arch bbox: the dark interior of arch-inner.png ---
      const mc = document.createElement('canvas');
      mc.width = W;
      mc.height = H;
      const mctx = mc.getContext('2d');
      mctx.drawImage(mask, 0, 0, W, H);
      const md = mctx.getImageData(0, 0, W, H).data;
      const maskInside = (x, y) => {
        const i = px(md, x, y, W);
        const lum = 0.299 * md[i] + 0.587 * md[i + 1] + 0.114 * md[i + 2];
        return md[i + 3] > 40 && lum < 90; // black interior
      };
      let cMinX = W, cMinY = H, cMaxX = 0, cMaxY = 0;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
          if (maskInside(x, y)) {
            if (x < cMinX) cMinX = x;
            if (x > cMaxX) cMaxX = x;
            if (y < cMinY) cMinY = y;
            if (y > cMaxY) cMaxY = y;
          }

      // --- 2. raw arch INTERIOR bbox: the colorful/dark opening INSIDE the raw's stone frame ---
      // We map interior→interior (not outer-frame→frame) so the actual arch openings align and the
      // raw's own stone frame is excluded. The interior is the region the corner-flood can't reach:
      // flood the LIGHT surround (beige bg + the light-gray stone frame) inward from the corners; the
      // arch opening (saturated tile / dark wood) is what's left.
      const rw = raw.naturalWidth;
      const rh = raw.naturalHeight;
      const rc = document.createElement('canvas');
      rc.width = rw;
      rc.height = rh;
      const rctx = rc.getContext('2d');
      rctx.drawImage(raw, 0, 0);
      const rd = rctx.getImageData(0, 0, rw, rh).data;
      // The surround (beige bg + light-gray stone frame) is a NARROW warm-gray colour band; the arch
      // opening (tile/wood) has varied colours. So we flood pixels CLOSE to the sampled corner colour,
      // not generic "light" (the tiles include light pixels too, which would let the flood leak in).
      const cornerRgb = (() => {
        const acc = [0, 0, 0];
        const pts = [[3, 3], [rw - 4, 3], [3, rh - 4], [rw - 4, rh - 4]];
        for (const [x, y] of pts) {
          const i = px(rd, x, y, rw);
          acc[0] += rd[i] / 4;
          acc[1] += rd[i + 1] / 4;
          acc[2] += rd[i + 2] / 4;
        }
        return acc;
      })();
      const light = (x, y) => {
        if (x < 0 || y < 0 || x >= rw || y >= rh) return false;
        const i = px(rd, x, y, rw);
        if (rd[i + 3] < 30) return true; // transparent surround
        const dr = rd[i] - cornerRgb[0], dg = rd[i + 1] - cornerRgb[1], db = rd[i + 2] - cornerRgb[2];
        // close to the corner colour → surround. Also treat the light-gray STONE FRAME as surround:
        // it's a near-neutral gray (low saturation) that is lighter than the tile content.
        const lum = 0.299 * rd[i] + 0.587 * rd[i + 1] + 0.114 * rd[i + 2];
        const mx = Math.max(rd[i], rd[i + 1], rd[i + 2]);
        const mn = Math.min(rd[i], rd[i + 1], rd[i + 2]);
        const sat = mx === 0 ? 0 : (mx - mn) / mx;
        // The stone frame is a near-neutral gray distinctly LIGHTER than the saturated/dark tiles;
        // include it as surround so the flood stops at the arch OPENING, but keep the band tight so it
        // doesn't swallow light tiles. Tuned for the warm-gray beige + gray stone of these raws.
        const closeToCorner = dr * dr + dg * dg + db * db < 30 * 30;
        const neutralStone = lum > 175 && sat < 0.12;
        return closeToCorner || neutralStone;
      };
      const outside = new Uint8Array(rw * rh);
      const stack = [[0, 0], [rw - 1, 0], [0, rh - 1], [rw - 1, rh - 1]];
      while (stack.length) {
        const [sx0, sy0] = stack.pop();
        if (sx0 < 0 || sy0 < 0 || sx0 >= rw || sy0 >= rh) continue;
        if (outside[sy0 * rw + sx0] || !light(sx0, sy0)) continue;
        let xL = sx0;
        while (xL - 1 >= 0 && light(xL - 1, sy0) && !outside[sy0 * rw + (xL - 1)]) xL--;
        let xR = sx0;
        while (xR + 1 < rw && light(xR + 1, sy0) && !outside[sy0 * rw + (xR + 1)]) xR++;
        for (let x = xL; x <= xR; x++) {
          outside[sy0 * rw + x] = 1;
          if (sy0 > 0 && light(x, sy0 - 1) && !outside[(sy0 - 1) * rw + x]) stack.push([x, sy0 - 1]);
          if (sy0 < rh - 1 && light(x, sy0 + 1) && !outside[(sy0 + 1) * rw + x]) stack.push([x, sy0 + 1]);
        }
      }
      let rMinX = rw, rMinY = rh, rMaxX = 0, rMaxY = 0;
      for (let y = 0; y < rh; y++)
        for (let x = 0; x < rw; x++)
          if (!outside[y * rw + x]) {
            if (x < rMinX) rMinX = x;
            if (x > rMaxX) rMaxX = x;
            if (y < rMinY) rMinY = y;
            if (y > rMaxY) rMaxY = y;
          }

      // --- 3. place the raw onto the canonical canvas ---
      // DEFAULT: draw 1:1 (most robust; these raws are already ~aligned to the canonical 1024² arch,
      // and the clip below trims to the exact arch). With --align, scale+translate so the detected raw
      // interior bbox maps onto the canonical arch bbox (use when a raw is framed differently).
      let sx = 1, sy = 1, tx = 0, ty = 0;
      if (align) {
        sx = (cMaxX - cMinX) / Math.max(1, rMaxX - rMinX);
        sy = (cMaxY - cMinY) / Math.max(1, rMaxY - rMinY);
        tx = cMinX - rMinX * sx;
        ty = cMinY - rMinY * sy;
      }
      const out = document.createElement('canvas');
      out.width = W;
      out.height = H;
      const octx = out.getContext('2d');
      octx.imageSmoothingQuality = 'high';
      octx.save();
      octx.translate(tx, ty);
      octx.scale(sx, sy);
      octx.drawImage(raw, 0, 0, rw, rh, 0, 0, W, H); // normalize raw to the canonical canvas size
      octx.restore();

      // --- 4. CLIP to the canonical arch interior: keep inside, transparent outside ---
      const od = octx.getImageData(0, 0, W, H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const i = px(od.data, x, y, W);
          if (!maskInside(x, y)) od.data[i + 3] = 0; // outside the arch → transparent
        }
      octx.putImageData(od, 0, 0);
      const outPng = out.toDataURL('image/png');

      // --- optional proof: the result + arch.png frame outline drawn over it ---
      let proofPng = null;
      if (proof && frame) {
        const pc = document.createElement('canvas');
        pc.width = W;
        pc.height = H;
        const pctx = pc.getContext('2d');
        pctx.fillStyle = '#cfd6dc';
        pctx.fillRect(0, 0, W, H);
        pctx.drawImage(out, 0, 0);
        pctx.globalAlpha = 0.9;
        pctx.drawImage(frame, 0, 0, W, H); // the canonical frame line on top
        proofPng = pc.toDataURL('image/png');
      }

      return {
        W,
        H,
        canonical: {cMinX, cMinY, cMaxX, cMaxY},
        rawBbox: {rMinX, rMinY, rMaxX, rMaxY},
        scale: {sx: +sx.toFixed(3), sy: +sy.toFixed(3)},
        outPng,
        proofPng,
      };
    },
    {
      rawSrc: fileUrl(rawPath),
      maskSrc: fileUrl(maskPath),
      frameSrc: wantProof && fs.existsSync(archFramePath) ? fileUrl(archFramePath) : '',
      proof: wantProof,
      align: wantAlign,
    },
  );

  await browser.close();

  const write = (p, dataUrl) =>
    fs.writeFileSync(p, Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
  write(outPath, result.outPng);

  console.log(`✅ fit ${path.basename(rawPath)} → ${path.relative(ROOT, outPath)}`);
  console.log(`   canonical arch bbox: x ${result.canonical.cMinX}..${result.canonical.cMaxX}, y ${result.canonical.cMinY}..${result.canonical.cMaxY}`);
  console.log(`   raw content bbox:    x ${result.rawBbox.rMinX}..${result.rawBbox.rMaxX}, y ${result.rawBbox.rMinY}..${result.rawBbox.rMaxY}`);
  console.log(`   scale: ${result.scale.sx} × ${result.scale.sy}`);
  if (result.proofPng) {
    const proofPath = outPath.replace(/\.png$/i, '.proof.png');
    write(proofPath, result.proofPng);
    console.log(`   overlay proof → ${path.relative(ROOT, proofPath)} (the arch.png frame should sit on the content edge)`);
  }
})();
