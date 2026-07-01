import React from 'react';
import styles from './styles.module.css';

/**
 * ColorSwatch — one color chip specimen for the /handbook/design-system/colors page.
 * The chip is filled with `background: var(--token)` so it renders the LIVE theme color
 * (light or dark, automatically), never a hardcoded value. The hex shown is a human-readable
 * caption only, matching the design project's guideline cards.
 *
 *   <ColorSwatch token="--ifm-color-primary" name="Primary · text" hex="#3C7256" />
 *
 * Set `ink` to render the color as TEXT on paper (for ink/secondary tokens, where a solid
 * fill would misrepresent how the color is actually used).
 */
export interface ColorSwatchProps {
  /** The CSS custom property to fill the chip with, e.g. "--brand-green". */
  token: string;
  /** Human-readable name of the swatch. */
  name: string;
  /** The light-mode hex (or value) shown as a caption. Optional for alias tokens. */
  hex?: string;
  /** A short usage note (e.g. the accent-fill-only discipline). */
  note?: string;
  /** Render the color as ink (text on paper) instead of a solid fill. */
  ink?: boolean;
}

export default function ColorSwatch({
  token,
  name,
  hex,
  note,
  ink = false,
}: ColorSwatchProps): React.JSX.Element {
  return (
    <div className={styles.swatch}>
      {ink ? (
        <div
          className={`${styles.swatchChip} ${styles.inkChip}`}
          style={{color: `var(${token})`}}
          aria-hidden="true">
          Aa
        </div>
      ) : (
        <div className={styles.swatchChip}>
          <div className={styles.swatchChipFill} style={{background: `var(${token})`}} />
        </div>
      )}
      <div className={styles.swatchMeta}>
        <div className={styles.swatchName}>{name}</div>
        {hex && <div className={styles.swatchHex}>{hex}</div>}
        <div className={styles.swatchToken}>{token}</div>
        {note && <div className={styles.swatchNote}>{note}</div>}
      </div>
    </div>
  );
}

/** ColorRow — responsive grid wrapper for a set of <ColorSwatch> chips. */
export function ColorRow({children}: {children: React.ReactNode}): React.JSX.Element {
  return <div className={styles.colorRow}>{children}</div>;
}
