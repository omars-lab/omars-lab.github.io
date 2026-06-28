import React, {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * SplitFlap: a Vestaboard-style split-flap text display. Renders a string as a row of per-
 * character flap cells; when the `text` prop changes, each cell mechanically flips (the top leaf
 * folds down, the bottom leaf flips up, hinged at the middle) from its old character to the new
 * one, rippling left-to-right like an airport departure board updating.
 *
 * Accessibility: the full current text is exposed as an aria-label on the row (and the flaps are
 * aria-hidden), so a screen reader reads the word, not a pile of single letters. prefers-reduced-
 * motion users get a plain cross-fade per cell instead of the mechanical flip (no spinning).
 *
 * Timing: `flipMs` is the per-cell flip duration; `stagger` is the L-to-R delay between cells. The
 * caller syncs the flip with other effects (e.g. a flash) by knowing the flip starts on the `text`
 * change and each cell's midpoint (the char swap) is at flipMs/2 after its own start.
 */
export interface SplitFlapProps {
  text: string;
  /** TOTAL roll time per cell (ms): every cell's whole roll takes this long, so all cells ARRIVE
   * at their target glyph together (a cell with more deck steps flips faster per step). */
  settleMs?: number;
  /** Fixed column count: the text is centered and the rest of the row is BLANK FILLER tiles (like
   * a real Vestaboard, whose grid is always full). Omit for a tight, text-width row. */
  columns?: number;
  /** Fixed row count: the grid is ALWAYS this many rows (blank filler rows pad short text), so the
   * board's size never changes between messages. Requires `columns`. */
  rows?: number;
  className?: string;
  /** DRIVEN mode: when set, the flip is controlled EXTERNALLY by `progress` (0..1) flipping from
   * `fromText` to `text`, instead of self-running on timers. Stop changing `progress` (e.g. stop
   * scrolling) and the board FREEZES mid-flip. Requires `fromText`. Used by the scroll-driven hero. */
  progress?: number;
  /** The text the board is flipping FROM in driven mode (the settled previous message). */
  fromText?: string;
}

// A DRIVEN cell: shows the flip from `from`→`to` frozen at an external `progress` (0..1). At p<0.5 the
// top leaf (old glyph) folds down (rotateX 0→-90); at p≥0.5 the bottom leaf (new glyph) folds up
// (rotateX 90→0). No timers — the parent's progress fully determines the frame, so it freezes on stop.
function DrivenCell({from, to, progress}: {from: string; to: string; progress: number}) {
  const p = Math.min(1, Math.max(0, progress));
  const flipping = from !== to && p > 0 && p < 1;
  // settled glyph at the ends; mid-flip we split the rotation across the two leaves at the p=0.5 hinge
  const settled = p < 0.5 ? from : to;
  const topAngle = p < 0.5 ? -90 * (p / 0.5) : -90; // old top leaf folding down through the first half
  const botAngle = p < 0.5 ? 90 : 90 * (1 - (p - 0.5) / 0.5); // new bottom leaf rising in the second half
  return (
    <span className={styles.cell} aria-hidden="true">
      {/* static halves show the settled glyph at rest; during a flip the leaves below cover them */}
      <span className={clsx(styles.leaf, styles.leafTop)}>
        <span className={styles.glyph}>{p < 0.5 ? from : to}</span>
      </span>
      <span className={clsx(styles.leaf, styles.leafBottom)}>
        <span className={styles.glyph}>{settled}</span>
      </span>
      {flipping && (
        <>
          <span
            className={clsx(styles.leaf, styles.leafTop)}
            style={{transform: `rotateX(${topAngle}deg)`, transition: 'none'}}>
            <span className={styles.glyph}>{from}</span>
          </span>
          <span
            className={clsx(styles.leaf, styles.leafBottom)}
            style={{transform: `rotateX(${botAngle}deg)`, transition: 'none'}}>
            <span className={styles.glyph}>{to}</span>
          </span>
        </>
      )}
    </span>
  );
}

/** Center `text` within `columns`, padding both sides with spaces so the row is always full. */
function centerInColumns(text: string, columns: number): string {
  const t = text.length > columns ? text.slice(0, columns) : text;
  const total = columns - t.length;
  const left = Math.floor(total / 2);
  return ' '.repeat(left) + t + ' '.repeat(total - left);
}

/** Word-wrap `text` into lines of at most `columns` chars (like a real board), then center+pad each
 * line so every row is exactly `columns` wide (blank filler tiles fill the rest). A word longer than
 * a row is hard-split. Returns the grid as an array of equal-length strings. */
function wrapToGrid(text: string, columns: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (let w of words) {
    while (w.length > columns) {
      // Hard-split an over-long word across rows.
      if (line) {
        lines.push(line);
        line = '';
      }
      lines.push(w.slice(0, columns));
      w = w.slice(columns);
    }
    if (!line) line = w;
    else if (line.length + 1 + w.length <= columns) line += ' ' + w;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  if (lines.length === 0) lines.push('');
  return lines.map((l) => centerInColumns(l, columns));
}

// The flap DECK: the ordered set of glyphs on a physical split-flap drum. A cell rolls THROUGH this
// sequence (blank → A..Z → 0..9 → punctuation) one flap at a time until it lands on the target, the
// way a real departure board does. A char not in the deck is treated as a single direct flip.
const DECK = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:&-/\'';
const DECK_INDEX = new Map(Array.from(DECK).map((c, i) => [c, i]));

// One cell: rolls from its current glyph THROUGH the deck to the target glyph, one flap per step.
// `settleMs` is the TOTAL time this cell's whole roll should take; the per-step speed is derived
// from it so EVERY cell finishes at the same moment (a cell with more steps flips faster).
function Cell({
  char,
  settleMs,
}: {
  char: string;
  settleMs: number;
}) {
  const [shown, setShown] = useState(char); // the settled glyph currently displayed
  const [next, setNext] = useState(char); // the glyph this step is flipping TO
  const [flipping, setFlipping] = useState(false);
  const [stepMs, setStepMs] = useState(120);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (char === shown) return undefined;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    const from = DECK_INDEX.get(shown);
    const to = DECK_INDEX.get(char);
    let seq: string[];
    if (from === undefined || to === undefined) {
      seq = [char];
    } else {
      seq = [];
      for (let i = from; i !== to; i = (i + 1) % DECK.length) {
        seq.push(DECK[(i + 1) % DECK.length]);
      }
    }

    // Per-step duration = total settle time / number of steps, so all cells ARRIVE TOGETHER. Clamp
    // so a long roll doesn't blur into nothing and a 1-step flip isn't sluggish.
    const perStep = Math.min(150, Math.max(34, Math.round(settleMs / seq.length)));
    setStepMs(perStep);

    const run = (k: number) => {
      if (k >= seq.length) return;
      const target = seq[k];
      setNext(target);
      setFlipping(true);
      const mid = window.setTimeout(() => setShown(target), perStep / 2);
      const end = window.setTimeout(() => {
        setFlipping(false);
        run(k + 1);
      }, perStep);
      timers.current.push(mid, end);
    };
    run(0);

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  const style = {
    '--flip-ms': `${stepMs}ms`,
  } as React.CSSProperties;

  // The split-flap layers (back to front):
  //  - static TOP half shows the NEW char's top (revealed once the folding top leaf clears it)
  //  - static BOTTOM half shows the OLD char's bottom (until the folding bottom leaf covers it)
  //  - folding TOP leaf (OLD char top) rotates DOWN to the hinge in the first half
  //  - folding BOTTOM leaf (NEW char bottom) rotates UP from the hinge in the second half
  // When not flipping, both static halves show the settled char.
  const topStatic = flipping ? next : shown;
  const bottomStatic = shown;
  return (
    <span className={styles.cell} style={style} aria-hidden="true">
      <span className={clsx(styles.leaf, styles.leafTop)}>
        <span className={styles.glyph}>{topStatic}</span>
      </span>
      <span className={clsx(styles.leaf, styles.leafBottom)}>
        <span className={styles.glyph}>{bottomStatic}</span>
      </span>
      {/* The moving leaves (only rendered/animated during a flip). */}
      {flipping && (
        <>
          {/* Top leaf folding DOWN: shows the OLD char's top half rotating away. */}
          <span className={clsx(styles.leaf, styles.leafTop, styles.foldDown)}>
            <span className={styles.glyph}>{shown}</span>
          </span>
          {/* Bottom leaf flipping UP: shows the NEW char's bottom half rotating in. */}
          <span className={clsx(styles.leaf, styles.leafBottom, styles.foldUp)}>
            <span className={styles.glyph}>{next}</span>
          </span>
        </>
      )}
    </span>
  );
}

export default function SplitFlap({
  text,
  settleMs = 750,
  columns,
  rows: fixedRows,
  className,
  progress,
  fromText,
}: SplitFlapProps): React.JSX.Element {
  // Build the centered/padded GRID for a message (same layout for both the timer + driven paths).
  const toGrid = (s: string): string[] => {
    const upper = s.toUpperCase();
    let g = columns ? wrapToGrid(upper, columns) : [upper];
    if (columns && fixedRows) {
      if (g.length > fixedRows) g = g.slice(0, fixedRows);
      const blank = ' '.repeat(columns);
      const pad = fixedRows - g.length;
      const top = Math.floor(pad / 2);
      g = [...Array(top).fill(blank), ...g, ...Array(pad - top).fill(blank)];
    }
    return g;
  };

  const grid = toGrid(text);

  // DRIVEN mode: the flip is controlled by `progress` (0..1) from `fromText` → `text`. Each cell is a
  // DrivenCell frozen at that progress, so stopping the progress (e.g. stop scrolling) freezes the
  // board mid-flip. (No timers.)
  if (progress != null && fromText != null) {
    const fromGrid = toGrid(fromText);
    return (
      <span className={clsx(styles.board, className)} role="text" aria-label={text}>
        {grid.map((row, r) => (
          <span key={r} className={styles.row}>
            {Array.from(row).map((c, i) => (
              <DrivenCell key={i} from={fromGrid[r]?.[i] ?? ' '} to={c} progress={progress} />
            ))}
          </span>
        ))}
      </span>
    );
  }

  // TIMER mode (default): each Cell self-rolls through the deck on a `text` change.
  return (
    <span className={clsx(styles.board, className)} role="text" aria-label={text}>
      {grid.map((row, r) => (
        <span key={r} className={styles.row}>
          {Array.from(row).map((c, i) => (
            <Cell key={i} char={c} settleMs={settleMs} />
          ))}
        </span>
      ))}
    </span>
  );
}
