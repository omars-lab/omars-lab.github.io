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
  /** SWEEP mode (the pickets board — pass BOTH sweep props): the board is SCRUBBED by scroll, exactly
   * like the door. `sweepProgress` p∈[0,1] positions a flip FRONT across the board: cells LEFT of the
   * front already show `text` (the destination), cells RIGHT of it still show `sweepFromText` (where
   * you came from), and only the cell the front is crossing flips. A pure function of p: stopping
   * mid-crossing FREEZES the half-new/half-old board, scrolling back makes the letters revert, and at
   * any instant only the column the scroll is impacting animates (no whole-board churn or cascade). */
  sweepFromText?: string;
  sweepProgress?: number;
  /** ANCHOR WIDTH: center every message as if the longest possible message were this many chars wide,
   * so EVERY message occupies the SAME fixed columns regardless of its own length. Without this, each
   * title is centered on its own width, so changing between two different-length titles SHIFTS the
   * shared letters sideways (they slide into a new centered position) instead of flipping in place.
   * Pass the width of the widest message the board will ever show (e.g. the longest scene title) and
   * every scene change becomes a pure per-column card-flip with no horizontal slide. */
  anchorWidth?: number;
  /** DIRECT mode (timer mode only): each cell flips STRAIGHT to the target glyph in a single fold,
   * instead of rolling through the deck. Off by default (the hero keeps the deck roll). */
  direct?: boolean;
}

// A SPINNING cell: while `spinning`, it CHURNS through random deck glyphs on its own fast timer (each
// cell at a slightly different rate so the board looks alive); when `spinning` turns false it SETTLES
// to its target `char`. It delegates the fold animation to <Cell> by driving Cell's `char`.
//
// BLANK-target cells stay BLANK while spinning (they do NOT churn). The board's fixed grid pads short
// text to `rows` with BLANK rows top + bottom, so a churning title occupies only its own row(s); if the
// padding cells churned too, all rows would fill with letters and then visibly COLLAPSE (3 rows→1) the
// instant you stop. Keeping blank-target cells blank throughout means the board churns only where the
// text lives and there is no collapse to animate. A blank target also SNAPS on settle (never rolls).
const SPIN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // churn through letters only (looks like a board working)

function SpinningCell({
  char,
  spinning,
  seed,
}: {
  char: string;
  spinning: boolean;
  seed: number;
}) {
  const [display, setDisplay] = useState(char);
  const idxRef = useRef(seed % SPIN_LETTERS.length);
  // Per-cell churn cadence, derived purely from the seed so the render below can size the fold to it.
  const periodMs = 90 + (seed % 7) * 15; // 90..180ms per flip, varied per cell

  useEffect(() => {
    // Blank-target cells never churn: they stay blank so the padding rows don't fill (no 3-rows→1
    // collapse on settle). Only cells whose target is a real glyph churn.
    if (spinning && char !== ' ') {
      const stride = 1 + (seed % 5);
      const id = window.setInterval(() => {
        idxRef.current = (idxRef.current + stride) % SPIN_LETTERS.length;
        setDisplay(SPIN_LETTERS[idxRef.current]);
      }, periodMs);
      return () => window.clearInterval(id);
    }
    // SETTLE (or a blank cell while spinning): land on the target character.
    setDisplay(char);
    return undefined;
  }, [spinning, char, seed, periodMs]);

  // While SPINNING, one churning Cell (key 'spin'). On SETTLE we ALWAYS mount a FRESH Cell already AT
  // `char` (an instant SNAP) so a mid-churn fold can never carry over and strand the two faces one
  // glyph apart. The spinning models (pin/inplace/horizontal) settle the board MANY times per journey
  // while scrolling, so a roll each time would stutter; the snap is the safe choice. (The pickets board
  // does not spin at all any more — it uses the scroll-scrubbed SWEEP mode; see SplitFlap.)
  if (spinning) {
    // CHURN ticks flip DIRECT (one fold straight to the random glyph), and the fold is sized to
    // FINISH just inside this cell's own tick period. Both matter for scroll perf (trace-proven):
    // without `direct` every tick starts a multi-step DECK ROLL toward a random target (dozens of
    // timer + state updates per second per cell), and a fold longer than the tick never completes,
    // leaving every cell stuck mid-flip with its glyph text mutating inside the moving leaves. That
    // combination was the main-thread storm that made scrolling hitch for whole gestures.
    return <Cell key="spin" char={display} settleMs={Math.max(40, periodMs - 20)} direct />;
  }
  return <Cell key={`settled:${char}`} char={char} settleMs={500} />;
}

