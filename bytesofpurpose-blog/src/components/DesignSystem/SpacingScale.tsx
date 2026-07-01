import React from 'react';
import styles from './styles.module.css';

/**
 * SpacingScale — renders the soft 4px spacing scale (--space-1 … --space-9) as bars whose
 * width IS `var(--space-N)`, so the reader sees the real proportion each step represents.
 * The value column is the light-mode rem the token resolves to (caption text).
 */
const STEPS: Array<{token: string; value: string}> = [
  {token: '--space-1', value: '0.25rem'},
  {token: '--space-2', value: '0.5rem'},
  {token: '--space-3', value: '0.75rem'},
  {token: '--space-4', value: '1rem'},
  {token: '--space-5', value: '1.5rem'},
  {token: '--space-6', value: '2rem'},
  {token: '--space-7', value: '2.5rem'},
  {token: '--space-8', value: '3.5rem'},
  {token: '--space-9', value: '5rem'},
];

export default function SpacingScale(): React.JSX.Element {
  return (
    <div className={styles.spacingScale}>
      {STEPS.map(({token, value}) => (
        <div className={styles.spacingRow} key={token}>
          <span className={styles.spacingToken}>{token}</span>
          <span className={styles.spacingValue}>{value}</span>
          <span className={styles.spacingBar} style={{width: `var(${token})`}} />
        </div>
      ))}
    </div>
  );
}
