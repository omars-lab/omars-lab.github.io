import React from 'react';
import posthog from 'posthog-js';
import {EXPERIMENTS, type Experiment} from '@site/src/experiments';
import type {DebugSection} from '../types';
import styles from '../styles.module.css';

// The experimentation functionality of the debug menu: list every registered
// A/B experiment, show its resolved variant + source, and force a variant on
// localhost. Toggling writes the existing ?ab-<key>=<variant> URL param (the
// same localhost override path urlOverride() reads and e2e exercises) and also
// applies a no-reload PostHog override so the change is visible immediately.

type Resolved = {variant: string; source: 'url' | 'flag' | 'default'};

function readUrlVariant(exp: Experiment): string | null {
  const q = new URLSearchParams(window.location.search);
  const perFlag = q.get(`ab-${exp.key}`);
  if (perFlag && exp.variants[perFlag]) return perFlag;
  const ab = q.get('ab');
  if (ab?.includes(':')) {
    for (const pair of ab.split(',')) {
      const [k, v] = pair.split(':');
      if (k === exp.key && v && exp.variants[v]) return v;
    }
  } else if (ab && exp.variants[ab]) {
    return ab;
  }
  return null;
}

function resolveNow(exp: Experiment): Resolved {
  const url = readUrlVariant(exp);
  if (url) return {variant: url, source: 'url'};
  const flag = (posthog?.getFeatureFlag?.(exp.key) as string) || '';
  if (flag && exp.variants[flag]) return {variant: flag, source: 'flag'};
  return {variant: 'control', source: 'default'};
}

function forceVariant(exp: Experiment, variant: string): void {
  // No-reload: override the flag in the running PostHog instance...
  try {
    posthog?.featureFlags?.overrideFeatureFlags?.({flags: {[exp.key]: variant}});
  } catch {
    /* SDK not ready — the URL param below still takes effect on reload. */
  }
  // ...and persist via the URL param so a reload (and resolveVariant in every
  // consumer) keeps the forced variant. Reloading guarantees a uniform read.
  const url = new URL(window.location.href);
  url.searchParams.set(`ab-${exp.key}`, variant);
  url.searchParams.delete('ab'); // drop the combined form to avoid ambiguity
  window.location.assign(url.toString());
}

function clearOverrides(): void {
  try {
    posthog?.featureFlags?.overrideFeatureFlags?.(false);
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('ab');
  Object.keys(EXPERIMENTS).forEach((k) => url.searchParams.delete(`ab-${k}`));
  window.location.assign(url.toString());
}

function ExperimentsBody(): JSX.Element {
  const phReady = typeof window !== 'undefined' && !!window.posthog;
  const distinctId =
    phReady && posthog?.get_distinct_id ? posthog.get_distinct_id() : null;
  const entries = Object.values(EXPERIMENTS) as Experiment[];

  return (
    <div>
      <p className={`${styles.status} ${phReady ? styles.statusOk : styles.statusWarn}`}>
        {phReady
          ? `PostHog ready · distinct_id: ${distinctId ?? '—'}`
          : 'PostHog NOT initialised — flags fall back to control (URL override still works).'}
      </p>

      {entries.length === 0 && <p>No experiments registered.</p>}

      {entries.map((exp) => {
        const {variant, source} = resolveNow(exp);
        return (
          <div key={exp.key} className={styles.exp}>
            <div>
              <span className={styles.expKey}>{exp.key}</span>
              <span className={styles.source}>({source})</span>
            </div>
            <div className={styles.variants}>
              {Object.entries(exp.variants).map(([id, payload]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.variant} ${id === variant ? styles.active : ''}`}
                  aria-pressed={id === variant}
                  onClick={() => forceVariant(exp, id)}
                  title={`Force "${id}" and reload`}>
                  {id}
                  <span className={styles.payload}>{payload}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className={styles.actions}>
        <button type="button" className={styles.clear} onClick={clearOverrides}>
          Clear overrides
        </button>
      </div>
    </div>
  );
}

export const experimentsSection: DebugSection = {
  id: 'experiments',
  title: 'Experiments',
  render: () => <ExperimentsBody />,
};
