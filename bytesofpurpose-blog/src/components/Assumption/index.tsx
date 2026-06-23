import React, {ReactNode} from 'react';
import styles from './styles.module.css';

/**
 * Assumption — a yellow inline highlight for "[Assumption: …]" markers in a design doc.
 *
 * Co-design HLDs flag unvalidated premises inline ("[Assumption: 50–100 leads/week]"). On
 * the blog those should JUMP OUT as "review this / not yet proven", not blend into the
 * prose as bold text. This wraps the assumption text in a theme-aware amber highlight with
 * a small "Assumption" tag, so a reader/reviewer spots every premise still to validate.
 *
 * The importer (import-co-design) converts source `**[Assumption: …]**` markers into
 * `<Assumption>…</Assumption>` automatically; you rarely write it by hand.
 */
export interface AssumptionProps {
  children: ReactNode;
}

const Assumption: React.FC<AssumptionProps> = ({children}) => (
  <mark className={styles.assumption}>
    <span className={styles.tag} aria-hidden="true">
      Assumption
    </span>
    <span className={styles.body}>{children}</span>
  </mark>
);

export default Assumption;
