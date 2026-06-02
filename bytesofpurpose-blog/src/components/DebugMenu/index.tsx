import React from 'react';
import {isLocalhost} from '@site/src/experiments';
import type {DebugSection} from './types';
import {experimentsSection} from './sections/ExperimentsSection';
import {linksSection} from './sections/LinksSection';
import styles from './styles.module.css';

// Floating, localhost-only DEBUG MENU. A general-purpose developer panel whose
// content is a list of pluggable sections — it STARTS with Experiments, and new
// debug sections drop into the `SECTIONS` array below without touching the
// container. See ./types.ts (DebugSection) and ./sections/.
//
// HARD GATE: renders only on localhost AND in a non-production build, so the
// component (and its markup/strings) never reaches the deployed gh-pages bundle.
// isLocalhost() is the same gate src/experiments.ts uses for the URL override.

// Section registry — append here to add a debug section.
const SECTIONS: DebugSection[] = [experimentsSection, linksSection];

function DebugMenuInner(): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  // Escape closes the panel.
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggleSection = (id: string) =>
    setCollapsed((c) => ({...c, [id]: !c[id]}));

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-label={open ? 'Close debug menu' : 'Open debug menu'}
        onClick={() => setOpen((o) => !o)}>
        <span aria-hidden="true">🐞</span> Debug
      </button>

      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label="Debug menu">
          <div className={styles.header}>
            <h2 className={styles.title}>Debug menu</h2>
            <button
              type="button"
              className={styles.close}
              aria-label="Close debug menu"
              onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          {SECTIONS.map((section) => {
            const isCollapsed = !!collapsed[section.id];
            return (
              <section key={section.id} className={styles.section}>
                <button
                  type="button"
                  className={styles.sectionHeader}
                  aria-expanded={!isCollapsed}
                  onClick={() => toggleSection(section.id)}>
                  <span aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>{' '}
                  {section.title}
                </button>
                {!isCollapsed && (
                  <div className={styles.sectionBody}>{section.render()}</div>
                )}
              </section>
            );
          })}
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
