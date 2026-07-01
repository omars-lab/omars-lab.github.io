import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';

/**
 * AnimatedMarks — the logo mockups that were ALIVE in the design project, rebuilt faithfully:
 *  - SplitFlapMark: the green cathedral arch housing a real Vestaboard flap that mechanically rolls
 *    B → 0 → 1 → blank (the CHOSEN direction). The fold leaf is CSS; the glyph cycling is JS.
 *  - BitCursor: a mono bit inside the arch flashing 1 → 0 → empty.
 *  - BlinkCaret: a blinking terminal caret.
 * All motion respects prefers-reduced-motion (discipline rule 6): the JS timers early-return when
 * reduced motion is on (pinning the first frame), and the CSS fold/blink self-guard in the module.
 */

/** Local mirror of the repo's useReducedMotion (index.tsx) — reactive, SSR-safe. */
function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduce;
}

/** Cycle through `frames` every `intervalMs`, pausing on reduced motion (holds the first frame). */
function useCycle(frames: string[], intervalMs: number): string {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % frames.length), intervalMs);
    return () => clearInterval(id);
  }, [reduce, intervalMs, frames.length]);
  return frames[reduce ? 0 : i];
}

/** One physical flap tile (dark housing, folding leaf) showing `glyph`. */
function Flap({glyph}: {glyph: string}): React.JSX.Element {
  return (
    <span className={`${styles.flap} ${styles.flapSolo}`}>
      <span className={styles.flapGlyph}>{glyph}</span>
      <span className={styles.flapFold} aria-hidden="true" />
    </span>
  );
}

/**
 * The chosen mark: the green arch as the flap's housing, the flap rolling B → 0 → 1 → blank.
 * `outline` renders the hairline-arch variant.
 */
export function SplitFlapMark({outline = false}: {outline?: boolean}): React.JSX.Element {
  const glyph = useCycle(['B', '0', '1', ' '], 1400);
  return (
    <span
      className={outline ? styles.archFlapOutline : styles.archFlap}
      role="img"
      aria-label="Arch housing a Vestaboard flap rolling B, 0, 1, blank">
      <Flap glyph={glyph} />
    </span>
  );
}

/** The arch with a mono bit flashing 1 → 0 → empty. `outline` renders the hairline variant. */
export function BitCursor({outline = false}: {outline?: boolean}): React.JSX.Element {
  const bit = useCycle(['1', '0', ' '], 800);
  return (
    <span
      className={outline ? styles.archFlapOutline : styles.archFlap}
      role="img"
      aria-label="Arch with a bit cursor flashing one, zero, empty">
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
          fontSize: '1.9rem',
          color: outline ? 'var(--ifm-color-primary)' : '#f4f1ea',
          lineHeight: 1,
        }}>
        {bit}
      </span>
    </span>
  );
}

/** A blinking terminal caret (used inline in the terminal marks). */
export function BlinkCaret(): React.JSX.Element {
  return (
    <span className={styles.caret} aria-hidden="true">
      _
    </span>
  );
}
