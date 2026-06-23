import React, {CSSProperties, ReactNode} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * Mockup — a framed, theme-aware wrapper that turns live HTML/CSS into a UI mockup.
 *
 * A co-design's prose + diagrams say HOW a system works; a Mockup shows what it would
 * LOOK like. The "screen" is real HTML (the children), so it adapts to light/dark, scales
 * responsively, and stays version-controlled — no screenshots, no external embeds. The
 * chrome (a browser bar, a desktop window, or a phone shell) frames it so a reader
 * instantly reads it as "this is a UI", not page content.
 *
 * Usage in MDX:
 *
 *   <Mockup chrome="browser" title="Review Studio" url="review.studio/doc/hld">
 *     <div style={{display:'flex'}}>
 *       <nav>…sidebar…</nav>
 *       <main>…document + comment pins…</main>
 *     </div>
 *   </Mockup>
 *
 * Keep the inner HTML simple and SEMANTIC — a few divs/buttons with light inline styles or
 * the provided .screen helpers. It is an impression of the UI, not a pixel-perfect build.
 */

export type MockupChrome = 'browser' | 'window' | 'phone' | 'none';

export interface MockupProps {
  children: ReactNode;
  /** Frame style. 'browser' = address bar; 'window' = traffic-light dots; 'phone' = device shell; 'none' = bare framed screen. */
  chrome?: MockupChrome;
  /** Title shown in the window/browser bar (and used as the figure's accessible label). */
  title?: string;
  /** Fake URL shown in the browser address bar (chrome="browser" only). */
  url?: string;
  /** Optional caption rendered under the frame. */
  caption?: ReactNode;
  /** Max width of the frame (e.g. 420 for a phone, 920 for a desktop app). */
  maxWidth?: number | string;
  className?: string;
  style?: CSSProperties;
}

const Mockup: React.FC<MockupProps> = ({
  children,
  chrome = 'browser',
  title,
  url,
  caption,
  maxWidth,
  className,
  style,
}) => {
  const frameStyle: CSSProperties = {
    ...(maxWidth ? {maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth} : {}),
    ...style,
  };

  return (
    <figure
      className={clsx(styles.mockup, styles[`chrome_${chrome}`], className)}
      style={frameStyle}
      aria-label={title ? `Mockup: ${title}` : 'UI mockup'}>
      <div className={styles.frame}>
        {chrome === 'browser' && (
          <div className={styles.bar}>
            <span className={styles.dots} aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className={styles.address}>{url || title || ''}</span>
          </div>
        )}
        {chrome === 'window' && (
          <div className={styles.bar}>
            <span className={styles.dots} aria-hidden="true">
              <i /><i /><i />
            </span>
            {title && <span className={styles.winTitle}>{title}</span>}
          </div>
        )}
        {chrome === 'phone' && <span className={styles.notch} aria-hidden="true" />}
        <div className={styles.screen}>{children}</div>
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
};

export default Mockup;
