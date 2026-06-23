import React, {CSSProperties, ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Gif — a captioned, theme-aware, accessible figure for an animated GIF (or short looping
 * video clip). A static screenshot shows a moment; a Gif shows the motion, a real recorded
 * terminal session, a screen capture, a synthesized walkthrough, without the scripting a live
 * <Walkthrough> needs.
 *
 * Why a component and not a bare <img src="*.gif">:
 *   - GIFs autoplay and CANNOT be paused natively, which fails prefers-reduced-motion and
 *     gives the reader no control. This shows a static POSTER frame by default for reduced-
 *     motion users, and gives everyone a play/pause toggle (it swaps the animated source for
 *     the poster to "pause", since a GIF can't truly pause).
 *   - It lazy-loads, frames the media to match <Mockup>, and captions it consistently.
 *
 * Usage in MDX:
 *
 *   <Gif src={require('./demo.gif').default} poster={require('./demo-poster.png').default}
 *        alt="Claude Code running the stock-analyzer agent" frame="terminal"
 *        caption={<><b>A real session.</b> Claude launches the agent and pauses at a shortlist.</>} />
 *
 * `poster` is optional but recommended: it is what reduced-motion users see, and the "paused"
 * state. Without it, reduced-motion users still see the (animated) gif but with a hint to play.
 */

export type GifFrame = 'terminal' | 'browser' | 'window' | 'none';

export interface GifProps {
  /** The animated GIF (or video) source URL. */
  src: string;
  /** Required alt text describing what the animation shows. */
  alt: string;
  /** A static image (first/representative frame) shown for reduced-motion + the paused state. */
  poster?: string;
  /** Frame chrome around the media. 'terminal' = dark bar titled "terminal"; matches <Mockup>. */
  frame?: GifFrame;
  /** Title shown in the terminal/window bar. */
  title?: string;
  /** Caption under the frame. */
  caption?: ReactNode;
  /** Max width of the figure. */
  maxWidth?: number | string;
  /** Start playing immediately (ignored under prefers-reduced-motion, which starts paused). */
  autoPlay?: boolean;
  className?: string;
  style?: CSSProperties;
}

const Gif: React.FC<GifProps> = ({
  src,
  alt,
  poster,
  frame = 'none',
  title,
  caption,
  maxWidth,
  autoPlay = true,
  className,
  style,
}) => {
  // Start paused for reduced-motion users (and only flip to playing after mount, so SSR is
  // deterministic). If there's no poster we can't show a still, so reduced-motion falls back
  // to the animated gif but starts in the "paused"-labelled state where possible.
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (autoPlay && !reduce) setPlaying(true);
  }, [autoPlay]);

  // "Pause" a gif by swapping to the poster (a gif can't be paused in place). If there's no
  // poster, leave the gif animating but reflect intent in the toggle label.
  const showAnimated = playing || !poster;
  const mediaSrc = showAnimated ? src : (poster as string);

  const barTitle = title || (frame === 'terminal' ? 'terminal' : title);

  const frameStyle: CSSProperties = {
    ...(maxWidth ? {maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth} : {}),
    ...style,
  };

  return (
    <figure className={clsx(styles.gif, styles[`frame_${frame}`], className)} style={frameStyle}>
      <div className={styles.frame}>
        {(frame === 'terminal' || frame === 'window' || frame === 'browser') && (
          <div className={clsx(styles.bar, frame === 'terminal' && styles.barDark)}>
            <span className={styles.dots} aria-hidden="true">
              <i /><i /><i />
            </span>
            {barTitle && <span className={styles.barTitle}>{barTitle}</span>}
          </div>
        )}
        <div className={styles.media}>
          <img src={mediaSrc} alt={alt} loading="lazy" decoding="async" className={styles.img} />
          <button
            type="button"
            className={styles.toggle}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
            aria-pressed={playing}
            onClick={() => setPlaying((p) => !p)}>
            {playing ? '❚❚' : '▶'}
          </button>
        </div>
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
};

export default Gif;
