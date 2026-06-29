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
  /** SPINNING mode: while true, every cell continuously CHURNS through random glyphs (like a
   * departure board mid-update). When it flips to false, the cells SETTLE to `text` (roll to rest on
   * the final letters). Used by the scroll-driven hero: spinning = the user is scrolling; settle =
   * they stopped. (When undefined, the board behaves normally: it rolls on a `text` change.) */
  spinning?: boolean;
}

// A SPINNING cell: while `spinning`, it CHURNS through random deck glyphs on its own fast timer (each
// cell at a slightly different rate so the board looks alive); when `spinning` turns false it SETTLES
// to its target `char`. It delegates the fold animation to <Cell> by driving Cell's `char`.
//
// Stray-letter fix: a cell whose target is BLANK (' ') must NEVER show a leftover letter after settle.
// While spinning we ALWAYS churn (even blank-target cells, so the whole board churns uniformly); on
// settle we land on `char` — and a SETTLE TO BLANK snaps directly (no deck-roll that could strand on a
// letter). The settle also keys a remount so the underlying Cell can't be left mid-roll from churn.
const SPIN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // churn through letters only (looks like a board working)

function SpinningCell({char, spinning, seed}: {char: string; spinning: boolean; seed: number}) {
  const [display, setDisplay] = useState(char);
  const idxRef = useRef(seed % SPIN_LETTERS.length);

  useEffect(() => {
    if (spinning) {
      // churn EVERY cell (blank-target ones too) so the board churns uniformly and no cell is stuck.
      const stride = 1 + (seed % 5);
      const periodMs = 60 + (seed % 7) * 12; // 60..132ms per flip, varied per cell
      const id = window.setInterval(() => {
        idxRef.current = (idxRef.current + stride) % SPIN_LETTERS.length;
        setDisplay(SPIN_LETTERS[idxRef.current]);
      }, periodMs);
      return () => window.clearInterval(id);
    }
    // SETTLE: land on the target character.
    setDisplay(char);
    return undefined;
  }, [spinning, char, seed]);

  // A BLANK target snaps directly (no roll) so it can never strand on a letter; a letter target rolls.
  // Keying the Cell on whether it's settled-blank forces a fresh Cell (clears any mid-roll) when we
  // settle to blank, so a churning random letter can't be left behind in a padding cell.
  const settledBlank = !spinning && char === ' ';
  return (
    <Cell
      key={settledBlank ? 'blank' : 'glyph'}
      char={settledBlank ? ' ' : display}
      settleMs={500}
    />
  );
}

/** Pad `text` to `columns` with a SPECIFIC left offset, so callers can give every row the SAME offset
 * (stable per-cell slots across messages → only changed cells flip). Right-fills to full width. */
function padInColumns(text: string, columns: number, left: number): string {
  const t = text.length > columns ? text.slice(0, columns) : text;
  const lp = Math.max(0, Math.min(columns - t.length, left));
  return ' '.repeat(lp) + t + ' '.repeat(columns - t.length - lp);
}

/** A FIXED left indent every message starts at, so a shared prefix (DISCOVER MY ... / EXPLORE THE
 * ...) lands in the SAME slots no matter how long each message is. This is what makes only the
 * CHANGED cells flip across a transition (a real departure board left-justifies at a fixed margin;
 * it does NOT re-center per message, which would shift every cell when the line length changes). */
const BOARD_LEFT_INDENT = 1;

/** Word-wrap `text` into lines of at most `columns` chars (like a real board), then LEFT-justify each
 * line at the fixed board indent and pad so every row is exactly `columns` wide (blank filler tiles
 * fill the rest). A word longer than a row is hard-split. Returns the grid as equal-length strings. */
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
  // STABLE ALIGNMENT: left-justify EVERY message at the SAME fixed indent (NOT centered per message).
  // Centering shifts with the message's length, so "DISCOVER MY CRAFT" and "DISCOVER MY JOURNEY" would
  // land their shared "DISCOVER MY " prefix in DIFFERENT slots (off by the length delta), making the
  // whole board flip. A fixed indent keeps shared-prefix cells in the SAME slots across a transition,
  // so only the cells that genuinely CHANGE flip, like a real departure board.
  return lines.map((l) => padInColumns(l, columns, BOARD_LEFT_INDENT));
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

    // Per-step duration = total settle time / number of steps, so all cells ARRIVE TOGETHER. Clamp so
    // a 1-step flip isn't sluggish; the low floor (20ms) lets a long roll still finish within settleMs
    // (a ~24-step roll at 20ms ≈ 480ms), so settleMs is a real cap on the TOTAL settle time.
    const perStep = Math.min(150, Math.max(20, Math.round(settleMs / seq.length)));
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
  spinning,
}: SplitFlapProps): React.JSX.Element {
  // Build the centered/padded GRID for a message.
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

  // SPINNING mode: while `spinning` the board CHURNS random letters; when it stops it SETTLES to `text`.
  // (Used by the scroll-driven hero: spinning = scrolling, settle = stopped.) A stable per-cell seed
  // keeps each cell's churn pace consistent across renders.
  if (spinning != null) {
    let seed = 0;
    return (
      <span className={clsx(styles.board, className)} role="text" aria-label={text}>
        {grid.map((row, r) => (
          <span key={r} className={styles.row}>
            {Array.from(row).map((c, i) => (
              <SpinningCell key={i} char={c} spinning={spinning} seed={(seed = seed + 7 + i * 3)} />
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
