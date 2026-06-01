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
      control: 'Buy me a $5 coffee ☕',
      test: 'Buy me a $5 coffee ☕',
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
