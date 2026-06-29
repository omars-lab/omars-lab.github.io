#!/usr/bin/env node
/**
 * validate-arch-assets.js — guard that every hero CARD SCENE PNG conforms to the CANONICAL ARCH.
 *
 * The homepage hero shows scenes/doors/windows through an arched opening. For an image to drop into
 * that opening with NO faint white line at the edge, it must:
 *   1. be 1024×1024 (the canonical canvas), and
 *   2. have NO opaque content OUTSIDE the canonical arch interior — leftover fringe just outside the
 *      arch is the exact cause of the recurring "faint white line at the arch edge" bug (a re-imported
 *      initiatives.png once shipped with a ~1020px fringe + a 0,0..873,1023 bbox and broke the hero).
 *   3. (advisory) actually fill the arch — its opaque content bbox should sit near the canonical bbox,
 *      not be wildly off-centre or tiny.
 *
 * The canonical arch is defined by the BLACK interior of `static/img/cards/arch-inner.png`. This script
 * detects that bbox, then for each scene PNG counts opaque pixels OUTSIDE it (the fringe) and measures
 * the content bbox. ERROR on fringe / wrong size; WARN on a content bbox far from canonical.
 *
 * Zero new deps: it reads pixels in a headless-browser CANVAS via Playwright (already a devDependency),
 * the same approach as fit-to-arch.js. Pairs with the `import-arched-image` skill (the prep workflow)
 * and `fit-to-arch.js` (the fix: re-fit a violating asset to canonical).
 *
 * Usage:  node scripts/validate-arch-assets.js
 * Exit:   2 if any card PNG violates the canonical arch (fringe / wrong dims); else 0.
 */

const path = require('path');
const fs = require('fs');
const {chromium} = require('playwright');

const ROOT = path.join(__dirname, '..');
const CARDS_DIR = path.join(ROOT, 'static', 'img', 'cards');
const MASK = path.join(CARDS_DIR, 'arch-inner.png'); // canonical geometry (black interior)

// The non-scene helper PNGs in the cards dir that are NOT arched scenes (skip them).
const NOT_SCENES = new Set(['arch-inner.png', 'arch-mask-white.png', 'arch.png']);

// Tolerances. FRINGE_TOL: opaque px allowed outside the arch (a few stray AA pixels are fine; a real
// fringe is hundreds+). MARGIN: dilate the canonical bbox by a few px before counting fringe, so AA on
// the arch edge itself isn't flagged. BBOX_TOL: how far the content bbox may sit from canonical (warn).
const FRINGE_TOL = 200;
const MARGIN = 6;
const BBOX_TOL = 40;

const fileUrl = (p) => 'file://' + p;

function listScenePngs() {
  return fs
    .readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith('.png') && !NOT_SCENES.has(f) && !f.includes('.proof.') && !f.includes('.traced.'))
    .sort();
}

