// Binary-pyramid logo generator (flavor matrix).
//
// The SINGLE SOURCE OF TRUTH for the binary-pyramid logo geometry. Pure ESM, no
// Node-only APIs, so it runs in BOTH the browser (React components) and Node.
// Consumers:
//   - src/components/* : import { generateLogoSvg } to render client-side on demand
//   - scripts/generate-logo-variants-data.js : build step -> gitignored data file
//   - scripts/render-logo.js : thin Node CLI for ad-hoc terminal renders
//
// Center column = '1' pillar (tallest). Outward each side: 0,1,0,1...
// Each column = a vertical stack of its digit; 0-stacks packed tighter so the
// column reads as a slender pillar. Height + scale shrink outward -> pyramid.
//
// Config keys (all optional, sensible defaults):
//   rings, centerCount, minCount, scale0, scaleStep, colGap, cellH, zeroSquash
//   pillar: 'greek' | 'bar' | 'doric' | 'ionic'   (1-glyph / column style)
//   ring:   'oval'  | 'rrect' | 'circle'          (0-glyph style)
//   taper:  'linear'| 'steep' | 'gentle'          (column-height falloff)
//   colMode 'arch' (real columns) + volute 'spiral'|'curl', colStack, shaftZeros, ...
//   arrange 'pyramid'|'wedge'|'ground'|'avenue';  scene 'desert'|'dusk'|'night'
//   flute / emphasis / mark 'full'|'triad'|'single'

/**
 * Generate a binary-pyramid logo as an SVG string.
 * @param {object} cfg   variant config (see header); merged over defaults.
 * @param {string} FILL  base fill color (use 'currentColor' for theme-aware SVGs).
 * @returns {string} a complete <svg>...</svg> document.
 */
