import React, {CSSProperties, ReactNode} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * DiagramWithFootnotes — a mermaid (or any) diagram paired with a numbered legend.
 *
 * The diagram's nodes carry circled-number badges (①②③ …) authored directly in the
 * mermaid labels; this component renders the matching numbered legend BELOW the diagram
 * so each marker has a plain-language explanation. It formalizes the "diagram + narrative
 * legend" pattern the design posts already use by hand.
 *
 * Usage in MDX:
 *
 *   <DiagramWithFootnotes
 *     notes={[
 *       'Scanner detects the CRO problems on a prospect site.',
 *       'Agent ideates hypotheses and runs experiments on live traffic.',
 *       'Winners ship; the wins ledger reports the dollar lift.',
 *     ]}
 *   >
 *   ```mermaid
 *   graph LR
 *     A["① Scan"] --> B["② Heal"] --> C["③ Report"]
 *   ```
 *   </DiagramWithFootnotes>
 *
 * `notes` is an ordered list — index 0 is marker ①, index 1 is ②, and so on. The badges
 * in the legend are generated, so the author only writes the prose. (Authoring the badge
 * inside the mermaid label is manual on purpose: mermaid positions nodes automatically,
 * so the number lives in the label text where it stays attached to its node.)
 */

const CIRCLED = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
];

export function circledNumber(n: number): string {
  return n >= 1 && n <= CIRCLED.length ? CIRCLED[n - 1] : `(${n})`;
}

export interface DiagramWithFootnotesProps {
  /** The diagram block (typically a fenced ```mermaid code block). */
  children: ReactNode;
  /** Ordered legend entries; entry i explains marker (i+1). Strings or nodes. */
  notes: ReactNode[];
  /** Optional caption shown under the legend. */
  caption?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const DiagramWithFootnotes: React.FC<DiagramWithFootnotesProps> = ({
  children,
  notes = [],
  caption,
  className,
  style,
}) => {
  return (
    <figure className={clsx(styles.wrap, className)} style={style}>
      <div className={styles.diagram}>{children}</div>
      {notes.length > 0 && (
        <ol className={styles.legend} aria-label="Diagram legend">
          {notes.map((note, i) => (
            <li key={i} className={styles.legendItem}>
              <span className={styles.badge} aria-hidden="true">
                {circledNumber(i + 1)}
              </span>
              <span className={styles.legendText}>{note}</span>
            </li>
          ))}
        </ol>
      )}
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
};

export default DiagramWithFootnotes;