(async () => {
  if (!fs.existsSync(MASK)) {
    console.error(`✗ canonical mask not found: ${path.relative(ROOT, MASK)}`);
    process.exit(2);
  }
  const scenes = listScenePngs();
  if (!scenes.length) {
    console.log('✅ arch-assets: no card scene PNGs to check.');
    process.exit(0);
  }

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security'],
  });
  const page = await browser.newPage();
  await page.goto(fileUrl(MASK));

  const report = await page.evaluate(
    async ({maskSrc, sceneSrcs, FRINGE_TOL, MARGIN, BBOX_TOL}) => {
      const load = (src) =>
        new Promise((res, rej) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = () => rej(new Error('failed to load ' + src));
          img.src = src;
        });
      const dataOf = (img, w, h) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        return ctx.getImageData(0, 0, w, h).data;
      };
      const px = (x, y, w) => (y * w + x) * 4;

      // --- canonical arch bbox: the BLACK interior of arch-inner.png ---
      const mask = await load(maskSrc);
      const W = mask.naturalWidth;
      const H = mask.naturalHeight;
      const md = dataOf(mask, W, H);
      const inside = (x, y) => {
        const i = px(x, y, W);
        const lum = 0.299 * md[i] + 0.587 * md[i + 1] + 0.114 * md[i + 2];
        return md[i + 3] > 40 && lum < 90;
      };
      // a boolean map of "inside the arch (dilated by MARGIN)" so AA on the arch edge isn't fringe
      let cMinX = W, cMinY = H, cMaxX = 0, cMaxY = 0;
      const insideMap = new Uint8Array(W * H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
          if (inside(x, y)) {
            insideMap[y * W + x] = 1;
            if (x < cMinX) cMinX = x;
            if (x > cMaxX) cMaxX = x;
            if (y < cMinY) cMinY = y;
            if (y > cMaxY) cMaxY = y;
          }
      // dilate insideMap by MARGIN (cheap box dilation) so the counted fringe excludes edge AA
      const dil = new Uint8Array(W * H);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (!insideMap[y * W + x]) continue;
          for (let dy = -MARGIN; dy <= MARGIN; dy++)
            for (let dx = -MARGIN; dx <= MARGIN; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < W && ny >= 0 && ny < H) dil[ny * W + nx] = 1;
            }
        }
      const canonical = {cMinX, cMinY, cMaxX, cMaxY, W, H};

      // --- per scene: dims, fringe (opaque outside the dilated arch), content bbox ---
      const out = [];
      for (const s of sceneSrcs) {
        const img = await load(s.url);
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const findings = [];
        if (w !== W || h !== H) {
          findings.push({level: 'error', id: 'dims', msg: `${w}x${h}, expected ${W}x${h === H ? H : H}`});
        }
        let fringe = 0;
        let oMinX = w, oMinY = h, oMaxX = 0, oMaxY = 0, opaque = 0;
        if (w === W && h === H) {
          const d = dataOf(img, w, h);
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
              const a = d[px(x, y, w) + 3];
              if (a <= 24) continue; // transparent
              opaque++;
              if (x < oMinX) oMinX = x;
              if (x > oMaxX) oMaxX = x;
              if (y < oMinY) oMinY = y;
              if (y > oMaxY) oMaxY = y;
              if (!dil[y * W + x]) fringe++; // opaque AND outside the (dilated) arch = fringe
            }
          if (fringe > FRINGE_TOL) {
            findings.push({level: 'error', id: 'fringe', msg: `${fringe} opaque px OUTSIDE the canonical arch (causes the white-line edge); re-fit with fit-to-arch.js`});
          }
          // advisory: content bbox should sit near canonical
          const off =
            Math.abs(oMinX - cMinX) > BBOX_TOL ||
            Math.abs(oMinY - cMinY) > BBOX_TOL ||
            Math.abs(oMaxX - cMaxX) > BBOX_TOL ||
            Math.abs(oMaxY - cMaxY) > BBOX_TOL;
          if (!findings.some((f) => f.id === 'fringe') && off) {
            findings.push({
              level: 'warn',
              id: 'bbox',
              msg: `content bbox x${oMinX}..${oMaxX} y${oMinY}..${oMaxY} differs from canonical x${cMinX}..${cMaxX} y${cMinY}..${cMaxY} (>${BBOX_TOL}px)`,
            });
          }
        }
        out.push({name: s.name, w, h, fringe, opaque, findings});
      }
      return {canonical, scenes: out};
    },
    {
      maskSrc: fileUrl(MASK),
      sceneSrcs: scenes.map((f) => ({name: f, url: fileUrl(path.join(CARDS_DIR, f))})),
      FRINGE_TOL,
      MARGIN,
      BBOX_TOL,
    },
  );

  await browser.close();

  const c = report.canonical;
  const errors = [];
  const warns = [];
  for (const s of report.scenes) {
    for (const f of s.findings) {
      const line = `  ${f.level === 'error' ? '✗' : '⚠'} ${s.name} [${f.id}] ${f.msg}`;
      (f.level === 'error' ? errors : warns).push(line);
    }
  }

  console.log(
    `🏛️  arch-assets: canonical arch bbox x ${c.cMinX}..${c.cMaxX}, y ${c.cMinY}..${c.cMaxY} (from arch-inner.png) — checked ${report.scenes.length} scene PNG(s).`,
  );
  if (warns.length) {
    console.log('\nAdvisories:');
    warns.forEach((w) => console.log(w));
  }
  if (errors.length) {
    console.error(`\n${errors.length} card PNG(s) violate the canonical arch:`);
    errors.forEach((e) => console.error(e));
    console.error('\nFix: re-fit the offending raw with `node scripts/fit-to-arch.js <raw> <out> --proof` (see the import-arched-image skill).');
    process.exit(2);
  }
  console.log('\n✅ every card scene PNG conforms to the canonical arch (no fringe, correct size).');
  process.exit(0);
})();
