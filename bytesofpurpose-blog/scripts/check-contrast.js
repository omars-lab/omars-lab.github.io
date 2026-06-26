#!/usr/bin/env node

/**
 * check-contrast.js — a FAST, edit-time WCAG contrast guard for the theme's color variables.
 *
 * The e2e axe gate (test/e2e/accessibility.spec.ts) catches color-contrast failures, but only on a
 * full prod build + Playwright run (minutes). This catches the most common regression — someone
 * darkens a background or lightens a text color in src/css/custom.css and quietly drops a critical
 * pairing below AA — in milliseconds, right when the CSS is edited.
 *
 * HOW: it reads the theme's CSS custom properties from the `:root` block (light mode) and the
 * `html[data-theme='dark']` block (dark mode), resolves the PAIRS below to their hex values, and
 * computes the WCAG 2 contrast ratio for each. A pair under its threshold is a finding.
 *
 * The PAIRS manifest is the contract: the foreground/background pairings the theme INTENDS to be
 * readable (body text on the page, primary links on the page, button text on the primary fill, the
 * tea-ink on each pastel accent, …). When you add a themed surface, add its pair here so the guard
 * covers it. Thresholds: 4.5 for normal text, 3.0 for large text / UI components (WCAG AA).
 *
 * Usage:  node scripts/check-contrast.js [path/to/custom.css] [--json]
 * Exit:   2 if any pair is below its threshold (a real AA regression); else 0.
 *         (ERROR-tier: a contrast regression is a shipped a11y defect the axe gate would also fail.)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_CSS = path.join(ROOT, 'src', 'css', 'custom.css');

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const cssPath = args.find((a) => !a.startsWith('--')) || DEFAULT_CSS;

// AA thresholds.
const AA_TEXT = 4.5; // normal body text
const AA_LARGE = 3.0; // large text (≥18.66px bold / ≥24px) + UI components / accent fills

// The pairs the theme intends to be readable. `fg`/`bg` are CSS var names (or literal hex). `min`
// is the AA threshold (AA_TEXT for body copy, AA_LARGE for large/decorative). `note` describes it.
// Checked in BOTH themes; a pair whose vars don't exist in a theme is skipped for that theme.
const PAIRS = [
  {fg: '--ifm-font-color-base', bg: '--ifm-background-color', min: AA_TEXT, note: 'body text on the page'},
  {fg: '--ifm-heading-color', bg: '--ifm-background-color', min: AA_LARGE, note: 'headings on the page (large)'},
  {fg: '--ifm-color-content-secondary', bg: '--ifm-background-color', min: AA_TEXT, note: 'secondary text on the page'},
  {fg: '--ifm-font-color-base', bg: '--ifm-card-background-color', min: AA_TEXT, note: 'body text on a card'},
  {fg: '--ifm-color-primary', bg: '--ifm-background-color', min: AA_TEXT, note: 'primary (links) on the page'},
  {fg: '--ifm-color-primary', bg: '--ifm-card-background-color', min: AA_TEXT, note: 'primary (links) on a card'},
  {fg: '--ifm-button-color', bg: '--ifm-color-primary', min: AA_TEXT, note: 'button text on the primary fill'},
  // Tea-party pastel accents: --tea-ink is the only text allowed to ride on them (AA).
  {fg: '--tea-ink', bg: '--tea-mint', min: AA_TEXT, note: 'tea-ink on the mint accent'},
  {fg: '--tea-ink', bg: '--tea-pink', min: AA_TEXT, note: 'tea-ink on the pink accent'},
  {fg: '--tea-ink', bg: '--tea-green', min: AA_TEXT, note: 'tea-ink on the light-green accent'},
];

// ── CSS var parsing ─────────────────────────────────────────────────────────
// Pull the body of a CSS rule by its selector (the first matching block).
function ruleBody(css, selector) {
  // Escape regex metachars in the selector, then grab the first {...} after it.
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css.match(new RegExp(`${esc}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : '';
}

// Parse `--var: value;` declarations from a rule body into a map.
function parseVars(body) {
  const vars = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

// Resolve a var name (or literal) to an {r,g,b} color, following one level of var() reference and
// the theme's own scale (so --brand-green etc. resolve). Returns null if it isn't a solid color.
function resolveColor(token, vars) {
  let v = token.trim();
  // var(--x) reference
  const ref = v.match(/^var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)$/);
  if (ref) v = vars[ref[1]] || '';
  // a bare var NAME passed in
  if (v.startsWith('--')) v = vars[v] || '';
  return parseColor(v.trim());
}

// Parse #hex / #rgb / rgb()/rgba() → {r,g,b}. (rgba with alpha < 1 can't be contrast-checked
// against an unknown backdrop, so we treat alpha as opaque-over-bg only when alpha is 1.)
function parseColor(v) {
  if (!v) return null;
  let m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return {r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255};
  }
  m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const [a, b, c] = m[1];
    return {r: parseInt(a + a, 16), g: parseInt(b + b, 16), b: parseInt(c + c, 16)};
  }
  m = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*(?:[,/]\s*([\d.]+)\s*)?\)$/i);
  if (m) {
    const alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (alpha < 1) return null; // translucent → can't standalone-check
    return {r: +m[1], g: +m[2], b: +m[3]};
  }
  return null;
}

// ── WCAG contrast math ──────────────────────────────────────────────────────
function relLum({r, g, b}) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const l1 = relLum(a);
  const l2 = relLum(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ── run ─────────────────────────────────────────────────────────────────────
function run() {
  if (!fs.existsSync(cssPath)) {
    console.error(`❌ no CSS file at ${cssPath}`);
    process.exit(2);
  }
  const css = fs.readFileSync(cssPath, 'utf8');
  const themes = [
    {name: 'light', vars: parseVars(ruleBody(css, ':root'))},
    {name: 'dark', vars: parseVars(ruleBody(css, "html[data-theme='dark']"))},
  ];

  const findings = [];
  for (const {name, vars} of themes) {
    if (!Object.keys(vars).length) continue;
    for (const pair of PAIRS) {
      const fg = resolveColor(pair.fg, vars);
      const bg = resolveColor(pair.bg, vars);
      if (!fg || !bg) continue; // var not defined in this theme (or translucent) → skip
      const ratio = contrast(fg, bg);
      if (ratio < pair.min) {
        findings.push({
          theme: name,
          fg: pair.fg,
          bg: pair.bg,
          note: pair.note,
          ratio: Math.round(ratio * 100) / 100,
          min: pair.min,
        });
      }
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({css: path.relative(ROOT, cssPath), findings}, null, 2));
  } else if (!findings.length) {
    console.log(`✅ contrast: every theme pair meets WCAG AA (${path.relative(ROOT, cssPath)}).`);
  } else {
    console.log(`🎨 contrast: ${findings.length} pair(s) below WCAG AA in ${path.relative(ROOT, cssPath)}\n`);
    for (const f of findings) {
      console.log(`  [${f.theme}]  ${f.note}`);
      console.log(`      ↳ ${f.fg} on ${f.bg} = ${f.ratio}:1, needs ≥ ${f.min}:1`);
    }
    console.log('\n❌ a contrast regression — the axe e2e gate would also fail this. Fix the colors.');
  }
  process.exit(findings.length ? 2 : 0);
}

run();