/** Pad `text` to `columns` with a SPECIFIC left offset, so callers can give every row the SAME offset
 * (stable per-cell slots across messages → only changed cells flip). Right-fills to full width. */
function padInColumns(text: string, columns: number, left: number): string {
  const t = text.length > columns ? text.slice(0, columns) : text;
  const lp = Math.max(0, Math.min(columns - t.length, left));
  return ' '.repeat(lp) + t + ' '.repeat(columns - t.length - lp);
}

/** Word-wrap `text` into lines of at most `columns` chars (like a real board). A word longer than a
 * row is hard-split. Returns the raw (unpadded) lines. */
function wrapLines(text: string, columns: number): string[] {
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
  return lines;
}

/** Word-wrap `text` into lines of at most `columns` chars (like a real board), then CENTER each line
 * within the board and pad so every row is exactly `columns` wide (blank filler tiles fill the rest).
 * Returns the grid as equal-length strings. By default each message is centered on its OWN width. Pass
 * `anchorWidth` (the widest message the board will ever show) to center every line as if it were that
 * wide instead — so a short and a long message START at the SAME left column and shared letters flip in
 * place across a message change rather than sliding sideways. */
function wrapToGrid(text: string, columns: number, anchorWidth?: number): string[] {
  const lines = wrapLines(text, columns);
  return lines.map((l) => {
    const basis = Math.min(columns, Math.max(l.length, anchorWidth ?? l.length));
    const left = Math.floor((columns - basis) / 2);
    return padInColumns(l, columns, left);
  });
}

/** SWEEP-mode grids: lay TWO texts on the SAME column grid so a column-wise splice between them is
 * coherent (the pickets board shows the destination left of the flip front + the from-text to its
 * right). Both are single-line and padded to the fixed row count, so column i is the same slot in both.
 * The centering basis is `anchorWidth` when given (the widest message across the WHOLE journey), which
 * is what makes every crossing agree on one offset — otherwise centering on this pair's own max width
 * makes a scene's letters JUMP between adjacent crossings (its offset differs by pair). Returns
 * `[toGrid, fromGrid]`. If either text wraps to more than one line (longer than `columns`), falls back
 * to per-text `toGrid` centering (multi-line sweep is not used by the hero; scene titles are single-line). */
