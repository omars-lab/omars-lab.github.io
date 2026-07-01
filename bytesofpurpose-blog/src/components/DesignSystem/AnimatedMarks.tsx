import React, {useEffect, useState} from 'react';
import SplitFlap from '@site/src/components/SplitFlap';
import styles from './styles.module.css';

/**
 * AnimatedMarks — the logo mockups that were ALIVE in the design project, rebuilt on the REPO's
 * real Vestaboard split-flap:
 *  - SplitFlapMark: the green cathedral arch housing the real <SplitFlap> (the homepage-hero
 *    component: top leaf folds down, bottom leaf flips up, hinged at the middle) rolling
 *    B → 0 → 1 → blank. This is the CHOSEN direction and the site's adopted logo.
 *  - BitCursor: a mono bit inside the arch flashing 1 → 0 → empty.
 *  - BlinkCaret: a blinking terminal caret.
 * All motion respects prefers-reduced-motion (discipline rule 6): SplitFlap has its own built-in
 * reduced-motion cross-fade, and the JS glyph timers early-return when reduced motion is on.
 */

/** Local mirror of the repo's useReducedMotion (index.tsx) — reactive, SSR-safe. */
export function useReducedMotion(): boolean {
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

/**
 * Advance a glyph through `frames`, ONE flip every `intervalMs` (default 15s), looping forever.
 * Pauses on reduced motion (holds the first frame). Also returns a `kick` that advances one flip
 * immediately (used on hover).
 */
function useGlyphCycle(
  frames: string[],
  {intervalMs = 15000}: {intervalMs?: number} = {},
): [string, () => void] {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % frames.length), intervalMs);
    return () => clearInterval(id);
  }, [reduce, intervalMs, frames.length]);

  // Advance one flip now (hover).
  const kick = () => {
    if (reduce) return;
    setI((n) => (n + 1) % frames.length);
  };

  return [frames[reduce ? 0 : i], kick];
}

// The logo's flap sequence: B -> 0 -> P -> 1 -> (loop). "BoP" + the bits of a byte.
const BYTE_FRAMES = ['B', '0', 'P', '1'];

export interface SplitFlapMarkProps {
  /** hairline-arch variant (vs the solid green arch). */
  outline?: boolean;
  /** kept for API compatibility; the flap now flips every 15s in all placements. */
  cadence?: 'continuous' | 'occasional';
  /** flap tile size (CSS font-size on the board). Default sized for a specimen tile. */
  size?: string;
  /** compact navbar arch (tight padding + smaller corner) so the mark fits the header line. */
  compact?: boolean;
}

/**
 * The site logo: the green arch as the flap's housing, the REAL split-flap that ROLLS THROUGH the
 * deck (like a Vestaboard, letters flipping by) to reach each target, cycling B → 0 → P → 1 → (loop),
 * one roll every 15 seconds. `outline` renders the hairline-arch variant; `compact` the tight navbar arch.
 */
export function SplitFlapMark({
  outline = false,
  size = '40px',
  compact = false,
}: SplitFlapMarkProps): React.JSX.Element {
  // One roll every 15s, cycling B → 0 → P → 1. NO `direct`: the flap rolls THROUGH the deck (the
  // letters-flipping-by Vestaboard effect). settleMs caps the whole roll at ~1.6s so it lands and
  // then rests on the glyph until the next beat. Auto-timed only; hovering does nothing.
  const [glyph] = useGlyphCycle(BYTE_FRAMES, {intervalMs: 15000});
  const archClass = `${outline ? styles.archFlapOutline : styles.archFlap} ${
    compact ? styles.archFlapNavbar : ''
  }`;
  return (
    <span
      className={archClass}
      role="img"
      aria-label="Arch housing a Vestaboard flap rolling through letters to B, 0, P, 1">
      {/* SplitFlap tiles are em-sized, so font-size on this wrapper scales the flap. */}
      <span style={{fontSize: size, display: 'inline-flex'}}>
        <SplitFlap text={glyph} settleMs={1600} />
      </span>
    </span>
  );
}

/** The arch with a mono bit flashing 1 → 0 → empty. `outline` renders the hairline variant. */
export function BitCursor({outline = false}: {outline?: boolean}): React.JSX.Element {
  const [bit] = useGlyphCycle(['1', '0', ' '], {intervalMs: 800});
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

/**
 * ArchStatic — a NON-animated arch + a resting "B" flap tile. Used as the SSR / no-JS / reduced-
 * motion fallback for the navbar logo, so the header never looks broken before hydration. Sized to
 * the navbar via the `size` font-size.
 */
export function ArchStatic({size = '14px'}: {size?: string}): React.JSX.Element {
  return (
    <span
      className={`${styles.archFlap} ${styles.archFlapNavbar}`}
      aria-hidden="true"
      style={{fontSize: size}}>
      <span className={styles.staticFlap}>B</span>
    </span>
  );
}

/**
 * ArchFlapLogo — the site's adopted logo: the green arch housing the real Vestaboard flap. In the
 * navbar it uses the 'occasional' cadence (rests on B, rolls a quiet B→0→1→blank burst every ~7s or
 * on hover); the design-system page uses it 'continuous'. Navbar-sized by default.
 */
export function ArchFlapLogo({
  size = '14px',
  cadence = 'occasional',
}: {
  size?: string;
  cadence?: 'continuous' | 'occasional';
}): React.JSX.Element {
  return <SplitFlapMark cadence={cadence} size={size} compact />;
}
