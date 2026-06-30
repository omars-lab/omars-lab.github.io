import React, {CSSProperties, ReactNode, useCallback, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * EditorialQuote — one quote that moved me, presented as an EDITORIAL PULL-QUOTE, not a card.
 * (Exported as both <EditorialQuote> and the back-compat alias <Quote>; the cascading
 * "watch your thoughts" poster style is its sibling <PosterQuote>.)
 *
 * The CX is deliberately different from <Question>: a question is something you ACT on (a
 * clickable prompt with scheduling badges and a modal); a quote is something you RECEIVE and
 * savor. So the quote text is the hero (large display type, generous space), the attribution is
 * quiet beneath it, and my reflection ("why it moved me") is a quieter layer that REVEALS on
 * demand rather than competing with the quote.
 *
 *   <EditorialQuote source="Will Durant">
 *     We are what we repeatedly do. Excellence, then, is not an act, but a habit.
 *   </EditorialQuote>
 *
 *   <EditorialQuote source="Marcus Aurelius" reflection="The thing blocking me is usually the thing worth doing.">
 *     The obstacle is the way.
 *   </EditorialQuote>
 *
 * The quote text is the children. `source` is the attribution (quiet, beneath the quote).
 * `reflection` (optional) is why it moved me — rendered behind a "why it moved me" toggle so the
 * reading flow stays clean. `cite` (optional) is a link/work the quote is from. `video` (optional)
 * is a motivational video that talks through the quote — a quiet "watch" external link beneath it.
 */
export interface EditorialQuoteProps {
  /** The quote itself. */
  children: ReactNode;
  /** Attribution (who said/wrote it). Shown quietly beneath the quote. */
  source?: string;
  /** Why it moved me. Revealed on demand under a "why it moved me" toggle. */
  reflection?: ReactNode;
  /** Optional work/context the quote is from (a book, talk, proverb origin). */
  cite?: string;
  /** Optional motivational video that talks through the quote. A plain external link (new tab). */
  video?: string;
  className?: string;
  style?: CSSProperties;
}

/** Back-compat alias: <Quote> was the original component name. */
export type QuoteProps = EditorialQuoteProps;

const EditorialQuote: React.FC<EditorialQuoteProps> = ({
  children,
  source,
  reflection,
  cite,
  video,
  className,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    // NOTE: the root className is `styles.quote` (NOT renamed to match the component). <Focus>'s
    // highlight sweep is driven by the selector `.quote:hover .focus`, so the class must stay
    // `.quote` even though the component is now EditorialQuote.
    <figure className={clsx(styles.quote, className)} style={style}>
      <blockquote className={styles.text}>{children}</blockquote>
      {(source || cite) && (
        <figcaption className={styles.attribution}>
          {source && <span className={styles.source}>{source}</span>}
          {cite && <span className={styles.cite}>{cite}</span>}
        </figcaption>
      )}
      {video && (
        <a
          className={styles.videoLink}
          href={video}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Watch the related video (opens in a new tab)">
          <span aria-hidden="true">&#9654;</span> watch
        </a>
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

export default EditorialQuote;
