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
 * Drive a glyph through `frames`. `cadence`:
 *  - 'continuous' — cycle every `intervalMs` (the design-system page).
 *  - 'occasional' — rest on the first frame, then run ONE full cycle every `restMs`, so a mark seen
 *    on every page (the navbar) is alive but not perpetually moving.
 * Both pause on reduced motion (hold the first frame).
 */
function useGlyphCycle(
  frames: string[],
  {intervalMs = 1400, cadence = 'continuous', restMs = 7000}: {intervalMs?: number; cadence?: 'continuous' | 'occasional'; restMs?: number} = {},
): [string, () => void] {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    if (cadence === 'continuous') {
      const id = setInterval(() => setI((n) => (n + 1) % frames.length), intervalMs);
      return () => clearInterval(id);
    }
    // occasional: run a burst of `frames.length` steps, then rest until the next beat.
    let step = 0;
    let inner: ReturnType<typeof setInterval> | null = null;
    const runBurst = () => {
      step = 0;
      inner = setInterval(() => {
        step += 1;
        setI((n) => (n + 1) % frames.length);
        if (step >= frames.length && inner) {
          clearInterval(inner);
          inner = null;
        }
      }, intervalMs);
    };
    const outer = setInterval(runBurst, restMs);
    return () => {
      clearInterval(outer);
      if (inner) clearInterval(inner);
    };
  }, [reduce, intervalMs, cadence, restMs, frames.length]);

  // A manual trigger (used on hover): roll one full cycle now.
  const kick = () => {
    if (reduce) return;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      setI((n) => (n + 1) % frames.length);
      if (step >= frames.length) clearInterval(id);
    }, intervalMs);
  };

  return [frames[reduce ? 0 : i], kick];
}

const BYTE_FRAMES = ['B', '0', '1', ' '];

export interface SplitFlapMarkProps {
  /** hairline-arch variant (vs the solid green arch). */
  outline?: boolean;
  /** 'continuous' rolls forever; 'occasional' rests on B and rolls a burst every ~7s / on hover. */
  cadence?: 'continuous' | 'occasional';
  /** flap tile size (CSS font-size on the board). Default sized for a specimen tile. */
  size?: string;
}

/**
 * The chosen mark / site logo: the green arch as the flap's housing, the REAL split-flap rolling
 * B → 0 → 1 → blank. `outline` renders the hairline-arch variant; `cadence` tunes how often it rolls.
 */
export function SplitFlapMark({
  outline = false,
  cadence = 'continuous',
  size = '40px',
}: SplitFlapMarkProps): React.JSX.Element {
  // Continuous: keep rolling (a lively specimen). Occasional (navbar): hold "B" for a long rest,
  // then a crisp 4-flip burst. `settleMs` (the deck-roll time per change) is kept BELOW the interval
  // so each flip fully settles before the next, and the mark visibly RESTS on B between bursts.
  const [glyph, kick] = useGlyphCycle(
    BYTE_FRAMES,
    cadence === 'occasional'
      ? {cadence, intervalMs: 900, restMs: 9000}
      : {cadence, intervalMs: 1600},
  );
  const settleMs = cadence === 'occasional' ? 650 : 1200;
  return (
    <span
      className={outline ? styles.archFlapOutline : styles.archFlap}
      role="img"
      aria-label="Arch housing a Vestaboard flap rolling B, 0, 1, blank"
      onMouseEnter={cadence === 'occasional' ? kick : undefined}>
      {/* SplitFlap tiles are em-sized, so font-size on this wrapper scales the flap. */}
      <span style={{fontSize: size, display: 'inline-flex'}}>
        <SplitFlap text={glyph} settleMs={settleMs} />
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
export function ArchStatic({size = '22px'}: {size?: string}): React.JSX.Element {
  return (
    <span className={styles.archFlap} aria-hidden="true" style={{fontSize: size}}>
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
  size = '22px',
  cadence = 'occasional',
}: {
  size?: string;
  cadence?: 'continuous' | 'occasional';
}): React.JSX.Element {
  return <SplitFlapMark cadence={cadence} size={size} />;
}
