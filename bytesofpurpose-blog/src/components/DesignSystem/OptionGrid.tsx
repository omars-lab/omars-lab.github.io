import React from 'react';
import styles from './styles.module.css';

/**
 * OptionGrid / OptionTile — the "show every option we explored, highlight the one we chose"
 * pattern for the design-system pages. Brand decisions were made by comparing directions side by
 * side (ten display serifs, twenty-one logo directions); these pages keep that exploration visible
 * instead of showing only the final pick, so a reader sees WHAT was considered and WHICH won.
 *
 *   <OptionGrid>
 *     <OptionTile name="Fraunces" chosen note="Warm, crafted, a little wry.">
 *       <span style={{fontFamily: 'var(--font-serif-display)'}}>Where faith meets craft</span>
 *     </OptionTile>
 *     <OptionTile name="Newsreader" note="Literary, quiet, screen-tuned.">...</OptionTile>
 *   </OptionGrid>
 *
 * A `chosen` tile gets a green ring and a "✦ Chosen" badge. Pair the grid with <DecisionNote>
 * to say WHY the chosen option won.
 */
export function OptionGrid({
  children,
  columns,
}: {
  children: React.ReactNode;
  /** Min column width in px (grid is auto-fill minmax(columns, 1fr)). Default 200. */
  columns?: number;
}): React.JSX.Element {
  const style = columns
    ? ({['--ds-option-min']: `${columns}px`} as React.CSSProperties)
    : undefined;
  return (
    <div className={styles.optionGrid} style={style}>
      {children}
    </div>
  );
}

export interface OptionTileProps {
  /** The option's name (e.g. "Fraunces", "Binary Pyramid"). */
  name: string;
  /** A one-line note: for a chosen tile, why it won; otherwise what the direction is. */
  note?: string;
  /** Mark this as the chosen direction (green ring + ✦ Chosen badge). */
  chosen?: boolean;
  /** The live specimen / mini-mockup to show in the tile's stage. */
  children: React.ReactNode;
}

export function OptionTile({
  name,
  note,
  chosen = false,
  children,
}: OptionTileProps): React.JSX.Element {
  return (
    <div className={`${styles.optionTile} ${chosen ? styles.optionChosen : ''}`}>
      {chosen && <span className={styles.chosenBadge}>✦ Chosen</span>}
      <div className={styles.optionStage}>{children}</div>
      <div className={styles.optionName}>{name}</div>
      {note && <div className={styles.optionNote}>{note}</div>}
    </div>
  );
}

/**
 * DecisionNote — a small callout stating the decision we made and WHY, so the design system
 * records not just the tokens but the reasoning. Use it right after an <OptionGrid>.
 *
 *   <DecisionNote choice="Fraunces">
 *     It carries the personal, editorial voice the brand wants ...
 *   </DecisionNote>
 */
export function DecisionNote({
  choice,
  children,
}: {
  /** The chosen option's name, shown in the note's heading. */
  choice: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <aside className={styles.decisionNote}>
      <div className={styles.decisionHead}>
        <span className={styles.decisionMark}>✦</span> Our choice: <strong>{choice}</strong>
      </div>
      <div className={styles.decisionBody}>{children}</div>
    </aside>
  );
}
