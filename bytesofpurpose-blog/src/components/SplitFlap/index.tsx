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
}: SplitFlapProps): React.JSX.Element {
  // Real split-flap boards are UPPERCASE (the flaps only carry caps). With `columns`, the text
  // word-wraps into a centered, blank-filler-padded GRID (a real Vestaboard); without it, a single
  // tight text-width row.
  const upper = text.toUpperCase();
  let grid = columns ? wrapToGrid(upper, columns) : [upper];
  // Fixed row count: pad with blank filler rows so the board's height never changes between
  // messages. The title is vertically CENTERED (a blank row above + below); with an odd amount of
  // padding the extra row falls to the bottom. Truncate if the text wrapped past the fixed height.
  if (columns && fixedRows) {
    if (grid.length > fixedRows) grid = grid.slice(0, fixedRows);
    const blank = ' '.repeat(columns);
    const pad = fixedRows - grid.length;
    const top = Math.floor(pad / 2); // centered; odd remainder goes to the bottom
    grid = [
      ...Array(top).fill(blank),
      ...grid,
      ...Array(pad - top).fill(blank),
    ];
  }
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
