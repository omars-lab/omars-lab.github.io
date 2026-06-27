import React from 'react';
import {isLocalhost} from '@site/src/experiments';
import type {DebugSection} from './types';
import {experimentsSection} from './sections/ExperimentsSection';
import {linksSection} from './sections/LinksSection';
import {heroTunerSection} from './sections/HeroTuner';
import styles from './styles.module.css';

// Floating, localhost-only DEBUG MENU. A general-purpose developer panel whose
// content is a list of pluggable sections; it STARTS with Experiments, and new
// debug sections drop into the `SECTIONS` array below without touching the
// container. See ./types.ts (DebugSection) and ./sections/.
//
// HARD GATE: renders only on localhost AND in a non-production build, so the
// component (and its markup/strings) never reaches the deployed gh-pages bundle.
// isLocalhost() is the same gate src/experiments.ts uses for the URL override.

// Section registry; append here to add a debug section.
const SECTIONS: DebugSection[] = [heroTunerSection, experimentsSection, linksSection];

function DebugMenuInner(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  // iOS-Settings-style 2-level nav: null = the section LIST; an id = drilled INTO that section.
  const [selected, setSelected] = React.useState<string | null>(null);

  // Escape: from a detail view go BACK to the list; from the list close the panel.
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setSelected((s) => {
        if (s) return null; // back to the list
        setOpen(false); // already at the list → close
        return null;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Reset to the list each time the panel opens.
  const toggleOpen = () =>
    setOpen((o) => {
      if (!o) setSelected(null);
      return !o;
    });

  const current = selected ? SECTIONS.find((s) => s.id === selected) : null;

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-label={open ? 'Close debug menu' : 'Open debug menu'}
        onClick={toggleOpen}>
        <span aria-hidden="true">🐞</span> Debug
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Debug menu">
          <div className={styles.header}>
            {current ? (
              <button
                type="button"
                className={styles.back}
                aria-label="Back to debug menu"
                onClick={() => setSelected(null)}>
                <span aria-hidden="true">‹</span> Debug
              </button>
            ) : (
              <h2 className={styles.title}>Debug menu</h2>
            )}
            <button
              type="button"
              className={styles.close}
              aria-label="Close debug menu"
              onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          {current ? (
            // DETAIL view: the selected section's title + its controls.
            <section className={styles.detail} aria-label={current.title}>
              <h3 className={styles.detailTitle}>{current.title}</h3>
              <div className={styles.sectionBody}>{current.render()}</div>
            </section>
          ) : (
            // LIST view: one tappable row per section (iOS Settings style).
            <ul className={styles.list}>
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    className={styles.row}
                    onClick={() => setSelected(section.id)}>
                    <span>{section.title}</span>
                    <span className={styles.chevron} aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

export default function DebugMenu(): React.JSX.Element | null {
  // Double gate: dev build only (build-time, tree-shakeable) AND localhost
  // (runtime). Either being false → render nothing.
  if (process.env.NODE_ENV === 'production') return null;
  if (!isLocalhost()) return null;
  return <DebugMenuInner />;
}
