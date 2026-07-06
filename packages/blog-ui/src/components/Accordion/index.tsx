import React, {CSSProperties, ReactNode} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Accordion : a foldable list of options built on native <details>/<summary>. Zero
 * JavaScript, keyboard-accessible by default, design-system styled. Good for decision
 * posts: each option is a fold with a one-line summary and an expandable body (the
 * forces, the trade-off). Pairs with <ComparisonMatrix> (the head-to-head table);
 * the accordion carries the narrative.
 *
 * The first item can be `open` to show a default. Optional `verdict` on an item renders
 * a small pill (e.g. "chosen" / "rejected") so the decision is scannable while folded.
 *
 * Usage in MDX (body is React content, so it can hold prose, a list, or a component):
 *
 *   <Accordion
 *     label="The options"
 *     items={[
 *       {summary: 'Rebuild from scratch', verdict: 'rejected', body: (
 *         <>Too slow, and we lose the battle-tested edge cases.</>
 *       )},
 *       {summary: 'Wrap the existing engine', verdict: 'chosen', open: true, body: (
 *         <>Keeps the proven core; adds only the new surface.</>
 *       )},
 *     ]}
 *   />
 */
export interface AccordionItem {
  summary: string;
  /** Fold body: any React content (prose, a list, a component). */
  body: ReactNode;
  open?: boolean;
  /** Small pill, e.g. "chosen" / "rejected". */
  verdict?: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** A short eyebrow above the list, e.g. "The options". */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const Accordion: React.FC<AccordionProps> = ({items, label, className, style}) => {
  return (
    <div className={clsx(styles.accordion, className)} style={style}>
      {label && <p className={styles.label}>{label}</p>}
      {items.map((item, i) => (
        <details key={i} className={styles.item} open={item.open}>
          <summary className={styles.summary}>
            <span className={styles.summaryText}>{item.summary}</span>
            {item.verdict && <span className={styles.verdict}>{item.verdict}</span>}
            <span className={styles.chevron} aria-hidden="true" />
          </summary>
          <div className={styles.body}>{item.body}</div>
        </details>
      ))}
    </div>
  );
};

export default Accordion;
