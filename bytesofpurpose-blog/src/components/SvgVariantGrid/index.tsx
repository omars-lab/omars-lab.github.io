import React, {useMemo, useState} from 'react';
import {generateLogoSvg} from '@site/src/lib/binary-pyramid-logo';
import styles from './styles.module.css';

/**
 * SvgVariantGrid — a reusable grid for comparing SVG design variants in a post.
 *
 * Built for design-exploration posts (logos, diagrams, UI marks): it renders each
 * variant as INLINE svg (crisp at any zoom, theme-aware via `currentColor`), with
 * an optional row of fixed-pixel-height previews so a reader can judge legibility
 * at real sizes (e.g. a 32px navbar), and a gallery-level light/dark toggle (the
 * SVGs inherit `color`, so one source renders in both themes).
 *
 * Each variant: { id, label, svg, config? }. `svg` is a raw SVG string whose
 * shapes use fill/stroke="currentColor" so the toggle re-colors them.
 */
export type SvgVariant = {
  id: string;
  label: string;
  svg: string;        // raw <svg>…</svg> using currentColor
  config?: string;    // optional caption (e.g. the generator config)
  group?: string;     // optional section key for filtering
};

export type SvgVariantGridProps = {
  variants: SvgVariant[];
  /** If set, only render variants whose `group` matches. */
  group?: string;
  /** Fixed pixel heights to also render each variant at, for legibility checks. */
  previewHeights?: number[];
  /** Show the light/dark background toggle (default true). */
  darkToggle?: boolean;
  /** Minimum card width in px (controls columns); default 280. */
  minCardWidth?: number;
  /**
   * When true, render a full-height colonnade BEHIND the cards: the cards sit in a
   * horizontal band across the middle and the pillars protrude above and below.
   * The backdrop is generated client-side from the shared generator.
   */
  pillarBackdrop?: boolean;
};

export default function SvgVariantGrid({
  variants,
  group,
  previewHeights = [],
  darkToggle = true,
  minCardWidth = 280,
  pillarBackdrop = false,
}: SvgVariantGridProps): JSX.Element {
  const [dark, setDark] = useState(false);
  const shown = group ? variants.filter((v) => v.group === group) : variants;

  // A wide colonnade backdrop (client-side generated, currentColor so it tints to
  // the section's accent and works in light/dark).
  const backdropSvg = useMemo(() => {
    if (!pillarBackdrop) return '';
    // Tall, slender columns (high centerCount, tight colGap) so the colonnade fills
    // the band's height WITHOUT distortion. Aspect ratio is preserved.
    const raw = generateLogoSvg(
      {pillar: 'ionic', ring: 'oval', colMode: 'arch', volute: 'spiral',
       flat: true, noZeros: true, rings: 9, centerCount: 13, colGap: 16},
      'currentColor',
    );
    // 'slice' = cover the band (fill height, crop sides) with NO distortion.
    return raw.replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ');
  }, [pillarBackdrop]);

  return (
    <div
      className={`${styles.wrap} ${dark ? styles.dark : ''} ${pillarBackdrop ? styles.colonnade : ''}`}>
      {pillarBackdrop && (
        <div
          className={styles.backdrop}
          aria-hidden="true"
          dangerouslySetInnerHTML={{__html: backdropSvg}}
        />
      )}
      {darkToggle && (
        <div className={styles.bar}>
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setDark((d) => !d)}
            aria-pressed={dark}>
            {dark ? '☀ Light background' : '🌙 Dark background'}
          </button>
          {previewHeights.length > 0 && (
            <span className={styles.hint}>
              each card also shown at {previewHeights.map((h) => `${h}px`).join(' / ')}
            </span>
          )}
        </div>
      )}

      <div
        className={styles.grid}
        style={{gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`}}>
        {shown.map((v) => (
          <figure key={v.id} className={styles.card}>
            <div
              className={styles.big}
              // SVG strings are author-supplied at build time (not user input).
              dangerouslySetInnerHTML={{__html: v.svg}}
            />
            <figcaption className={styles.cap}>
              <strong>{v.label}</strong>
              {v.config && <code className={styles.cfg}>{v.config}</code>}
            </figcaption>
            {previewHeights.length > 0 && (
              <div className={styles.previews}>
                {previewHeights.map((h) => (
                  <span
                    key={h}
                    className={styles.preview}
                    title={`${h}px tall`}
                    style={{height: h}}
                    dangerouslySetInnerHTML={{__html: v.svg}}
                  />
                ))}
                <span className={styles.previewTag}>
                  {previewHeights.map((h) => `${h}px`).join(' · ')}
                </span>
              </div>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
