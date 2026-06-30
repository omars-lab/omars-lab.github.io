// ── The URL-PARAMETER REGISTRY: the single source of truth for every query param the site reads ──
//
// WHY THIS FILE EXISTS
// URL params were sprawling: experiment overrides (`ab-…`), hero tuning (`ht-…`), a test seam
// (`hero-scene`), ingress attribution (`im`, `internal`) — each read in a different file with its own
// ad-hoc parsing, no shared list, no validation, nothing to grep. This registry is the ONE place that
// enumerates them, with each param's owner, purpose, scope (does it work in production or localhost
// only?), and allowed values. New params get ADDED HERE; readers reference this so the set stays
// discoverable and validatable.
//
// ⚠️ KEEP THIS UP TO DATE — the rule
// When you introduce a NEW url param ANYWHERE in src/, add an entry to URL_PARAMS below in the SAME
// change. The `validate-url-params.js` script (make validate-url-params) greps src/ for param reads
// (`searchParams.get('x')`, `.startsWith('x-')`) and FAILS if it finds a key/prefix not registered
// here — so an unregistered param can't quietly creep in. If you rename/remove a param, update both
// the reader and this registry. The PROD-vs-localhost `scope` is load-bearing: a `localhost` param
// MUST be gated by `isLocalhost()` at its read site (production must ignore it), and the validator
// can't enforce that for you, so honour it.
//
// This file is intentionally dependency-free (no React, no posthog) so any module can import the
// constants/validators without pulling in a graph. The localhost GATE itself lives in experiments.ts
// (`isLocalhost`) — registry entries only DECLARE scope; each reader applies the gate.

// Exact-key CONSTANTS for params read from TS, so the key string lives in ONE place (here) and a reader
// imports it instead of hard-coding the literal. (Prefix params like `ab-`/`ht-` are matched by prefix
// in their owners; those owners stay the prefix's home.)
export const HERO_SCENE_PARAM = 'hero-scene';
export const INGRESS_MARKER_PARAM = 'im';
export const INTERNAL_TRAFFIC_PARAM = 'internal';

export type ParamScope =
  | 'production' // honoured in prod (real visitor-facing behaviour, e.g. attribution)
  | 'localhost'; // honoured ONLY on localhost (QA/dev overrides; prod must ignore — gate with isLocalhost())

export type UrlParam = {
  /** The exact query key, OR a prefix when `prefix` is true (e.g. `ab-`, `ht-`). */
  key: string;
  /** True when `key` is a PREFIX (matches `key<anything>`), e.g. `ab-homepage-hero-anim`. */
  prefix?: boolean;
  /** Who reads it (the file that owns the parsing). */
  owner: string;
  /** One-line purpose. */
  purpose: string;
  /** Where it is honoured (prod vs localhost-only). */
  scope: ParamScope;
  /** Allowed values (an enum), when the value space is fixed + small. Omit for open-ended values. */
  allowed?: ReadonlyArray<string>;
  /** A human example of the full param. */
  example: string;
};

// The registry. ALPHABETICAL-ish by area. Add new params here (see the keep-up-to-date rule above).
export const URL_PARAMS: ReadonlyArray<UrlParam> = [
  // ── Experiment overrides (src/experiments.ts) ──────────────────────────────────────────────────
  {
    key: 'ab',
    owner: 'src/experiments.ts (urlOverride)',
    purpose:
      'Force experiment variant(s): bare `?ab=<variant>` for the experiment being read, or ' +
      '`?ab=flagA:variantA,flagB:variantB` for several at once.',
    scope: 'localhost',
    example: '?ab=homepage-hero-anim:variant_c',
  },
  {
    key: 'ab-',
    prefix: true,
    owner: 'src/experiments.ts (urlOverride)',
    purpose:
      'Force ONE experiment to a variant: `?ab-<flag-key>=<variant-id>` (uses the variant KEY). ' +
      'Flag keys + variants are declared in EXPERIMENTS.',
    scope: 'localhost',
    example: '?ab-homepage-hero-anim=variant_c',
  },

  // ── Hero visual tuning (src/lib/hero-tuning.ts) ────────────────────────────────────────────────
  {
    key: 'ht-',
    prefix: true,
    owner: 'src/lib/hero-tuning.ts',
    purpose:
      'Hero Tuner: each tunable hero property is `?ht-<key>=<value>` and sets the matching CSS var ' +
      'on the hero root (so a shared URL reproduces a tuned look). Keys = HERO_PARAMS in hero-tuning.ts.',
    scope: 'localhost',
    example: '?ht-roof=%23c66b3d&ht-bodyW=720px',
  },

  // ── Homepage hero parallax test seam (src/pages/index.tsx) ─────────────────────────────────────
  {
    // literal must match HERO_SCENE_PARAM above; the registry keeps the literal so the validator (a
    // plain string scan, no TS) can read it.
    key: 'hero-scene',
    owner: 'src/pages/index.tsx (forcedScene)',
    purpose:
      'TEST/QA: force the scroll-driven parallax hero to a specific scene index (0-based, into ' +
      'CHOOSER_CARDS), bypassing scroll math, so e2e + manual QA can land on a scene deterministically.',
    scope: 'localhost',
    example: '?ab-homepage-hero-anim=variant_c&ab-homepage-hero-scroll=pin&hero-scene=5',
  },

  // ── Ingress attribution / analytics (src/posthog.js) ───────────────────────────────────────────
  {
    key: 'im',
    owner: 'src/posthog.js',
    purpose:
      'Ingress MARKER: tags how a visitor arrived (share/copy/bookmarklet); read once for attribution, ' +
      'then stripped from the URL. Honoured in production (it is real visitor attribution).',
    scope: 'production',
    example: '?im=share-linkedin',
  },
  {
    key: 'internal',
    owner: 'src/posthog.js',
    purpose:
      'Mark this browser as INTERNAL (the author / dev), persisted to localStorage so own-traffic can ' +
      'be filtered out of analytics; stripped from the URL after it is read.',
    scope: 'production',
    allowed: ['1'],
    example: '?internal=1',
  },
];

const exact = new Map(URL_PARAMS.filter((p) => !p.prefix).map((p) => [p.key, p]));
const prefixes = URL_PARAMS.filter((p) => p.prefix);

/** Look up a registered param by an exact key or by a matching prefix. null if unregistered. */
export function lookupParam(key: string): UrlParam | null {
  const e = exact.get(key);
  if (e) return e;
  for (const p of prefixes) if (key.startsWith(p.key)) return p;
  return null;
}

/** Is this query key registered (exact or by prefix)? Used by the validator + reader guards. */
export function isRegisteredParam(key: string): boolean {
  return lookupParam(key) !== null;
}

/**
 * Validate a value against a param's `allowed` enum (when it declares one). Returns true if the param
 * has no enum (open-ended) or the value is in the enum. Readers MAY use this; it is advisory.
 */
export function isAllowedValue(key: string, value: string): boolean {
  const p = lookupParam(key);
  if (!p || !p.allowed) return true;
  return p.allowed.includes(value);
}
