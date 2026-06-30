import React, {CSSProperties, ReactNode} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * PosterQuote — render text as a TYPOGRAPHIC POSTER: a stack of beats, each a small quiet line
 * paired with a giant display line. It is a general, reusable "mix and match small lines with
 * big lines" construct — NOT tied to any one quote. Use it whenever you want the poster look:
 * a manifesto, a principle, a cascade, a single punchy line, a definition.
 *
 *   <PosterQuote source="Lao Tzu (attributed)">
 *     <Beat lead="Watch your" big="THOUGHTS" />
 *     <Beat lead="they become your" big="WORDS" />
 *     <Beat lead="it becomes your" big="DESTINY" />
 *   </PosterQuote>
 *
 *   <PosterQuote>
 *     <Beat big="SHIP" lead="every day" />
 *   </PosterQuote>
 *
 * Each beat is a <Beat lead=... big=.../>; either part is optional, so you can mix a lone big
 * line, a small-then-big pairing, or several stacked beats freely. PosterQuote owns the layout
 * (it reads its <Beat> children, ignores stray MDX whitespace, and renders the stack) so the
 * staggered highlight sweep and reduced-motion live in one place. Optional `source`/`cite`
 * render quietly beneath, and `video` is the same "watch" external link as on <EditorialQuote>.
 */

export interface BeatProps {
  /** The giant display line, e.g. "THOUGHTS". The hero of the beat. Optional. */
  big?: string;
  /** A small quiet line paired with the big line (above it by default). Optional. */
  lead?: string;
  /** Put the small `lead` line BELOW the big line instead of above it (a caption, not a setup). */
  leadBelow?: boolean;
  className?: string;
}

/**
 * Beat — one unit of a <PosterQuote>: a small `lead` line and/or a giant `big` line. It is a
 * MARKER that PosterQuote reads and lays out; rendered on its own it still emits a readable beat
 * so it is never invisible. Either `lead` or `big` may be omitted to mix small-only / big-only /
 * paired beats.
 */
export const Beat: React.FC<BeatProps> = ({big, lead, leadBelow, className}) => {
  const small = lead ? <span className={styles.beatLead}>{lead}</span> : null;
  const large = big ? <span className={styles.beatBig}>{big}</span> : null;
  return (
    <div className={clsx(styles.beat, className)}>
      {!leadBelow && small}
      {large}
      {leadBelow && small}
    </div>
  );
};

export interface PosterQuoteProps {
  /** The beats — one or more <Beat> elements. */
  children: ReactNode;
  /** Optional attribution (who said/wrote it). Shown quietly beneath the poster. */
  source?: string;
  /** Optional work/context the text is from (a book, talk, proverb origin). */
  cite?: string;
  /** Optional related video. A plain external "watch" link (new tab), not an embed. */
  video?: string;
  className?: string;
  style?: CSSProperties;
}

const PosterQuote: React.FC<PosterQuoteProps> = ({
  children,
  source,
  cite,
  video,
  className,
  style,
}) => {
  // MDX wraps children in arrays and interleaves whitespace text nodes; keep only real <Beat>
  // elements so a blank-line-separated authoring style does not inject stray beats. (Same
  // child-introspection lesson the <Question> component already encodes.)
  const beats = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<BeatProps> =>
      React.isValidElement(child) && child.type === Beat,
  );

  return (
    <figure className={clsx(styles.poster, className)} style={style}>
      {beats.map((beat, i) => (
        <Beat key={i} {...beat.props} />
      ))}
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
    </figure>
  );
};

export default PosterQuote;