export function generateLogoSvg(cfg = {}, FILL = '#676767') {

const D = {
  rings: 4, centerCount: 7, minCount: 2, scale0: 1.0, scaleStep: 0.115,
  colGap: 12.5, cellH: 13, zeroSquash: 0.80,
  pillar: 'greek', ring: 'oval', taper: 'linear',
  flute: false, emphasis: false, mark: 'full',
  // arrangement knobs:
  colStack: false, stackGap: 0,   // stackGap: vertical gap between stacked column drums
  noZeros: false,                 // drop the 0-ring columns -> pure column pyramid
  flat: false,                    // all columns same height (no taper), side by side
  arrange: 'pyramid',             // 'pyramid' | 'wedge' | 'ground'
  wedgeRise: 9,                   // per-ring vertical rise for wedge arrangement
  // 'ground' = desert-wanderer vantage: stand facing the center pillar, columns same
  // REAL height, receding left+right to a horizon (one-point perspective both ways).
  horizon: 64,                    // height of the horizon line above the near baseline
  recede: 0.34,                   // 0..1 how fast columns shrink/bunch with distance
  shaftZeros: false,              // arch shafts: draw each flute line as a vertical CHAIN of 0s
  goldFill: null,                 // if set (e.g. '#C9A227'), columns render in this gold
  letters: null,                  // arrange:'inscribe' -> a word (e.g. 'PURPOSE') carved across N columns
  letterScale: 1.0,               // size of the inscribed colonnade columns
  colUnits: null,                 // inscribe: pillar height in cell-units (default centerCount=7); lower = shorter
  shaftLanes: 3,                  // inscribe+shaftZeros: number of vertical 0-chain lanes per shaft
};
const C = Object.assign({}, D, cfg);

function f(n){ return Math.round(n*100)/100; }
function scaleAt(d){ return C.scale0 - C.scaleStep * d; }
function taperT(d){
  const t = d / C.rings;
  if (C.taper === 'steep')  return Math.pow(t, 0.65);   // drops fast early
  if (C.taper === 'gentle') return Math.pow(t, 1.6);    // stays tall longer
  return t;                                             // linear
}
function countAt(d){
  return Math.max(C.minCount, Math.round(C.centerCount - (C.centerCount - C.minCount) * taperT(d)));
}
function digitAt(d){ return d % 2 === 0 ? '1' : '0'; }

// ---------- 1-glyph styles ----------
function oneOutline(cx, cy, s){
  const h=12*s, top=cy-h/2, bot=cy+h/2;
  if (C.pillar === 'bar'){
    const w=2.4*s;
    return `M ${f(cx-w)} ${f(top)} H ${f(cx+w)} V ${f(bot)} H ${f(cx-w)} Z`;
  }
  if (C.pillar === 'doric'){
    // tapered shaft (wider at base) + thin capital + base slab
    const tw=1.8*s, bw=2.6*s, capW=3.2*s, capH=1.6*s, baseW=3.8*s, baseH=1.8*s;
    return `M ${f(cx-capW)} ${f(top)} H ${f(cx+capW)} V ${f(top+capH)} `+
           `L ${f(cx+tw)} ${f(top+capH)} L ${f(cx+bw)} ${f(bot-baseH)} `+
           `H ${f(cx+baseW)} V ${f(bot)} H ${f(cx-baseW)} V ${f(bot-baseH)} `+
           `L ${f(cx-bw)} ${f(bot-baseH)} L ${f(cx-tw)} ${f(top+capH)} `+
           `H ${f(cx-capW)} Z`;
  }
  // greek (default): capital slab + straight shaft + base slab
  const sw=2.2*s, capW=3.6*s, capH=2.0*s, baseW=4.0*s, baseH=2.0*s;
  return `M ${f(cx-capW)} ${f(top)} H ${f(cx+capW)} V ${f(top+capH)} `+
         `H ${f(cx+sw)} V ${f(bot-baseH)} H ${f(cx+baseW)} V ${f(bot)} `+
         `H ${f(cx-baseW)} V ${f(bot-baseH)} H ${f(cx-sw)} V ${f(top+capH)} `+
         `H ${f(cx-capW)} Z`;
}
function fluteHole(xc, top, bot, fw){
  return `M ${f(xc-fw)} ${f(top)} V ${f(bot)} H ${f(xc+fw)} V ${f(top)} Z`;
}

// A small Ionic volute (spiral scroll) as a filled curl, centered at (vx,vy),
// radius r, winding `dir` (+1 = curl inward from outer-left). Drawn as a thick
// spiral arc: outer half-loop minus inner half-loop via two arcs + a connecting
// nub so it reads as a scroll, not a plain ring, even at small size.
function volute(vx, vy, r, dir){
  const ro = r, ri = r*0.42, t = r*0.40;
  // outer ring (eye of the volute) + a tail sweeping toward the shaft
  const eye = `${ellipse(vx, vy, ro, ro)} ${ellipse(vx, vy, ro-t, ro-t)}`;
  // tail: a short comma sweeping down-inward toward the abacus
  const tx = vx + dir*ro*0.2, ty = vy + ro*0.9;
  const tail = `M ${f(vx+dir*ro)} ${f(vy)} `+
               `Q ${f(vx+dir*ro*1.05)} ${f(ty)} ${f(tx)} ${f(ty+r*0.25)} `+
               `Q ${f(vx+dir*ro*0.2)} ${f(vy+ro*0.4)} ${f(vx+dir*(ro-t))} ${f(vy)} Z`;
  return eye + ' ' + tail;
}

// Ionic column glyph: scrolled volute capital + fluted shaft + stepped base.
// Composed of several filled subpaths (returned as a full <g> by glyph1).
function ionicGlyph(cx, cy, s, isCenter){
  const h=12*s, top=cy-h/2, bot=cy+h/2;
  const sw=1.9*s;                 // slender shaft half-width (Ionic is slim)
  const abW=4.0*s, abH=1.0*s;     // abacus slab under the volutes
  const capY=top+abH+1.2*s;       // shaft starts below capital
  const baseH=1.4*s, plinthH=1.1*s, baseW=3.6*s, plinthW=4.2*s;
  const shaftBot=bot-baseH-plinthH;
  let p='';
  // shaft
  p += `<path d="M ${f(cx-sw)} ${f(capY)} H ${f(cx+sw)} V ${f(shaftBot)} H ${f(cx-sw)} Z" fill="${FILL}"/>`;
  // abacus slab
  p += `<path d="M ${f(cx-abW)} ${f(top+abH)} H ${f(cx+abW)} V ${f(top+abH+0.9*s)} H ${f(cx-abW)} Z" fill="${FILL}"/>`;
  // two volutes flanking the top, sitting on the abacus
  const vr=1.7*s, vy=top+abH-vr*0.1;
  p += `<path fill-rule="evenodd" d="${volute(cx-abW*0.62, vy, vr, -1)}" fill="${FILL}"/>`;
  p += `<path fill-rule="evenodd" d="${volute(cx+abW*0.62, vy, vr, +1)}" fill="${FILL}"/>`;
  // base: torus ring slab + plinth
  p += `<path d="M ${f(cx-baseW)} ${f(shaftBot)} H ${f(cx+baseW)} V ${f(shaftBot+baseH)} H ${f(cx-baseW)} Z" fill="${FILL}"/>`;
  p += `<path d="M ${f(cx-plinthW)} ${f(bot-plinthH)} H ${f(cx+plinthW)} V ${f(bot)} H ${f(cx-plinthW)} Z" fill="${FILL}"/>`;
  // (Ionic identity carried by the volutes; skip shaft-fluting cutout to stay
  //  theme-safe under currentColor — a bg-colored sliver would mis-render on dark.)
  return p;
}

function glyph1(cx, cy, s, isCenter){
  if (C.pillar === 'ionic'){
    return ionicGlyph(cx, cy, s, isCenter);
  }
  if (C.flute && isCenter && s > 0.85){
    const h=12*s, top=cy-h/2, bot=cy+h/2, capH=2.0*s, baseH=2.0*s;
    const flTop=top+capH+1.0*s, flBot=bot-baseH-1.0*s, fw=0.42*s, off=1.0*s;
    const d = oneOutline(cx,cy,s)+' '+fluteHole(cx-off,flTop,flBot,fw)+' '+fluteHole(cx+off,flTop,flBot,fw);
    return `<path fill-rule="evenodd" d="${d}" fill="${FILL}"/>`;
  }
  return `<path d="${oneOutline(cx,cy,s)}" fill="${FILL}"/>`;
}

// ---------- 0-glyph styles ----------
function ellipse(cx, cy, rx, ry){
  return `M ${f(cx-rx)} ${f(cy)} a ${f(rx)} ${f(ry)} 0 1 0 ${f(2*rx)} 0 a ${f(rx)} ${f(ry)} 0 1 0 ${f(-2*rx)} 0 Z`;
}
function rrect(cx, cy, rx, ry, rad){
  // rounded rectangle path centered at cx,cy with half-extents rx,ry, corner rad
  const x0=cx-rx, x1=cx+rx, y0=cy-ry, y1=cy+ry, r=rad;
  return `M ${f(x0+r)} ${f(y0)} H ${f(x1-r)} Q ${f(x1)} ${f(y0)} ${f(x1)} ${f(y0+r)} `+
         `V ${f(y1-r)} Q ${f(x1)} ${f(y1)} ${f(x1-r)} ${f(y1)} H ${f(x0+r)} `+
         `Q ${f(x0)} ${f(y1)} ${f(x0)} ${f(y1-r)} V ${f(y0+r)} Q ${f(x0)} ${f(y0)} ${f(x0+r)} ${f(y0)} Z`;
}
// ---------- inscribed letters (for the "PURPOSE" pillar-inscription mark) ----------
// Each letter is returned as one or more CLOSED sub-paths sized to a box of width w,
// cap-height h, centered at (cx,cy), with stroke weight t. Sub-paths are designed to
// be mostly non-overlapping so they knock out cleanly under fill-rule="evenodd"
// (overlapping same-winding regions would cancel). Round letters use ring cut-outs.
function letterPath(ch, cx, cy, w, h, t){
  const x0=cx-w/2, x1=cx+w/2, y0=cy-h/2, y1=cy+h/2, midY=cy;
  // closed rectangle sub-path
  const rect=(ax,ay,bx,by)=>`M ${f(ax)} ${f(ay)} H ${f(bx)} V ${f(by)} H ${f(ax)} Z`;
  const vbar=(x)=>rect(x, y0, x+t, y1);          // full-height vertical bar
  const hbar=(y)=>rect(x0, y, x1, y+t);          // full-width horizontal bar
  // A "bowl": a closed C-shaped band (outer arc out, inner arc back) opening to the
  // LEFT, spanning vertical extent [ty..by], bulging right to xr. Drawn as a single
  // closed path so it knocks out cleanly (no inner-ellipse winding cancellation).
  // Endpoints sit at x=xl (the stem), top & bottom.
  const bowl=(xl,xr,ty,by)=>{
    const ro=(by-ty)/2, cyb=(ty+by)/2, ri=Math.max(0.1,ro-t);
    return `M ${f(xl)} ${f(ty)} `+
           `A ${f(xr-xl)} ${f(ro)} 0 1 1 ${f(xl)} ${f(by)} `+   // outer arc, stem-top -> stem-bottom (right bulge)
           `L ${f(xl)} ${f(by-t)} `+
           `A ${f(xr-xl-t)} ${f(ri)} 0 1 0 ${f(xl)} ${f(ty+t)} Z`; // inner arc back
  };
  // diagonal closed quad (for R/K legs)
  const leg=(ax,ay,bx,by)=>`M ${f(ax)} ${f(ay)} L ${f(ax+t)} ${f(ay)} L ${f(bx)} ${f(by)} L ${f(bx-t)} ${f(by)} Z`;
  switch(ch){
    case 'P':
      return vbar(x0) + ` ${bowl(x0+t, x1, y0, midY+t*0.3)}`;
    case 'R':
      return vbar(x0) + ` ${bowl(x0+t, x1, y0, midY+t*0.3)}`
        + ` ${leg(x0+t, midY-t*0.2, x1, y1)}`;
    case 'B':
      return vbar(x0) + ` ${bowl(x0+t, x1, y0, midY+t*0.5)}`
        + ` ${bowl(x0+t, x1, midY-t*0.5, y1)}`;
    case 'O': {
      const rx=w/2, ry=h/2;
      return `${ellipse(cx, cy, rx, ry)} ${ellipse(cx, cy, rx-t, ry-t)}`;
    }
    case 'U': {
      // two stems + a bottom bowl opening UP (closed band along the bottom)
      const r=Math.min(w/2, (y1-y0)*0.42);
      const cyb=y1-r;
      return rect(x0, y0, x0+t, cyb)
        + ` ${rect(x1-t, y0, x1, cyb)}`
        + ` M ${f(x0)} ${f(cyb)} A ${f(r)} ${f(r)} 0 0 0 ${f(x1)} ${f(cyb)} `
        + `L ${f(x1-t)} ${f(cyb)} A ${f(r-t)} ${f(r-t)} 0 0 1 ${f(x0+t)} ${f(cyb)} Z`;
    }
    case 'S': {
      // modern S as a smooth spine: an upper bowl opening LEFT (top) and a lower bowl
      // opening RIGHT (bottom), drawn as one continuous stroked centerline offset to
      // width t. Built from two C-bands that meet in the middle.
      const r=Math.min(w/2, (h/2)*0.92), ri=Math.max(0.1,r-t);
      const uy=y0+r, ly=y1-r;                        // centers of upper / lower curves
      // upper arc: from right-top sweeping left-down to mid-left
      const upper = `M ${f(x1)} ${f(uy-r*0.55)} `+
        `A ${f(r)} ${f(r)} 0 1 0 ${f(x0)} ${f(midY)} `+      // outer
        `L ${f(x0+t)} ${f(midY)} `+
        `A ${f(ri)} ${f(ri)} 0 1 1 ${f(x1-t)} ${f(uy-r*0.55)} Z`;
      // lower arc: from left-bottom sweeping right-up to mid-right
      const lower = `M ${f(x0)} ${f(ly+r*0.55)} `+
        `A ${f(r)} ${f(r)} 0 1 0 ${f(x1)} ${f(midY)} `+
        `L ${f(x1-t)} ${f(midY)} `+
        `A ${f(ri)} ${f(ri)} 0 1 1 ${f(x0+t)} ${f(ly+r*0.55)} Z`;
      return upper + ' ' + lower;
    }
    case 'E':
      // spine + three arms, arms start at x0+t so they don't overlap the spine
      return vbar(x0)
        + ` ${rect(x0+t, y0, x1, y0+t)}`             // top arm
        + ` ${rect(x0+t, midY-t/2, x1-w*0.16, midY+t/2)}` // middle arm (shorter)
        + ` ${rect(x0+t, y1-t, x1, y1)}`;            // bottom arm
    case 'T':
      return hbar(y0) + ` ${rect(cx-t/2, y0, cx+t/2, y1)}`;
    case 'Y':
      return `${leg(x0, y0, cx-t/2, midY)} ${leg(x1-t, y0, cx-t/2+t, midY)} ${rect(cx-t/2, midY-t*0.2, cx+t/2, y1)}`;
    default: return '';
  }
}

function glyph0(cx, cy, s){
  if (C.ring === 'circle'){
    const r=2.9*s, t=1.3*s;
    return `<path fill-rule="evenodd" d="${ellipse(cx,cy,r,r)} ${ellipse(cx,cy,r-t,r-t)}" fill="${FILL}"/>`;
  }
  if (C.ring === 'rrect'){
    const rx=2.7*s, ry=4.1*s, t=1.35*s, rad=1.6*s;
    return `<path fill-rule="evenodd" d="${rrect(cx,cy,rx,ry,rad)} ${rrect(cx,cy,rx-t,ry-t,Math.max(0.2,rad-t))}" fill="${FILL}"/>`;
  }
  // oval (default)
  const rx=2.7*s, ry=4.1*s, t=1.35*s;
  return `<path fill-rule="evenodd" d="${ellipse(cx,cy,rx,ry)} ${ellipse(cx,cy,rx-t,ry-t)}" fill="${FILL}"/>`;
}

// ---------- architectural column (one real column per 1-stack) ----------
// Draws a SINGLE column spanning [colTop, colBot] (y grows downward in user
// space here we pass actual y's). width scales with `s`. Doric or Ionic, with
// spiral or curl volutes. Returns SVG (possibly multiple subpaths).
// A bold volute scroll (à la noun-ionic-column ref): a thick stroked spiral
// winding ~1.75 turns inward to a tight eye. Centered at (vx,vy), outer radius
// R, weight w. dir=+1 scrolls so the open end faces inward-up (mirror for -1).
function voluteScroll(vx, vy, R, dir, w){
  const turns=1.85, steps=40, b=(R*0.80)/(turns*2*Math.PI);
  // start angle so the outer tail points UP toward the abacus, then winds in
  const a0 = dir>0 ? Math.PI*0.5 : Math.PI*0.5;
  let d='';
  for (let i=0;i<=steps;i++){
    const a=a0 + (i/steps)*turns*2*Math.PI;
    const rad=R - b*(a-a0);
    const px=vx + dir*rad*Math.cos(a), py=vy - rad*Math.sin(a);
    d += (i===0?`M ${f(px)} ${f(py)} `:`L ${f(px)} ${f(py)} `);
  }
  return `<path d="${d}" fill="none" stroke="${FILL}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// Ionic capital matching the reference: thin flared ABACUS slab on TOP that
// OVERHANGS, two big inward-scrolling VOLUTES beneath it spanning the full
// Stepped foot/cap: a narrow torus slab + a wider plinth slab. `topY` = top
// edge of the two-bar block; returns {svg, height}. flip=false => torus on top,
// plinth below (a base/foot). flip=true => plinth on top, torus below (the same
// shape mirrored vertically, used as the capital crown).
function steppedFoot(x, topY, s, flip, shaftHalfW){
  // Base sizes relative to the shaft: the plinth (widest) extends a bit past the
  // shaft edges, the torus meets the shaft edges. Falls back to fixed if no shaft.
  const sh = shaftHalfW || 3.0*s;
  const torW = sh + 0.4*s;          // torus meets / just past the shaft edge
  const plW  = sh + 1.6*s;          // plinth clearly wider (the base is widest)
  const torH=1.3*s, plH=1.5*s, H=torH+plH;
  let p='';
  if (!flip){
    // torus (narrow) then plinth (wide) going DOWN
    p+=`<path d="M ${f(x-torW)} ${f(topY)} H ${f(x+torW)} V ${f(topY+torH)} H ${f(x-torW)} Z" fill="${FILL}"/>`;
    p+=`<path d="M ${f(x-plW)} ${f(topY+torH)} H ${f(x+plW)} V ${f(topY+H)} H ${f(x-plW)} Z" fill="${FILL}"/>`;
  } else {
    // mirrored: plinth (wide) on top then torus (narrow) below
    p+=`<path d="M ${f(x-plW)} ${f(topY)} H ${f(x+plW)} V ${f(topY+plH)} H ${f(x-plW)} Z" fill="${FILL}"/>`;
    p+=`<path d="M ${f(x-torW)} ${f(topY+plH)} H ${f(x+torW)} V ${f(topY+H)} H ${f(x-torW)} Z" fill="${FILL}"/>`;
  }
  return { svg:p, height:H, halfW:plW };
}

// Ionic capital: the stepped foot-bars (FLIPPED) on top, then two LARGE spiral
// volutes scrolling inward just below, then the shaft.
// `capTop` = top edge; shaftHalfW = the shaft half-width.
function ionicCapital(x, capTop, s, vstyle, shaftHalfW){
  const R=3.2*s;                                // volute outer radius (big, dominant)
  const w=1.05*s;                               // scroll line weight
  let p='';
  // 1) stepped crown = the foot bars, flipped vertically, on TOP
  const crown=steppedFoot(x, capTop, s, true, shaftHalfW);
  p+=crown.svg;
  const volY=capTop+crown.height+R*0.78;        // volute centerline below the crown
  const eyeX=shaftHalfW+R*0.72;                  // eyes flank the shaft, near crown edges
  // 2) short neck from crown into the volute band (keeps them visually joined)
  const nkTop=capTop+crown.height, nkBot=volY+R*0.45;
  p+=`<path d="M ${f(x-shaftHalfW-0.5*s)} ${f(nkTop)} H ${f(x+shaftHalfW+0.5*s)} `+
      `L ${f(x+shaftHalfW)} ${f(nkBot)} H ${f(x-shaftHalfW)} Z" fill="${FILL}"/>`;
  // 3) two LARGE volutes flanking, scrolling inward
  if (vstyle==='curl'){
    const t=R*0.42;
    p+=`<path fill-rule="evenodd" d="${ellipse(x-eyeX,volY,R,R)} ${ellipse(x-eyeX,volY,R-t,R-t)}" fill="${FILL}"/>`;
    p+=`<path fill-rule="evenodd" d="${ellipse(x+eyeX,volY,R,R)} ${ellipse(x+eyeX,volY,R-t,R-t)}" fill="${FILL}"/>`;
  } else {
    p+=voluteScroll(x-eyeX, volY, R, -1, w)+voluteScroll(x+eyeX, volY, R, +1, w);
  }
  return { svg:p, bottom:volY+R*0.5, halfW:eyeX+R };  // shaft start + capital half-width
}
function archColumn(x, colTop, colBot, s, letter){
  const style=C.pillar==='ionic'?'ionic':'doric';
  const vstyle=C.volute||'curl';
  // wider shaft when interlacing bars+0s (legible lanes) or inscribing a letter (room to carve).
  // Widest when BOTH: a bold letter centered + 0-chains flanking it.
  const sw=((letter&&C.shaftZeros)?7.0:(letter?5.4:(C.shaftZeros?4.4:3.0)))*s;   // shaft half-width
  let p='';
  let shaftTop, capHalfW=sw;
  if (style==='ionic'){
    const cap=ionicCapital(x, colTop, s, vstyle, sw);
    p+=cap.svg; shaftTop=cap.bottom - 0.4*s; capHalfW=cap.halfW;
  } else {
    // doric: flared echinus capital + abacus slab on top
    const capW=3.6*s, abH=0.9*s;
    p+=`<path d="M ${f(x-capW)} ${f(colTop)} H ${f(x+capW)} V ${f(colTop+abH)} H ${f(x-capW)} Z" fill="${FILL}"/>`;
    p+=`<path d="M ${f(x-capW)} ${f(colTop+abH)} H ${f(x+capW)} L ${f(x+sw)} ${f(colTop+abH+1.4*s)} H ${f(x-sw)} Z" fill="${FILL}"/>`;
    shaftTop=colTop+abH+1.4*s; capHalfW=capW;
  }
  // foot: the SAME stepped bars (un-flipped) at the bottom, sized to the shaft
  const footH = (1.3+1.5)*s;
  const foot=steppedFoot(x, colBot-footH, s, false, sw);
  const shaftBot=colBot-foot.height;
  // fluted shaft. Normally solid bars; if shaftZeros, INTERLACE solid vertical bars
  // with vertical chains of 0s across the width. The outermost lanes (left & right
  // edges) are ALWAYS solid bars; interior alternates solid / 0-chain.
  const flN = style==='ionic'?5:4;
  const gap=0.45*s, barW=(2*sw-(flN-1)*gap)/flN;
  // letter geometry (shared by the inscribe modes below). In byte-chained mode the
  // letter is the PRIMARY element (bigger + bolder), with 0s as surrounding texture.
  const big = !!(letter && C.shaftZeros);
  const lh = big ? Math.min((shaftBot-shaftTop)*0.82, 9.0*s) : Math.min((shaftBot-shaftTop)*0.62, 6.0*s);
  const lw = big ? Math.min(2*sw*0.92, lh*0.84) : Math.min(2*sw*0.72, lh*0.82);
  const lcy = (shaftTop+shaftBot)/2;                       // letter center on the shaft
  const lstroke = big ? Math.max(1.2*s, lw*0.30) : Math.max(0.85*s, lw*0.24);  // bolder when chained
  const shaftOuter = `M ${f(x-sw)} ${f(shaftTop)} H ${f(x+sw)} V ${f(shaftBot)} H ${f(x-sw)} Z`;
  if (letter && C.shaftZeros){
    // BYTE-CHAINED pillar: the shaft is woven from vertical CHAINS OF 0s (the byte-chain
    // texture), and the PURPOSE letter sits ON TOP as solid raised relief. 0s whose
    // center falls within the letter's clear-zone are skipped, so the letter reads as
    // clean stone among the bytes. Letters spell the word; the 0s carry the "bytes" -
    // the "Bytes of Purpose" unification.
    const zeroColor = C.zeroColor || C.bitOffColor || FILL;
    const nLanes = C.shaftLanes || 3;
    const laneW = 2*sw / nLanes;
    const zr = Math.min(laneW*0.42, 1.6*s);
    const zt = zr*0.46;
    const zStep = zr*2.3;
    const nZ = Math.max(2, Math.floor((shaftBot-shaftTop - zr)/zStep));
    // letter clear-zone (a little padding so 0s don't touch the strokes)
    const clrX = lw/2 + zr*0.7, clrY = lh/2 + zr*0.5;
    for (let l=0; l<nLanes; l++){
      const zx = x - sw + laneW*(l+0.5);
      for (let j=0;j<nZ;j++){
        const cy = shaftTop + zr + j*((shaftBot-shaftTop-2*zr)/(nZ-1||1));
        if (Math.abs(zx-x) < clrX && Math.abs(cy-lcy) < clrY) continue; // behind the letter
        p+=`<path fill-rule="evenodd" d="${ellipse(zx,cy,zr,zr)} ${ellipse(zx,cy,zr-zt,zr-zt)}" fill="${zeroColor}"/>`;
      }
    }
    const cut = letterPath(letter, x, lcy, lw, lh, lstroke);
    if (cut) p+=`<path fill-rule="evenodd" d="${cut}" fill="${FILL}"/>`;   // solid letter on top
  } else if (letter){
    // INSCRIBED letter only (no byte-chain): solid shaft with the letter knocked out
    // as engraved negative space, crisp + theme-aware at any size.
    const cut = letterPath(letter, x, lcy, lw, lh, lstroke);
    p+=`<path fill-rule="evenodd" d="${shaftOuter} ${cut}" fill="${FILL}"/>`;
  } else if (C.shaftZeros){
    const barColor = C.barColor || C.bitOnColor || FILL;    // solid bars
    const zeroColor = C.zeroColor || C.bitOffColor || FILL;  // the 0s
    // lanes across the shaft: alternate bar / zero, with first & last = bar.
    // Bars are thin; the 0-lanes are wider so the rings read clearly.
    const nBars = C.shaftBars || 4;         // number of solid bars (edges included)
    const nZeroLanes = nBars - 1;            // gaps between bars get 0-chains
    const barT = 0.7*s;                      // solid bar thickness (thin)
    const zoneW = (2*sw - nBars*barT) / nZeroLanes;  // width of each 0-lane
    const zr = Math.min(zoneW*0.40, 1.5*s);  // zero radius (bigger now)
    // inset the 0-chain from the shaft ends so the first/last rings clear the
    // capital above and the base below (the solid bars still run full height).
    const zPad = zr*0.5;
    const chainTop = shaftTop + zPad, chainBot = shaftBot - zPad;
    const zStep = zr*2.25;
    const nZ = Math.max(2, Math.floor((chainBot-chainTop)/zStep));
    const zt = zr*0.46;
    // walk across: bar, zero-zone, bar, zero-zone, ... bar
    let cur = x - sw;
    for (let b=0; b<nBars; b++){
      // solid bar (left edge is the first one, right edge the last)
      p+=`<path d="M ${f(cur)} ${f(shaftTop)} h ${f(barT)} V ${f(shaftBot)} h ${f(-barT)} Z" fill="${barColor}"/>`;
      cur += barT;
      if (b < nZeroLanes){
        // zero-zone filling the gap to the next bar: one centered chain of 0s
        const zx = cur + zoneW/2;
        for (let j=0;j<nZ;j++){
          const cy = chainTop + zr + j*((chainBot-chainTop-2*zr)/(nZ-1||1));
          p+=`<path fill-rule="evenodd" d="${ellipse(zx,cy,zr,zr)} ${ellipse(zx,cy,zr-zt,zr-zt)}" fill="${zeroColor}"/>`;
        }
        cur += zoneW;
      }
    }
  } else {
    for (let i=0;i<flN;i++){
      const bx=x-sw+i*(barW+gap);
      p+=`<path d="M ${f(bx)} ${f(shaftTop)} h ${f(barW)} V ${f(shaftBot)} h ${f(-barW)} Z" fill="${FILL}"/>`;
    }
  }
  p+=foot.svg;
  // "entire columns gold": recolor the whole column's fills/strokes.
  if (C.goldFill){
    p = p.split(FILL).join(C.goldFill);
  }
  return { svg:p, halfW:Math.max(capHalfW, foot.halfW) };
}

// ---------- layout ----------
const sides = C.mark === 'single' ? 0 : (C.mark === 'triad' ? 1 : C.rings);
const parts = [];
let maxAbsX=0, maxStackH=0, minBaseY=0;
// `flat` makes every column the center column's height (no taper); noZeros means
// every column is a '1' (digit forced).
function digitFor(d){ return C.noZeros ? '1' : digitAt(d); }
function countFor(d){ return C.flat ? countAt(0) : countAt(d); }

const ground = C.arrange==='ground';
const avenue = C.arrange==='avenue';
const inscribe = C.arrange==='inscribe' || (C.letters && C.arrange!=='ground' && C.arrange!=='avenue' && C.arrange!=='wedge' && C.arrange!=='pyramid');

if (inscribe){
  // PURPOSE inscription: N equal-height columns left-to-right, each shaft inscribed
  // with one letter of C.letters. A temple colonnade that spells a word.
  const word = (C.letters||'PURPOSE').toUpperCase().split('');
  const s = C.letterScale || 1.0;
  // colUnits = pillar height in cell-units (default 7 = tall temple column). Lower it
  // for stubbier, more squat pillars (the letter stays sized to the shaft).
  const colUnits = C.colUnits || C.centerCount;
  const colH = C.cellH * colUnits * s;
  const step = (C.colGap*1.6 + 6*s);      // spacing between column centers
  const n = word.length;
  for (let i=0;i<n;i++){
    const x = (i - (n-1)/2) * step;
    const r = archColumn(x, -colH, 0, s, word[i]);
    parts.push(r.svg);
    maxAbsX = Math.max(maxAbsX, Math.abs(x)+r.halfW);
  }
  maxStackH = colH + 2;
}

if (avenue){
  // Single avenue receding straight back: rows of L/R column pairs marching away
  // to ONE vanishing point. Row 0 = nearest (largest, widest aisle, lowest base).
  const rows = C.rings;
  const aisle0 = C.colGap*1.7;          // near aisle half-width
  const nearH = C.cellH*C.centerCount;  // real column height (near)
  for (let r=0; r<=rows; r++){
    const t = r/rows;                    // 0 near .. 1 far
    const pscale = 1 - C.recede*t;       // foreshorten (perspective scale)
    // bases recede UP toward the horizon with an easing so far rows bunch near it
    const baseY = -C.horizon * Math.pow(t, 0.78);
    const aisleHalf = aisle0 * pscale;   // aisle narrows with distance
    const colH = nearH * pscale;         // same real height, foreshortened
    for (const sgn of [-1, 1]){
      const x = sgn*aisleHalf;
      const r2=archColumn(x, baseY-colH, baseY, pscale);
      // draw far rows first (behind), near rows last (front): push order = r desc handled below
      parts.push({svg:r2.svg, z:r, halfW:r2.halfW, x});
    }
  }
  // painter's order: farthest (largest r) at back -> sort ascending so near drawn last
  parts.sort((a,b)=> b.z - a.z);
  for (const p of parts){ maxAbsX=Math.max(maxAbsX, Math.abs(p.x)+p.halfW); }
  // tallest point = near column top (nearH above baseline 0); far feet sit at -horizon
  maxStackH = Math.max(C.cellH*C.centerCount, C.horizon + C.cellH*C.centerCount*(1-C.recede)) + 4;
  // replace parts (objects) with their svg strings in z-order
  const ordered = parts.map(p=>p.svg);
  parts.length=0; parts.push(...ordered);
}

for (let side=-sides; side<=sides && !avenue && !inscribe; side++){
  const d=Math.abs(side), isCenter=d===0;
  const n=countFor(d), digit=digitFor(d);
  let s, x, baseY, colHmul=1;
  if (ground){
    // Desert-wanderer one-point perspective, receding to BOTH sides from center.
    const t = d / C.rings;                       // 0 center .. 1 farthest
    const pscale = 1 - C.recede * t;             // foreshortening (near=1, far<1)
    s = pscale;                                  // columns same REAL height, scaled by distance
    // x spreads out but bunches as it recedes (gaps scale with pscale)
    x = 0; for (let k=1;k<=d;k++){ const pk=1 - C.recede*((k-0.5)/C.rings); x += C.colGap*pk; }
    x *= Math.sign(side);
    // foot rises toward the horizon as columns recede
    baseY = -C.horizon * (t*t*0.5 + t*0.5);      // ease toward horizon, never past it
  } else {
    s = C.flat?scaleAt(0):scaleAt(d);
    x=0; for (let k=1;k<=d;k++){ const sk=C.flat?scaleAt(0):(scaleAt(k-1)+scaleAt(k))/2; x += C.colGap*sk; }
    x*=Math.sign(side);
    baseY = C.arrange==='wedge' ? -C.wedgeRise*d*s : 0;
  }
  const ch=C.cellH*(digit==='0'?C.zeroSquash:1.0)*s;
  const colH=n*ch*colHmul;
  let halfExt = 4.2*s;
  if (C.colMode==='arch' && digit==='1'){
    const es = isCenter&&C.emphasis ? s*1.06 : s;
    if (C.colStack){
      // STACKED drums: stack shorter columns, with an optional vertical gap between.
      const stackN=Math.max(1, Math.min(n, Math.round(colH/(13*s))));
      const gap=(C.stackGap||0)*s;
      const segH=(colH-gap*(stackN-1))/stackN;
      for (let i=0;i<stackN;i++){
        const top=baseY-(i+1)*segH-i*gap, bot=baseY-i*(segH+gap);
        const r=archColumn(x, top, bot, es);
        parts.push(r.svg); halfExt=Math.max(halfExt, r.halfW);
      }
    } else {
      const r=archColumn(x, baseY-colH, baseY, es);
      parts.push(r.svg); halfExt=Math.max(halfExt, r.halfW);
    }
  } else {
    for (let i=0;i<n;i++){
      const cy=baseY-(i+0.5)*ch;
      if (digit==='1') parts.push(glyph1(x,cy, isCenter&&C.emphasis ? s*1.06 : s, isCenter));
      else parts.push(glyph0(x,cy,s));
    }
  }
  maxStackH=Math.max(maxStackH, -(baseY-colH));   // topmost extent
  minBaseY=Math.min(minBaseY, baseY);              // lowest baseline (wedge dips down at center)
  maxAbsX=Math.max(maxAbsX, Math.abs(x)+halfExt);
}

const padX=6, padTop=6, padBot=6;
const W=2*maxAbsX+2*padX, H=maxStackH+padTop+padBot, tx=W/2, ty=H-padBot;

// Optional temple/desert SCENE: sky gradient + horizon + ground plane behind columns.
let defs='', bg='';
if (C.scene){
  const sceneName = typeof C.scene==='string' ? C.scene : 'desert';
  // horizon line sits a bit below the column feet (feet are at y=ty in screen space)
  const groundY = ty + 1;                 // screen-space y of the ground line (column feet)
  const horizonY = groundY - 2;           // horizon just behind the feet
  // Sleek + minimal: a single 2-tone vertical gradient (top darker -> bottom slightly
  // lighter), a near-invisible ground band, and a small soft glow on the horizon.
  const palettes = {
    desert: {top:'#1a1024', bot:'#2e1b2b', glow:'#e8a657'},   // deep plum to warm dusk
    dusk:   {top:'#0c1024', bot:'#1c2140', glow:'#8a7fd0'},   // midnight blue, cool glow
    night:  {top:'#06070f', bot:'#0d1020', glow:'#3b6fb0'},   // near-black, faint blue
  };
  const pal = palettes[sceneName] || palettes.desert;
  defs =
    `<defs>`+
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">`+
      `<stop offset="0%" stop-color="${pal.top}"/><stop offset="100%" stop-color="${pal.bot}"/>`+
    `</linearGradient>`+
    `<radialGradient id="glow" cx="50%" cy="${f(horizonY/H*100)}%" r="55%">`+
      `<stop offset="0%" stop-color="${pal.glow}" stop-opacity="0.5"/>`+
      `<stop offset="45%" stop-color="${pal.glow}" stop-opacity="0"/>`+
    `</radialGradient>`+
    `</defs>`;
  bg =
    `<rect x="0" y="0" width="${f(W)}" height="${f(H)}" fill="url(#sky)"/>`+
    (C.glow ? `<rect x="0" y="0" width="${f(W)}" height="${f(H)}" fill="url(#glow)"/>` : '')+
    // a single hairline horizon, very subtle
    `<rect x="0" y="${f(horizonY)}" width="${f(W)}" height="0.6" fill="#ffffff" opacity="0.08"/>`;
}

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${f(W)}" height="${f(H)}" viewBox="0 0 ${f(W)} ${f(H)}" version="1.1" xmlns="http://www.w3.org/2000/svg">
 <title>Binary pyramid logo: 1 and 0 columns radiating from a central pillar</title>
 ${defs}
 ${bg}
 <g transform="translate(${f(tx)} ${f(ty)})">
  ${parts.join('\n  ')}
 </g>
</svg>
`;
}

