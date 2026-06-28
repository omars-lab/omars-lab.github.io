// Hero visual-tuning model: a small schema of TUNABLE hero properties, each mapped to a CSS custom
// property the hero variants read (with a baked fallback), plus helpers to sync those values to/from
// the URL query string. The DebugMenu "Hero Tuner" section (dev-only) drives this; a shared URL
// reproduces the look; Claude reads the params and bakes them back into the CSS as the new defaults.
//
// Contract: every tunable hero property in index.module.css is written as `var(--<cssVar>, <default>)`.
// With no panel and no URL params the baked default holds, so PRODUCTION is unaffected (the panel +
// the param-reading are localhost-only — see applyHeroParams + the DebugMenu double gate).
//
// URL convention: each param is a query key `ht-<key>=<value>` (ht = "hero tuning"), kept separate
// from the experiment override keys (`ab-...`). Values are stored verbatim as the CSS var value
// (e.g. "62%", "#c66b3d", "1.4"), so reading is a direct passthrough to the CSS var.

import {isLocalhost} from '@site/src/experiments';

export type HeroParamKind = 'slider' | 'color' | 'select' | 'toggle';

export type HeroParam = {
  /** Stable key; the URL uses `ht-<key>` and the CSS var is `--<cssVar>`. */
  key: string;
  /** Human label shown in the panel. */
  label: string;
  /** Which control to render. */
  kind: HeroParamKind;
  /** The CSS custom property this drives (without the leading `--`). */
  cssVar: string;
  /** The baked default (also the CSS fallback). The panel/URL omit a param equal to this. */
  default: string;
  /** Which hero variant(s) this applies to (for grouping + the panel's variant filter). */
  variants: ReadonlyArray<'studio' | 'boutique' | 'all'>;
  /** A group label for panel organization. */
  group: 'Arch mask' | 'Layout' | 'Style' | 'House';
  /** slider: numeric bounds + unit appended to the value. */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** select: the allowed option values. */
  options?: ReadonlyArray<string>;
};

// The schema. Keep each entry's `default` in lockstep with the CSS `var(--<cssVar>, <default>)`
// fallback in index.module.css — that fallback is the source of truth for production; this default
// is what the panel resets to and what it treats as "unchanged" (so the URL stays short).
export const HERO_PARAMS: ReadonlyArray<HeroParam> = [
  // ── Arch mask (the recurring pain: pin the arched opening precisely) ──────────────────────────
  // These drive the `mask-position` / `mask-size` of the masked "peek" layer that clips a scene to
  // its arched opening. Because every scene PNG places the arch identically, ONE set fits all.
  // NOTE: these defaults match the CSS `var(--arch-*, <fallback>)` fallbacks: archX/Y default '50%'
  // (== `center`), archSize default 'contain'. A param equal to its default is omitted from the URL +
  // inline style (so the baked CSS fallback wins). The size slider seeds at 100 but the "unchanged"
  // value is `contain`; moving the slider sends `NN%` and overrides.
  {key: 'archX', label: 'Arch X', kind: 'slider', cssVar: 'arch-x', default: '50%',
   variants: ['all'], group: 'Arch mask', min: 0, max: 100, step: 0.5, unit: '%'},
  {key: 'archY', label: 'Arch Y', kind: 'slider', cssVar: 'arch-y', default: '50%',
   variants: ['all'], group: 'Arch mask', min: 0, max: 100, step: 0.5, unit: '%'},
  {key: 'archSize', label: 'Arch size', kind: 'slider', cssVar: 'arch-size', default: 'contain',
   variants: ['all'], group: 'Arch mask', min: 50, max: 140, step: 0.5, unit: '%'},
  {key: 'archSide', label: 'Arch flip', kind: 'select', cssVar: 'arch-flip', default: 'none',
   variants: ['all'], group: 'Arch mask', options: ['none', 'scaleX(-1)']},

  // ── Layout (where the sign + openings sit) ───────────────────────────────────────────────────
  {key: 'signX', label: 'Sign X', kind: 'slider', cssVar: 'sign-x', default: '0px',
   variants: ['studio', 'boutique'], group: 'Layout', min: -120, max: 120, step: 1, unit: 'px'},
  {key: 'signY', label: 'Sign Y', kind: 'slider', cssVar: 'sign-y', default: '0px',
   variants: ['studio', 'boutique'], group: 'Layout', min: -80, max: 80, step: 1, unit: 'px'},
  {key: 'signScale', label: 'Sign size', kind: 'slider', cssVar: 'sign-scale', default: '1',
   variants: ['studio', 'boutique'], group: 'Layout', min: 0.6, max: 1.6, step: 0.02},
  {key: 'archScale', label: 'Door size', kind: 'slider', cssVar: 'door-scale', default: '1',
   variants: ['boutique'], group: 'Layout', min: 0.85, max: 1.3, step: 0.01},

  // ── Style (colors + glow) ────────────────────────────────────────────────────────────────────
  // (studio body colour 'wall' lives in the House group below.)
  {key: 'stone', label: 'Stone color', kind: 'color', cssVar: 'stone', default: '#e3ddd0',
   variants: ['boutique'], group: 'Style'},
  {key: 'glow', label: 'Glow', kind: 'color', cssVar: 'glow', default: '#ffce8a',
   variants: ['boutique'], group: 'Style'},
  {key: 'glowStrength', label: 'Glow strength', kind: 'slider', cssVar: 'glow-strength',
   default: '0.55', variants: ['boutique'], group: 'Style', min: 0, max: 1, step: 0.01},

  // ── House (variant C, the Lebanese central-hall home): the structural knobs ────────────────────
  // Each maps to a var(--<cssVar>, <default>) on the studio CSS; the defaults here MUST match those
  // CSS fallbacks. Drag in the panel → URL ht- params → Copy URL to share → Claude bakes as defaults.
  {key: 'bodyW', label: 'House width', kind: 'slider', cssVar: 'body-w', default: '720px',
   variants: ['studio'], group: 'House', min: 360, max: 900, step: 5, unit: 'px'},
  {key: 'winRaise', label: 'Window raise', kind: 'slider', cssVar: 'win-raise', default: '6%',
   variants: ['studio'], group: 'House', min: 0, max: 30, step: 0.5, unit: '%'},
  {key: 'winScale', label: 'Window size', kind: 'slider', cssVar: 'win-scale', default: '0.9',
   variants: ['studio'], group: 'House', min: 0.7, max: 1.1, step: 0.01},
  {key: 'doorDrop', label: 'Door drop', kind: 'slider', cssVar: 'door-drop', default: '12%',
   variants: ['studio'], group: 'House', min: 0, max: 25, step: 0.5, unit: '%'},
  // the hip line's FOOT: x-position where the gold line meets the eave (apex is fixed at 50%). Default
  // 80% = 1/5 in from the bottom-RIGHT corner.
  {key: 'roofLine', label: 'Roof gold-line', kind: 'slider', cssVar: 'roof-line', default: '80%',
   variants: ['studio'], group: 'House', min: 50, max: 95, step: 0.5, unit: '%'},
  {key: 'roof', label: 'Roof color', kind: 'color', cssVar: 'roof', default: '#c66b3d',
   variants: ['studio'], group: 'House'},
  {key: 'wall', label: 'Body color', kind: 'color', cssVar: 'wall', default: '#3f7d72',
   variants: ['studio'], group: 'House'},
  // sign-x/-y/-scale already exist in Layout and drive --sign-x/-y/-scale on the studio board.
];

