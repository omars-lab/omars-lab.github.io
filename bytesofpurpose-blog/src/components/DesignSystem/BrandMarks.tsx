import React from 'react';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

/**
 * BrandMarks / FeatureIcons / ArchIllustrations — specimen grids for the
 * /handbook/design-system/logos page. All assets are the repo's OWN static/img files
 * (no new assets), rendered exactly as the site uses them:
 *  - logos are theme-aware (light/dark SVG swap) via <ThemedImage>,
 *  - feature icons are tinted brand-green via a CSS mask (matching the homepage),
 *  - illustrations are clipped to the cathedral-arch silhouette (discipline rule 8).
 */

interface Mark {
  light: string;
  dark: string;
  label: string;
  note: string;
}

const MARKS: Mark[] = [
  {
    light: '/img/logo.svg',
    dark: '/img/logo_dark.svg',
    label: 'Lightbulb </>',
    note: 'Primary mark: a bulb with a code glyph. Inherits currentColor.',
  },
  {
    light: '/img/logo-binary.svg',
    dark: '/img/logo-binary_dark.svg',
    label: 'Binary pyramid',
    note: 'Secondary / favicon mark: 1·0 digits radiating from a pillar.',
  },
];

export function BrandMarks(): React.JSX.Element {
  return (
    <div className={styles.markGrid}>
      {MARKS.map((m) => (
        <div className={styles.markTile} key={m.label}>
          <div className={styles.markStage}>
            <ThemedImage
              alt={m.label}
              sources={{light: useBaseUrl(m.light), dark: useBaseUrl(m.dark)}}
            />
          </div>
          <div className={styles.markLabel}>{m.label}</div>
          <div className={styles.markNote}>{m.note}</div>
        </div>
      ))}
    </div>
  );
}

const ICONS: Array<{src: string; label: string}> = [
  {src: '/img/posts.svg', label: 'posts'},
  {src: '/img/artifacts.svg', label: 'artifacts'},
  {src: '/img/engine.svg', label: 'engine'},
  {src: '/img/support.svg', label: 'support'},
];

export function FeatureIcons(): React.JSX.Element {
  return (
    <div className={styles.markGrid}>
      {ICONS.map((icon) => {
        const url = useBaseUrl(icon.src);
        return (
          <div className={styles.markTile} key={icon.label}>
            <div className={styles.markStage}>
              <span
                className={styles.iconMark}
                style={{
                  WebkitMaskImage: `url(${url})`,
                  maskImage: `url(${url})`,
                }}
                role="img"
                aria-label={icon.label}
              />
            </div>
            <div className={styles.markLabel}>{icon.label}</div>
          </div>
        );
      })}
    </div>
  );
}

const ILLUSTRATIONS: Array<{src: string; label: string}> = [
  {src: '/img/cards/craft.png', label: 'Craft'},
  {src: '/img/cards/self.png', label: 'Journey'},
  {src: '/img/cards/mindset.png', label: 'Mindset'},
  {src: '/img/cards/questions.png', label: 'Questions'},
  {src: '/img/cards/initiatives.png', label: 'Initiatives'},
  {src: '/img/cards/designs.png', label: 'Designs'},
  {src: '/img/cards/thinking.png', label: 'Thinking'},
  {src: '/img/cards/door.png', label: 'Door'},
  {src: '/img/cards/window.png', label: 'Window'},
];

export function ArchIllustrations(): React.JSX.Element {
  return (
    <div className={styles.markGrid}>
      {ILLUSTRATIONS.map((art) => (
        <div className={styles.markTile} key={art.label}>
          <div className={styles.archFrame}>
            <img src={useBaseUrl(art.src)} alt={`${art.label} arch illustration`} />
          </div>
          <div className={styles.markLabel}>{art.label}</div>
        </div>
      ))}
    </div>
  );
}
