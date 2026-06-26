import React, {CSSProperties, ReactNode, useCallback, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Quote — one quote that moved me, presented as an EDITORIAL PULL-QUOTE, not a card.
 *
 * The CX is deliberately different from <Question>: a question is something you ACT on (a
 * clickable prompt with scheduling badges and a modal); a quote is something you RECEIVE and
 * savor. So the quote text is the hero (large display type, generous space), the attribution is
 * quiet beneath it, and my reflection ("why it moved me") is a quieter layer that REVEALS on
 * demand rather than competing with the quote.
 *
 *   <Quote source="Will Durant">
 *     We are what we repeatedly do. Excellence, then, is not an act, but a habit.
 *   </Quote>
 *
 *   <Quote source="Marcus Aurelius" reflection="The thing blocking me is usually the thing worth doing.">
 *     The obstacle is the way.
 *   </Quote>
 *
 * The quote text is the children. `source` is the attribution (quiet, beneath the quote).
 * `reflection` (optional) is why it moved me — rendered behind a "why it moved me" toggle so the
 * reading flow stays clean. `cite` (optional) is a link/work the quote is from.
 */
export interface QuoteProps {
  /** The quote itself. */
  children: ReactNode;
  /** Attribution (who said/wrote it). Shown quietly beneath the quote. */
  source?: string;
  /** Why it moved me. Revealed on demand under a "why it moved me" toggle. */
  reflection?: ReactNode;
  /** Optional work/context the quote is from (a book, talk, proverb origin). */
  cite?: string;
  className?: string;
  style?: CSSProperties;
}

const Quote: React.FC<QuoteProps> = ({children, source, reflection, cite, className, style}) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <figure className={clsx(styles.quote, className)} style={style}>
      <blockquote className={styles.text}>{children}</blockquote>
      {(source || cite) && (
        <figcaption className={styles.attribution}>
          {source && <span className={styles.source}>{source}</span>}
          {cite && <span className={styles.cite}>{cite}</span>}
        </figcaption>
      )}
      {reflection && (
        <div className={styles.reflectionWrap}>
          <button
            type="button"
            className={styles.reflectionToggle}
            onClick={toggle}
            aria-expanded={open}>
            why it moved me
            <span className={clsx(styles.chevron, open && styles.chevronOpen)} aria-hidden="true">
              &#8250;
            </span>
          </button>
          {open && <div className={styles.reflection}>{reflection}</div>}
        </div>
      )}
    </figure>
  );
};

export default Quote;
