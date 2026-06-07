import React, {useMemo} from 'react';
import {generateLogoSvg} from '@site/src/lib/binary-pyramid-logo';

/**
 * BinaryPyramid — render the binary-pyramid logo CLIENT-SIDE from a config.
 *
 * This is the on-demand counterpart to the pre-generated gallery data: it calls the
 * shared generator (src/lib/binary-pyramid-logo.js, the single source of truth) at
 * render time, so a page can drop in a parameterized / one-off mark without going
 * through the build-time data file. For a fixed gallery of many variants, prefer the
 * pre-generated VARIANTS (cheaper) ; for a single or interactive mark, use this.
 *
 * The SVG is produced as a string and injected inline. With fill="currentColor"
 * (default) it inherits the surrounding text color, so it is theme-aware.
 */
export type BinaryPyramidProps = {
  /** Generator config (see src/lib/binary-pyramid-logo.js header). */
  config?: Record<string, unknown>;
  /** Base fill color; 'currentColor' (default) makes it theme-aware. */
  fill?: string;
  /** Optional CSS width/height for the wrapper (e.g. '100%', 64). */
  width?: string | number;
  height?: string | number;
  className?: string;
  title?: string;
};

export default function BinaryPyramid({
  config = {},
  fill = 'currentColor',
  width,
  height,
  className,
  title,
}: BinaryPyramidProps): JSX.Element {
  // Memoize so we only re-run the generator when inputs change.
  const svg = useMemo(
    () => generateLogoSvg(config, fill),
    [JSON.stringify(config), fill],
  );
  return (
    <span
      className={className}
      role="img"
      aria-label={title || 'Binary pyramid logo'}
      style={{display: 'inline-flex', width, height, lineHeight: 0}}
      // SVG is generated from author-supplied config at render time (not user input).
      dangerouslySetInnerHTML={{__html: svg}}
    />
  );
}
