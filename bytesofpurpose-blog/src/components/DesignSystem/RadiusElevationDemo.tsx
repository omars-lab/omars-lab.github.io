import React from 'react';
import styles from './styles.module.css';

/**
 * RadiusSwatches — one tile per radius token, the tile clipped to `var(--radius-N)` so the
 * reader sees the real corner. Values shown are the light-mode resolved values (caption).
 */
const RADII: Array<{token: string; value: string; use: string}> = [
  {token: '--radius-sm', value: '0.4rem', use: 'small controls / buttons'},
  {token: '--radius-md', value: '0.5rem', use: 'default card corner'},
  {token: '--radius-lg', value: '14px', use: 'hero / chooser card'},
  {token: '--radius-pill', value: '3em', use: 'pills / tags'},
  {token: '--radius-full', value: '9999px', use: 'circles'},
];

export function RadiusSwatches(): React.JSX.Element {
  return (
    <div className={styles.tileGrid}>
      {RADII.map(({token, value, use}) => (
        <div className={styles.tile} key={token}>
          <div className={styles.tileSample} style={{borderRadius: `var(${token})`}} />
          <div className={styles.tileLabel}>
            <div className={styles.tileToken}>{token}</div>
            <div className={styles.tileValue}>
              {value} · {use}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ElevationDemo — the quiet two-step system. The card rests on the faint --shadow-sm and earns
 * the medium --shadow-md plus a --lift-card translate ON HOVER, not at rest (discipline rule 5).
 * Motion self-guards for prefers-reduced-motion in the CSS module (discipline rule 6).
 */
export function ElevationDemo(): React.JSX.Element {
  return (
    <div className={styles.tileGrid}>
      <div className={styles.liftCard}>
        <strong>Hover me</strong>
        <div className={styles.liftHint}>
          rests on <code>--shadow-sm</code>, lifts to <code>--shadow-md</code> +{' '}
          <code>--lift-card</code> on hover
        </div>
      </div>
    </div>
  );
}