function toSharedGrid(
  toText: string,
  fromText: string,
  columns: number,
  fixedRows: number | undefined,
  anchorWidth?: number,
): [string[], string[]] {
  const a = toText.toUpperCase();
  const b = fromText.toUpperCase();
  const pad = (g: string[]): string[] => {
    if (!fixedRows) return g;
    const blank = ' '.repeat(columns);
    const top = Math.floor((fixedRows - g.length) / 2);
    return [...Array(top).fill(blank), ...g, ...Array(fixedRows - g.length - top).fill(blank)];
  };
  // Multi-line (a title wider than the board) has no single shared offset — fall back per-text.
  if (a.length > columns || b.length > columns) {
    return [pad(wrapToGrid(a, columns, anchorWidth)), pad(wrapToGrid(b, columns, anchorWidth))];
  }
  // Center BOTH on the journey-wide anchor width (falls back to this pair's max if no anchor given), so
  // column i is the same slot in every crossing and shared letters never slide between crossings.
  const basis = Math.min(columns, Math.max(a.length, b.length, anchorWidth ?? 0));
  const left = Math.floor((columns - basis) / 2);
  return [pad([padInColumns(a, columns, left)]), pad([padInColumns(b, columns, left)])];
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
  direct = false,
}: {
  char: string;
  settleMs: number;
  /** When true, flip STRAIGHT to the target in one fold (no rolling through the deck). */
  direct?: boolean;
}) {
  const [shown, setShown] = useState(char); // the settled glyph currently displayed
  const [next, setNext] = useState(char); // the glyph this step is flipping TO
  const [flipping, setFlipping] = useState(false);
  const [stepMs, setStepMs] = useState(120);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (char === shown) {
      // Retargeted BACK to the glyph already shown while a flip was in flight (e.g. the sweep front
      // retreating on a scroll-back): the effect cleanup has cancelled the flip's timers, so ALSO
      // cancel the visual flip state, else the cell strands mid-fold (flipping=true forever, both
      // leaves up). No-ops when the cell was already at rest.
      setFlipping(false);
      setNext(char);
      return undefined;
    }
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    const from = DECK_INDEX.get(shown);
    const to = DECK_INDEX.get(char);
    let seq: string[];
    if (direct || from === undefined || to === undefined) {
      // Single DIRECT flip: fold once from the old glyph straight to the new one.
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

function SplitFlap({
  text,
  settleMs = 750,
  columns,
  rows: fixedRows,
  className,
  spinning,
  sweepFromText,
  sweepProgress,
  anchorWidth,
  direct = false,
}: SplitFlapProps): React.JSX.Element {
  // Build the centered/padded GRID for a message. `anchorWidth` (when set) centers every message on one
  // fixed width so changing messages flips letters in place instead of sliding them to a new center.
  const toGrid = (s: string): string[] => {
    const upper = s.toUpperCase();
    let g = columns ? wrapToGrid(upper, columns, anchorWidth) : [upper];
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

  // SWEEP mode (the pickets board): the board is a PURE FUNCTION of `sweepProgress`, scrubbed by the
  // scroll like the door. A flip FRONT moves left→right across the LIT SPAN of the board (the union of
  // where the from-text and to-text have letters, row-major): cells the front has passed show the
  // DESTINATION glyph, cells ahead of it still show the FROM glyph, and the only animation at any
  // instant is the single fold of the cell the front is crossing (Cell flips when its char changes).
  // Stop mid-crossing → the mixed board FREEZES; scroll back → the letters revert, column by column.
  if (sweepProgress != null && sweepFromText != null) {
    // BOTH texts must sit on the SAME column grid, or the mid-sweep column splice (destination on the
    // left of the front, from-text on the right) is INCOHERENT: `toGrid` centers each text on its own
    // width, so two titles of different length land in different columns and the splice drops the
    // inter-word space ("EXPLORE MY" → "EXPLOREMY") or doubles a boundary letter. `toSharedGrid`
    // centers both on the LONGER title's width, so column i means the same slot in both and the swept
    // line reads as one continuous title with its spaces intact.
    const [grid, fromGrid] = toSharedGrid(text, sweepFromText, columns, fixedRows, anchorWidth);
    const p = Math.min(1, Math.max(0, sweepProgress));
    // Each row's lit span (union across from+to); the front walks these spans row-major.
    const spans = grid.map((row, r) => {
      const both = Array.from(row).map((c, i) => (c !== ' ' ? c : (fromGrid[r]?.[i] ?? ' ')));
      const s = both.findIndex((c) => c !== ' ');
      const e = s < 0 ? -1 : both.length - 1 - [...both].reverse().findIndex((c) => c !== ' ');
      return s < 0 ? null : {start: s, end: e};
    });
    const total = spans.reduce((n, sp) => n + (sp ? sp.end - sp.start + 1 : 0), 0);
    const frontIdx = Math.round(p * total); // cells with ordinal < frontIdx show the destination
    let ordinal = 0;
    return (
      <span className={clsx(styles.board, className)} role="text" aria-label={text}>
        {grid.map((row, r) => {
          const sp = spans[r];
          return (
            <span key={r} className={styles.row}>
              {Array.from(row).map((c, i) => {
                const inSpan = sp != null && i >= sp.start && i <= sp.end;
                const passed = inSpan && ordinal++ < frontIdx;
                const shown = inSpan ? (passed ? c : (fromGrid[r]?.[i] ?? ' ')) : ' ';
                return <Cell key={i} char={shown} settleMs={220} direct />;
              })}
            </span>
          );
        })}
      </span>
    );
  }

  // SPINNING mode: while `spinning` the board CHURNS random letters; when it stops it SETTLES to `text`.
  // (Used by the scroll-driven hero pin models: spinning = mid-crossing scroll, settle = snap.) A stable
  // per-cell seed keeps each cell's churn pace consistent across renders.
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
            <Cell key={i} char={c} settleMs={settleMs} direct={direct} />
          ))}
        </span>
      ))}
    </span>
  );
}

// MEMOIZED: the board is the facade's most expensive child (up to 72 cells × leaves). Its props change
// only per-scene / per-scroll-state (text / spinning / settle knobs), NOT on every smoothed-progress
// frame, so React.memo skips reconciling the whole board when only the picket wave changed — a big cut
// to the pickets scroll cost. (Its own internal churn/settle timers keep animating regardless.)
export default React.memo(SplitFlap);
