import React, {ReactNode} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * QuoteSet — a themed set of quotes, laid out as a VERTICAL READING FLOW (each quote gets room
 * to breathe), not a grid. The analog of <QuestionSection> for the quote kit, but intentionally
 * simpler: quotes are received, not actioned, so there is no priority sort or modal machinery —
 * just a calm, well-spaced column you read top to bottom.
 *
 *   ## Faith
 *   <SectionBanner why="The quotes I reach for when I need to remember Who is in control." />
 *   <QuoteSet>
 *     <Quote source="…">…</Quote>
 *     <Quote source="…">…</Quote>
 *   </QuoteSet>
 *
 * An optional `theme` renders a small eyebrow label above the set (use it when the set is not
 * already under an H2). Children render in authored order.
 */
export interface QuoteSetProps {
  children: ReactNode;
  /** Optional eyebrow label above the set (when not already under a heading). */
  theme?: string;
  className?: string;
}

const QuoteSet: React.FC<QuoteSetProps> = ({children, theme, className}) => {
  return (
    <section className={clsx(styles.set, className)}>
      {theme && <p className={styles.theme}>{theme}</p>}
      {children}
    </section>
  );
};

export default QuoteSet;
