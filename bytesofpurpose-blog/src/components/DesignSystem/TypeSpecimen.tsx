import React from 'react';
import styles from './styles.module.css';

/**
 * TypeSpecimen — a live type specimen for the /handbook/design-system/typography page.
 * Renders a sample line with the given family/size/weight/tracking tokens applied, and a
 * caption listing the tokens used, so the reader sees the real rendered face AND the recipe.
 *
 *   <TypeSpecimen family="--font-serif-display" size="--text-h1" weight="--weight-semibold"
 *     tracking="--tracking-heading" sample="Purposeful code, one byte at a time." />
 *
 * `italic` renders the sample italic (the brand's serif subtitle). `sizeLabel` overrides the
 * caption's size text (e.g. "16px / 1.7" for the body specimen).
 */
export interface TypeSpecimenProps {
  family: string;
  size: string;
  weight?: string;
  tracking?: string;
  leading?: string;
  italic?: boolean;
  sample: string;
  sizeLabel?: string;
}

export default function TypeSpecimen({
  family,
  size,
  weight = '--weight-regular',
  tracking = '--tracking-normal',
  leading = '--leading-heading',
  italic = false,
  sample,
  sizeLabel,
}: TypeSpecimenProps): React.JSX.Element {
  const familyName = family.includes('serif')
    ? 'Fraunces'
    : family.includes('mono')
    ? 'Geist Mono'
    : 'Geist';
  return (
    <div className={styles.typeSpecimen}>
      <p
        className={styles.typeSample}
        style={{
          fontFamily: `var(${family})`,
          fontSize: `var(${size})`,
          fontWeight: `var(${weight})` as React.CSSProperties['fontWeight'],
          letterSpacing: `var(${tracking})`,
          lineHeight: `var(${leading})`,
          fontStyle: italic ? 'italic' : 'normal',
        }}>
        {sample}
      </p>
      <div className={styles.typeCaption}>
        <span>{familyName}</span>
        <span>
          size <b>{sizeLabel ?? size}</b>
        </span>
        <span>
          weight <b>{weight}</b>
        </span>
        <span>
          tracking <b>{tracking}</b>
        </span>
      </div>
    </div>
  );
}