const URL_PREFIX = 'ht-';

const byKey = new Map(HERO_PARAMS.map((p) => [p.key, p]));

/** Read the current tuning values from the URL (only the keys present + valid). */
export function readHeroParamsFromUrl(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  const q = new URLSearchParams(search);
  for (const [k, v] of q.entries()) {
    if (!k.startsWith(URL_PREFIX)) continue;
    const key = k.slice(URL_PREFIX.length);
    if (byKey.has(key) && v) out[key] = v;
  }
  return out;
}

/** Build the CSS var name (with leading --) for a param key. */
export function cssVarFor(key: string): string | null {
  const p = byKey.get(key);
  return p ? `--${p.cssVar}` : null;
}

/**
 * Apply a set of tuning values as inline CSS custom properties on `root`. Values equal to the param
 * default are REMOVED (so the baked CSS fallback wins and the inline style stays minimal).
 */
export function applyHeroValues(root: HTMLElement, values: Record<string, string>): void {
  for (const p of HERO_PARAMS) {
    const v = values[p.key];
    const name = `--${p.cssVar}`;
    if (v != null && v !== p.default) root.style.setProperty(name, v);
    else root.style.removeProperty(name);
  }
}

/**
 * Write the tuning values into the URL (as `ht-<key>=<value>`), omitting any equal to the default so
 * the URL stays short and a "clean" look has no `ht-` params. Uses replaceState so there is no reload
 * and no scroll jump. Returns the resulting absolute URL (the shareable string).
 */
export function writeHeroParamsToUrl(values: Record<string, string>): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  // clear existing ht- params first
  for (const k of [...url.searchParams.keys()]) {
    if (k.startsWith(URL_PREFIX)) url.searchParams.delete(k);
  }
  for (const p of HERO_PARAMS) {
    const v = values[p.key];
    if (v != null && v !== p.default) url.searchParams.set(`${URL_PREFIX}${p.key}`, v);
  }
  window.history.replaceState(null, '', url.toString());
  return url.toString();
}

/**
 * DEV-ONLY: on localhost, read the hero tuning params from the URL and apply them to the hero root
 * element so a SHARED URL reproduces the tuned look. No-op off localhost (so production renders the
 * baked CSS defaults regardless of any `ht-` params an outsider might append).
 */
export function applyHeroParams(root: HTMLElement | null): void {
  if (!root || !isLocalhost()) return;
  applyHeroValues(root, readHeroParamsFromUrl(window.location.search));
}

/** The defaults map (key → default value), used by the panel's Reset + "unchanged" comparison. */
export function heroDefaults(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of HERO_PARAMS) out[p.key] = p.default;
  return out;
}
