import React from 'react';
import styles from './EspressoIcon.module.css';

/**
 * Decorative animated espresso-brewing icon for the Support button:
 * coffee fills the cup, then steam wisps rise. Purely visual (aria-hidden);
 * the button's accessible label comes from its text. Honors reduced-motion.
 */
export const EspressoIcon = (): JSX.Element => (
  <svg
    className={styles.icon}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {/* steam */}
    <path className={`${styles.steam} ${styles.steam1}`} d="M9 5c0-1 1-1 1-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path className={`${styles.steam} ${styles.steam2}`} d="M12 5c0-1 1-1 1-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path className={`${styles.steam} ${styles.steam3}`} d="M15 5c0-1 1-1 1-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

    {/* cup body */}
    <path d="M5 9h12v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    {/* handle */}
    <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />

    {/* liquid (clipped to the cup interior, animated fill) */}
    <clipPath id="espresso-cup">
      <path d="M6 10h10v4a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-4z" />
    </clipPath>
    <g clipPath="url(#espresso-cup)">
      <rect className={styles.liquid} x="6" y="10" width="10" height="7" fill="currentColor" opacity="0.55" />
    </g>
  </svg>
);
