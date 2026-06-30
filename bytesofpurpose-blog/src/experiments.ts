// Central registry for PostHog A/B experiments on the blog.
//
// One place to declare every experiment (flag key + variants), plus shared
// helpers for reading the active variant — including a localhost-only URL-param
// override for testing/QA that works across ALL registered experiments.
//
// QA entry point: the floating ExperimentDebugMenu (src/components/
// ExperimentDebugMenu, mounted via the swizzled @theme/Root) lists every entry
// here and toggles variants on localhost — a UI over the urlOverride mechanism.
//
// Design doc: designs/<date>-ab-testing-framework.mdx
// Workflow:  .claude/skills/run-ab-test
import posthog from 'posthog-js';

export type Experiment = {
  /** PostHog feature-flag key (kebab-case). */
  key: string;
  /** Variant id → human payload (here, button copy). control is the default. */
  variants: Record<string, string>;
};

/** Registry — add an entry per experiment. */
export const EXPERIMENTS = {
  // Same COPY in both arms — the experiment tests PRESENTATION on the /support
  // coffee CTA: control renders a plain text LINK, test renders a styled BUTTON
  // (see src/components/Support/CoffeeButton). The flag key is unchanged so the
  // historical funnel stays continuous.
  'support-button-copy': {
    key: 'support-button-copy',
    variants: {
      control: 'Buy me a coffee ☕',
      test: 'Buy me a coffee ☕',
    },
  },

  // Homepage hero ANIMATION test: does the way the chooser cards animate change how often a
  // visitor clicks into a section? An A/B/C test, three presentations of the SAME cards + copy:
  //   control   = scroll — the seamless scrolling film strip.
  //   test      = flash  — the camera-flash rotator (one card at a time, a white flash blooms from
  //                        the arch and the scene switches to the next).
  //   variant_c = studio — the Moroccan-influenced creative-studio scene: a freestanding studio SIGN
  //                        on a post next to the studio, whose arched doorway (the scene art's own
  //                        arch) you peek inside; on a change the inside cross-fades to the next.
  //   variant_d = boutique — the lit boutique storefront (Aston-Martin-inspired): THREE arched
  //                          openings (lit window, central door, lit window) glowing warmly, with
  //                          the Vestaboard SIGN hanging above the door; the door shows the current
  //                          project and the side windows preview the prev/next; all cross-fade.
  // All four reuse the same scenes + Vestaboard; only the PRESENTATION differs. The payload is the
  // variant id (the homepage reads it to pick which hero component to render).
  'homepage-hero-anim': {
    key: 'homepage-hero-anim',
    variants: {
      control: 'scroll',
      test: 'flash',
      variant_c: 'studio',
      variant_d: 'boutique',
    },
  },

  // Homepage hero SCROLL-MODEL test: the hero became scroll-driven (the door transforms into each
  // scene as you scroll, scrolling decides which scenes you traverse). This experiment picks HOW
  // scroll maps to the journey. All arms render the SAME Lebanese-house facade + the same scenes;
  // only the scroll mechanic differs, so a difference in chooser-card clicks is attributable to it:
  //   control    = static — the original TIMER-driven house (no scroll-jacking), the safe default.
  //   pin        = the hero pins full-screen and each scroll step advances one scene, then releases.
  //   inplace    = the hero stays in normal flow; the door morphs as the hero scrolls past.
  //   horizontal = vertical scroll pans the 7 scenes horizontally inside a pinned hero.
  // Separate from homepage-hero-anim so the scroll-model question is answered independently of the
  // flash-vs-scroll-strip question. The payload is the variant id (the homepage reads it to pick the
  // scroll wrapper). Default (control) keeps the non-jacking timer hero so nothing regresses.
  'homepage-hero-scroll': {
    key: 'homepage-hero-scroll',
    variants: {
      control: 'static',
      pin: 'pin',
      inplace: 'inplace',
      horizontal: 'horizontal',
    },
  },
} satisfies Record<string, Experiment>;

export type ExperimentKey = keyof typeof EXPERIMENTS;

/**
 * True only when served from a local dev host. Gates the URL-param override AND
 * the floating ExperimentDebugMenu — both are manipulation surfaces that must
 * never be reachable in production. Exported so the menu reuses the exact gate.
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

/**
 * Localhost-only URL-param override, supporting a SET of experiments:
 *   ?ab-<flag-key>=<variant>   force one specific experiment
 *   ?ab=<variant>              alias for the single experiment passed in
 *   ?ab=<flag>:<variant>,<flag>:<variant>   force several at once
 * Returns a valid variant id for `exp`, or null. Honored ONLY on localhost so
 * production traffic can't be manipulated.
 */
export function urlOverride(exp: Experiment): string | null {
  if (!isLocalhost()) return null;
  const q = new URLSearchParams(window.location.search);

  // Per-flag form: ?ab-<key>=<variant>
  const perFlag = q.get(`ab-${exp.key}`);
  if (perFlag && exp.variants[perFlag]) return perFlag;

  // Combined form: ?ab=flagA:test,flagB:control
  const ab = q.get('ab');
  if (ab) {
    if (ab.includes(':')) {
      for (const pair of ab.split(',')) {
        const [k, v] = pair.split(':');
        if (k === exp.key && v && exp.variants[v]) return v;
      }
    } else if (exp.variants[ab]) {
      // Bare ?ab=<variant> applies to the experiment being read.
      return ab;
    }
  }
  return null;
}

/**
 * Resolve the active variant for an experiment and call back with it.
 * Order: localhost URL override → PostHog flag (records exposure) → 'control'.
 * Returns an unsubscribe fn (or undefined) for use in useEffect cleanup.
 */
export function resolveVariant(
  exp: Experiment,
  onVariant: (variant: string) => void,
): undefined | (() => void) {
  const forced = urlOverride(exp);
  if (forced) {
    onVariant(forced);
    return undefined;
  }
  const unsub = posthog.onFeatureFlags(() => {
    const v = (posthog.getFeatureFlag(exp.key) as string) || 'control';
    onVariant(exp.variants[v] ? v : 'control');
  });
  return typeof unsub === 'function' ? unsub : undefined;
}
