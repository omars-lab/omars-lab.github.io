import React, {useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './index.module.css';
import HomepageFeatures from '../components/HomepageFeatures';
import LatestPosts from '../components/LatestPosts';
import SplitFlap from '../components/SplitFlap';
import posthog from 'posthog-js';
import {EXPERIMENTS, resolveVariant, isLocalhost, type Experiment} from '../experiments';
import {applyHeroParams} from '../lib/hero-tuning';
import {HERO_SCENE_PARAM} from '../lib/url-params';

/* The hero chooser cards (folded in from the old /welcome page). To ADD a card, append an
   entry here and drop its arched PNG in static/img/cards/, and the film strip + the seamless loop
   pick it up automatically (the strip duplicates this list so it can cycle with no visible seam).
   Each is a top-level destination: Craft = what I build (the durable outward work); Journey = who
   I'm becoming (the inward journey); Thoughts = ideas I've had but not acted on yet; Mindset = the
   curated inputs that shape how I think; Initiatives = the acted-on, dated work; Questions = the
   sets of questions I ask myself; Designs = the system-design write-ups. */
const CHOOSER_CARDS: ReadonlyArray<{
  to: string;
  img: string;
  alt: string;
  title: string;
  body: string;
}> = [
  {
    to: '/craft',
    img: '/img/cards/craft.png',
    alt: 'Omar at his desk, headphones on, writing code',
    title: '💻 Discover My Craft',
    body: 'What I build, and share.',
  },
  {
    to: '/journey',
    img: '/img/cards/self.png',
    alt: 'Omar standing in prayer on a rug at home',
    title: '🛣️ Discover My Journey',
    body: "Who I'm becoming.",
  },
  {
    to: '/thoughts',
    img: '/img/cards/thinking.png',
    alt: 'Omar in thought, hand to his chin',
    title: '💭 Explore My Ideas',
    body: "Ideas I've had but not acted on yet.",
  },
  {
    to: '/mindset',
    img: '/img/cards/mindset.png',
    alt: 'Omar in a sculptor apron, chiseling a brain out of stone',
    title: '🧠 Explore My Mindset',
    body: 'See how I carve my thoughts.',
  },
  {
    to: '/initiatives',
    img: '/img/cards/initiatives.png',
    alt: 'Omar conducting an orchestra from the podium',
    title: "📝 Explore the Things I've Done",
    body: 'The dated things I actually did.',
  },
  {
    to: '/questions',
    img: '/img/cards/questions.png',
    alt: 'Omar interrogating himself across a table under a single lamp',
    title: '❓ Sit With My Questions',
    body: 'The questions I ask myself.',
  },
  {
    to: '/designs',
    img: '/img/cards/designs.png',
    alt: 'Omar at a drafting table, drawing a blueprint with a set square',
    title: '📐 Study My Designs',
    body: 'How I architected and shipped things.',
  },
];

/* One card = one flex child of the track. `duplicate` marks the seamless-loop copy: it's the
   SAME markup (so every track child is structurally identical and the gaps stay uniform, which is
   what makes the -50% reset seamless), just hidden from screen readers + keyboard tab order so
   each card is announced/focusable once. */
function ChooserCard({
  card,
  duplicate = false,
  variant = 'scroll',
  titleNode,
  hideBody = false,
}: {
  card: (typeof CHOOSER_CARDS)[number];
  duplicate?: boolean;
  /** The hero animation the user saw when they clicked: the A/B conversion dimension. */
  variant?: string;
  /** Render this in place of the static title (the flash variant passes the Vestaboard here, so it
   * lives INSIDE the card and moves with the card's hover-lift). */
  titleNode?: React.ReactNode;
  /** Hide the static body line (the flash variant puts the message on the board instead). */
  hideBody?: boolean;
}) {
  return (
    <Link
      className={styles.chooserCard}
      to={card.to}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      onClick={() => {
        // A/B conversion event for EXPERIMENTS['homepage-hero-anim']: which hero animation was on
        // screen, and which destination the visitor chose. Exposure ($feature_flag_called) is
        // recorded separately by getFeatureFlag in resolveVariant.
        posthog.capture('hero card clicked', {hero_variant: variant, destination: card.to});
      }}>
      <div className={styles.chooserCardImageWrap}>
        <img
          className={styles.chooserCardImage}
          src={useBaseUrl(card.img)}
          alt={duplicate ? '' : card.alt}
          loading="lazy"
          width={400}
          height={400}
        />
      </div>
      <div className={styles.chooserCardTitle}>{titleNode ?? card.title}</div>
      {!hideBody && <p className={styles.chooserCardBody}>{card.body}</p>}
    </Link>
  );
}

/* CONTROL hero: the seamless scrolling film strip. The cards auto-scroll sideways in an infinite
   loop. We render the card list TWICE inside the moving track; the keyframe translates the track by
   exactly half its width (one full set), so when it resets the second copy is pixel-aligned with
   where the first started: no visible seam. It pauses on hover/focus (so a card is clickable), and
   touch / prefers-reduced-motion users get a user-driven swipe reel instead (CSS turns the
   animation off). The duplicate set is aria-hidden so screen readers + keyboard see each card once. */
function ChooserStrip() {
  return (
    <div className={styles.chooserViewport}>
      <div className={styles.chooserTrack}>
        {CHOOSER_CARDS.map((card) => (
          <ChooserCard key={card.to} card={card} variant="scroll" />
        ))}
        {/* Seamless-loop duplicate: identical flex children, just a11y/keyboard-hidden. */}
        {CHOOSER_CARDS.map((card) => (
          <ChooserCard key={`dup-${card.to}`} card={card} duplicate variant="scroll" />
        ))}
      </div>
    </div>
  );
}

/* TEST hero: the camera-flash rotator. ONE card is shown at a time. Every few seconds a white
   flash blooms from the center of the arch, fills the card, and at peak-white the card content
   swaps to the next destination; the flash then fades to reveal the new "scene" (like a photo
   being taken and the subject changing). All cards stay in the DOM stacked on top of each other;
   only the active one is visible/opaque, so the active card is always a real, focusable link.
   prefers-reduced-motion users get a plain cross-fade with no flash (the CSS dials the flash out).
   The rotation pauses on hover/focus so the visible card is a stable target. */
// Timing choreography (per scene change). The Vestaboard title flip starts a beat BEFORE the
// flash, and the flash PEAK is timed to land on the flip's MIDPOINT (the char-swap), so the
// brightest moment masks the mechanical change. Then the light HOLDS, then recedes to reveal the
// settled new scene + title.
const FLASH_INTERVAL_MS = 12000; // time one card is shown before the next change fires
const FLASH_SETTLE_MS = 720; // TOTAL roll time per cell; all cells finish together at this mark
const FLASH_LEAD_MS = 120; // flip starts this long BEFORE the flash ramps
// The flash PEAK lands partway through the roll so the brightest moment masks the change; the swap
// of the arch image happens then too.
const FLASH_SWAP_MS = 320; // swap the scene image partway through the roll / at the flash peak
const FLASH_HOLD_MS = 2200; // how long the arch light LINGERS bright before receding (slow flash)
const FLASH_BOARD_COLS = 14; // Vestaboard columns per row. The board widens by adding blank FILLER
// tiles (more columns), NOT by stretching the housing, so the bezel border stays the same size.
const FLASH_BOARD_ROWS = 5; // ALWAYS this many rows: a blank row BEFORE + up to 3 title rows + a
// blank row AFTER. Fixed, so the board's size/position never changes.

/** Drop a leading emoji (+ its trailing space) from a card title, so the Vestaboard shows letters
 * only (real flaps carry no emoji). */
function stripEmoji(s: string): string {
  return s.replace(/^[^A-Za-z0-9]+/, '').trim();
}

function ChooserFlash() {
  const [active, setActive] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const [paused, setPaused] = useState(false);
  const stepTimers = useRef<number[]>([]);

  // ONE scene change: advance by `delta` (the auto-rotate uses +1; the arrows ±1), with the flash +
  // flip choreography. The flip starts first (advancing `active`, which the board reads), then the
  // light peaks over the swap, then holds and recedes.
  const step = useCallback((delta: number) => {
    stepTimers.current.forEach((t) => window.clearTimeout(t));
    stepTimers.current = [];
    setActive((i) => (i + delta + CHOOSER_CARDS.length) % CHOOSER_CARDS.length);
    stepTimers.current.push(window.setTimeout(() => setFlashing(true), FLASH_LEAD_MS));
    stepTimers.current.push(
      window.setTimeout(() => setFlashing(false), FLASH_LEAD_MS + FLASH_HOLD_MS),
    );
  }, []);

  // Auto-rotate (paused on hover/focus). It re-arms whenever `active` changes, so a manual arrow nav
  // (which changes `active`) resets the countdown instead of double-firing right after.
  useEffect(() => {
    if (paused) return undefined;
    const tick = window.setInterval(() => step(1), FLASH_INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, [paused, active, step]);

  useEffect(
    () => () => stepTimers.current.forEach((t) => window.clearTimeout(t)),
    [],
  );

  // ←/→ hop to the previous/next card. GLOBAL listener (on window), so the arrows work whenever the
  // hero is on screen — not only when the gate happens to be focused (which is why pressing keys
  // without first clicking/tabbing to the gate did nothing). Ignored while typing in an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  return (
    <Link
      className={styles.flashGate}
      to={CHOOSER_CARDS[active].to}
      aria-label={stripEmoji(CHOOSER_CARDS[active].title)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onClick={() =>
        posthog.capture('hero card clicked', {
          hero_variant: 'flash',
          destination: CHOOSER_CARDS[active].to,
        })
      }>
      {/* THE PORTAL: a fixed-size arch box. The card scenes cross-fade INSIDE it (the "scene"
          changing); the arch frame + flash light stay put. */}
      <div className={styles.flashArchBox}>
        {CHOOSER_CARDS.map((card, i) => (
          <img
            key={card.to}
            className={clsx(
              styles.flashArchImg,
              i === active && styles.flashArchImgActive,
            )}
            src={useBaseUrl(card.img)}
            alt={i === active ? card.alt : ''}
            aria-hidden={i === active ? undefined : true}
            loading="lazy"
            width={400}
            height={400}
          />
        ))}
        {/* The flash light, clipped to the arch silhouette, blooming to fill the whole window. */}
        <div className={styles.flashArchWrap} aria-hidden="true">
          <div className={clsx(styles.flashArch, flashing && styles.flashOn)} />
        </div>
      </div>

      {/* THE DEPARTURE BOARD: directly beneath the portal, centered on the same axis. One persistent
          instance (it never re-mounts, so it just flips, never fades), driven by the active title. */}
      <div className={styles.flashBoard}>
        <SplitFlap
          text={stripEmoji(CHOOSER_CARDS[active].title)}
          columns={FLASH_BOARD_COLS}
          rows={FLASH_BOARD_ROWS}
          settleMs={FLASH_SETTLE_MS}
        />
      </div>
    </Link>
  );
}

/* ── VARIANT D hero: the BOUTIQUE STOREFRONT ───────────────────────────────────────────────────
   An upscale stone storefront (inspired by an Aston Martin boutique): THREE arched openings, a tall
   central arched DOOR flanked by two smaller lit arched WINDOWS, with the Vestaboard SIGN hanging
   ABOVE the central door. Each arch GLOWS warmly from within (a lit boutique at dusk). The center
   door shows the current project (a peek inside); the side windows preview the PREV + NEXT projects.
   On a change all three CROSS-FADE forward and the sign flips. The arches are the scene art's OWN
   (clipped to the arch interior via the arch-inner.png mask), so no extra arch is drawn.
   prefers-reduced-motion users get the cross-fade with the glow steady and no shimmer. */
const BOUTIQUE_INTERVAL_MS = 12000; // time one project is shown before the storefront cycles

function ChooserBoutique() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const step = useCallback((delta: number) => {
    setActive((i) => (i + delta + CHOOSER_CARDS.length) % CHOOSER_CARDS.length);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const tick = window.setInterval(() => step(1), BOUTIQUE_INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, [paused, active, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  // DEV-ONLY: on localhost, apply any hero-tuning URL params as inline CSS vars on the gate, so a
  // shared `?ht-...` URL reproduces a tuned look (and the Hero Tuner panel drives this element). No-op
  // off localhost, so production renders the baked CSS-var defaults.
  const gateRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    applyHeroParams(gateRef.current);
  }, []);

  const n = CHOOSER_CARDS.length;
  const leftIdx = (active - 1 + n) % n; // prev project, in the left window
  const rightIdx = (active + 1) % n; // next project, in the right window

  // One lit arched opening: a scene clipped to the arch interior + a warm glow. `which` picks the
  // index shown; `kind` tags it (door = the clickable center; window = a side preview).
  const Opening = ({idx, kind}: {idx: number; kind: 'door' | 'window'}) => (
    <div
      className={clsx(styles.boutiqueArch, kind === 'door' && styles.boutiqueDoor)}
      aria-hidden={kind === 'window' ? true : undefined}>
      {/* the lit interior: every project stacked, the chosen one cross-faded in */}
      <div className={styles.boutiquePeek}>
        {CHOOSER_CARDS.map((card, i) => (
          <img
            key={card.to}
            className={clsx(styles.boutiquePeekImg, i === idx && styles.boutiquePeekImgActive)}
            src={useBaseUrl(card.img)}
            alt={kind === 'door' && i === idx ? card.alt : ''}
            loading="lazy"
            width={400}
            height={400}
          />
        ))}
      </div>
      {/* the warm glow spilling from inside the arch */}
      <span className={styles.boutiqueGlow} aria-hidden="true" />
    </div>
  );

  return (
    <Link
      ref={gateRef}
      data-hero-root
      className={styles.boutiqueGate}
      to={CHOOSER_CARDS[active].to}
      aria-label={stripEmoji(CHOOSER_CARDS[active].title)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onClick={() =>
        posthog.capture('hero card clicked', {
          hero_variant: 'boutique',
          destination: CHOOSER_CARDS[active].to,
        })
      }>
      <div className={styles.boutiqueFront}>
        {/* The hanging STORE SIGN, above the central door (like a boutique nameplate over the entrance). */}
        <div className={styles.boutiqueSignWrap}>
          <div className={styles.boutiqueSign}>
            <SplitFlap
              text={stripEmoji(CHOOSER_CARDS[active].title)}
              columns={FLASH_BOARD_COLS}
              rows={FLASH_BOARD_ROWS}
              settleMs={FLASH_SETTLE_MS}
            />
          </div>
        </div>

        {/* The three lit arches: window · DOOR · window. */}
        <div className={styles.boutiqueArches}>
          <Opening idx={leftIdx} kind="window" />
          <Opening idx={active} kind="door" />
          <Opening idx={rightIdx} kind="window" />
        </div>

        {/* The stone base / sill the storefront sits on. */}
        <div className={styles.boutiqueBase} aria-hidden="true" />
      </div>
    </Link>
  );
}

/* ── VARIANT D hero: the CREATIVE STUDIO ───────────────────────────────────────────────────────
   A freestanding studio SIGN on a post (the Vestaboard) stands next to the STUDIO on a shared ground
   line; the studio is the scene art's OWN arched doorway (the only arch) that you peek inside. On a
   project change the inside CROSS-FADES to the next. No CSS facade/wall, no second arch.
   prefers-reduced-motion users get the cross-fade with the sign sway held still. */
const STUDIO_INTERVAL_MS = 4500; // time one state (door OR a scene) is shown before the next flash
// The studio board is wide (≈3× the arch) and packed with filler tiles so the grid FILLS the case
// (no bezel gap). 3 ROWS of BIGGER tiles (a blank row + 1-2 title rows; not 5 rows of small ones).
// More columns = wider board; .studioSign font-size + --flap-gap set the tile size + pacing.
const STUDIO_BOARD_COLS = 22; // wide board, big-ish tiles → ~3× the arch width
const STUDIO_BOARD_ROWS = 3; // 3 rows of bigger letters (not 5 rows of small)
// The door↔scene WHITE FLASH: the centre arch flashes white (a long camera-exposure bloom); at the
// flash PEAK the centre swaps door↔scene and the board flips; then the flash recedes. The flash
// duration is MATCHED to the board roll (FLASH_SETTLE_MS) so the new scene + the settled board ARRIVE
// TOGETHER (the spec: "we should arrive to next scene and board should finish at the same time").
const STUDIO_FLASH_MS = FLASH_SETTLE_MS; // bloom-to-peak == board roll
const STUDIO_FLASH_HOLD_MS = 260; // hold at peak white before receding

// ── The scroll-progress engine (shared by all 3 parallax scroll-models) ─────────────────────────
// Maps a SCROLL progress value in [0,1] to which of the `count` scenes the centre door shows, and
// fires the camera FLASH (+ flips the board door↔scene) when scroll crosses a scene boundary. This
// replaces the timer-driven step() in the original ChooserStudio: scrolling now DECIDES the scene.
//
// `progress` is produced differently per variant (window scroll within a tall pinned spacer, or how
// far the hero has moved through the viewport, or a horizontal-pan fraction), but the mapping from
// progress → {active, mode, flashing} is identical, so it lives here once.

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// TEST/QA seam: `?hero-scene=N` forces the parallax engine to scene N (bypassing scroll), so e2e tests
// (and manual QA) can land on a SPECIFIC scene deterministically without computing scroll offsets.
// Localhost-only (same gate as the ab- overrides) so production ignores it. Registered in the URL-param
// registry (src/lib/url-params.ts) as `hero-scene`, scope: localhost — keep that entry in sync.
function forcedScene(count: number): number | null {
  if (!isLocalhost()) return null;
  const raw = new URLSearchParams(window.location.search).get(HERO_SCENE_PARAM);
  if (raw == null) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || n >= count) return null;
  return n;
}

type SceneState = {active: number; mode: 'door' | 'scene'; flashing: boolean};

/**
 * Derive the scene state from a scroll `progress` in [0,1] across `count` scenes.
 *
 * The [0,1] range is divided into `count` equal bands; band i ⇒ scene i. Crossing from one band to
 * the next plays a FLASH (scroll-triggered, not timed): we briefly set `flashing`, and at the flash
 * peak swap the door↔scene + advance `active`, mirroring the original timed transition. Reduced-motion
 * users skip the flash and snap straight to the new scene.
 *
 * Returns the current {active, mode, flashing}. `onSettleRef` is an escape hatch the wrappers use to
 * react to the settled scene (e.g. navbar highlight) without re-rendering the engine.
 */
function useScrollScene(
  progressRef: React.MutableRefObject<number>,
  count: number,
  // a monotonically-increasing tick the wrapper bumps on every scroll frame, so the hook recomputes
  scrollTick: number,
): SceneState {
  const [state, setState] = useState<SceneState>({active: 0, mode: 'door', flashing: false});
  const bandRef = useRef(0); // the last band (scene index) we settled on
  const timers = useRef<number[]>([]);
  const reduce = prefersReducedMotion();
  const forced = forcedScene(count); // TEST seam: ?hero-scene=N pins the scene (localhost only)

  useEffect(() => {
    // TEST seam: when a scene is forced, snap to it (no scroll, no flash) so e2e is deterministic.
    if (forced != null) {
      bandRef.current = forced;
      setState({active: forced, mode: 'scene', flashing: false});
      return;
    }
    const p = Math.min(0.99999, Math.max(0, progressRef.current));
    const band = Math.min(count - 1, Math.floor(p * count));
    if (band === bandRef.current) {
      // within the same scene's band: nothing to transition. Ensure we're showing that scene.
      return;
    }
    const prevBand = bandRef.current;
    bandRef.current = band;

    // clear any in-flight flash timers (a fast scroll can cross several bands)
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    if (reduce) {
      // no flash: snap to the new scene immediately, board names the destination
      setState({active: band, mode: 'scene', flashing: false});
      return;
    }

    // FLASH the crossing: bloom now; at the peak swap to the new scene + flip the board; then recede.
    setState((s) => ({...s, flashing: true}));
    timers.current.push(
      window.setTimeout(() => {
        setState({active: band, mode: 'scene', flashing: true});
      }, STUDIO_FLASH_MS),
    );
    timers.current.push(
      window.setTimeout(
        () => setState((s) => ({...s, flashing: false})),
        STUDIO_FLASH_MS + STUDIO_FLASH_HOLD_MS,
      ),
    );
    void prevBand; // (direction is available via band - prevBand if a wrapper wants it later)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTick, count, reduce, forced]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  return state;
}

/**
 * A rAF-throttled scroll listener that writes a [0,1] progress into `progressRef` and bumps a tick
 * so `useScrollScene` recomputes. `compute` turns the current scroll geometry into the fraction; each
 * variant supplies its own (window-scroll-within-spacer, element-through-viewport, horizontal-pan).
 * SSR-safe (no-op until mounted) and passive (never blocks scrolling, so the page is never trapped).
 */
function useScrollProgress(
  compute: () => number,
  progressRef: React.MutableRefObject<number>,
): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = window.requestAnimationFrame(() => {
        pending = false;
        const next = compute();
        if (next !== progressRef.current) {
          progressRef.current = next;
          setTick((t) => (t + 1) % 1_000_000);
        }
      });
    };
    onScroll(); // initialise on mount
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return tick;
}

/* The presentational FACADE: the Lebanese central-hall home (roof + square body + three arches + the
   hanging Vestaboard + the centre door↔scene flash), driven purely by props. Both the original timer
   ChooserStudio and the scroll-driven parallax wrappers render this with their own {active, mode,
   flashing}, so the visual house is defined ONCE. The clickable <Link> + hover/keyboard behaviour and
   the data-hero-root / gateRef belong to the wrappers (they differ per scroll-model). */
function StudioFacade({active, mode, flashing}: SceneState): React.JSX.Element {
  return (
    <div className={styles.studioFacade}>
      {/* The TEAL triangular roof sits ABOVE the square body (a sibling, not inside it). */}
      <div className={styles.studioRoof} aria-hidden="true" />

      {/* The SQUARE terracotta house body: holds the board + the three arches. */}
      <div className={styles.studioBody}>
        <div className={styles.studioRow}>
          {/* LEFT: the cleaned zellij WINDOW (static), with a GOLD balcony railing in front of it. */}
          <div className={styles.studioArch}>
            <img
              className={styles.studioArchImg}
              src={useBaseUrl('/img/cards/window.png')}
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={400}
              height={400}
            />
            <span className={styles.studioWindowRail} aria-hidden="true" />
          </div>

          {/* CENTER: the carved DOOR, with the Vestaboard sign HANGING above it. */}
          <div className={styles.studioCenter}>
            <div className={styles.studioSignHanger}>
              <div className={styles.studioSignSwing}>
                <div className={styles.studioSign}>
                  <SplitFlap
                    text={mode === 'door' ? 'WELCOME' : stripEmoji(CHOOSER_CARDS[active].title)}
                    columns={STUDIO_BOARD_COLS}
                    rows={STUDIO_BOARD_ROWS}
                    settleMs={FLASH_SETTLE_MS}
                  />
                </div>
              </div>
            </div>
            {/* The centre arch is the DOORWAY you peek through: the carved DOOR (mode 'door') OR the
                current project SCENE (mode 'scene'), with a WHITE FLASH masked to the arch that blooms
                over the swap (a long camera-exposure). The door + scene cross-fade; the flash peak
                masks the change. */}
            <div className={styles.studioArch} data-flash={flashing ? 'on' : undefined}>
              {/* the carved DOOR (shown when mode === 'door') */}
              <img
                className={clsx(
                  styles.studioArchImg,
                  styles.studioDoorLayer,
                  mode === 'door' && styles.studioLayerOn,
                )}
                src={useBaseUrl('/img/cards/door.png')}
                alt=""
                aria-hidden="true"
                loading="lazy"
                width={400}
                height={400}
              />
              {/* the current project SCENE (shown when mode === 'scene'), clipped to the arch interior */}
              <div
                className={clsx(styles.studioDoorScene, mode === 'scene' && styles.studioLayerOn)}
                aria-hidden="true">
                {CHOOSER_CARDS.map((card, i) => (
                  <img
                    key={card.to}
                    className={clsx(styles.studioPeekImg, i === active && styles.studioPeekImgActive)}
                    src={useBaseUrl(card.img)}
                    alt=""
                    loading="lazy"
                    width={400}
                    height={400}
                  />
                ))}
              </div>
              {/* the white flash bloom, masked to the arch */}
              <span className={styles.studioFlash} aria-hidden="true" />
            </div>
          </div>

          {/* RIGHT: a second cleaned zellij WINDOW (static), mirroring the left window. The project
              peek now lives ONLY in the centre door (the door↔scene flash), so both side arches are
              decorative windows. */}
          <div className={styles.studioArch}>
            <img
              className={styles.studioArchImg}
              src={useBaseUrl('/img/cards/window.png')}
              alt=""
              aria-hidden="true"
              loading="lazy"
              width={400}
              height={400}
            />
            <span className={styles.studioWindowRail} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChooserStudio() {
  const [active, setActive] = useState(0);
  // `mode` = what the CENTRE arch shows: 'door' (board says WELCOME) or 'scene' (board says the
  // destination). The cycle alternates door → scene(active) → door → scene(active+1) → …
  const [mode, setMode] = useState<'door' | 'scene'>('door');
  const [flashing, setFlashing] = useState(false);
  const [paused, setPaused] = useState(false);
  const timers = useRef<number[]>([]);

  // ONE transition: flash the centre arch white; at the flash peak, swap door↔scene (and advance to
  // the next project when leaving a scene); then recede. delta picks direction when stepping scenes.
  const step = useCallback((delta: number) => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setFlashing(true);
    // at the flash peak: do the swap (the bright moment masks the change)
    timers.current.push(
      window.setTimeout(() => {
        setMode((m) => {
          if (m === 'door') return 'scene'; // door → reveal the current project scene
          // leaving a scene → advance to the next project, back to the door
          setActive((i) => (i + delta + CHOOSER_CARDS.length) % CHOOSER_CARDS.length);
          return 'door';
        });
      }, STUDIO_FLASH_MS),
    );
    // recede the flash a beat after the swap
    timers.current.push(
      window.setTimeout(() => setFlashing(false), STUDIO_FLASH_MS + STUDIO_FLASH_HOLD_MS),
    );
  }, []);

  // Auto-cycle (paused on hover/focus); re-arms when mode/active changes so a manual nav resets it.
  useEffect(() => {
    if (paused) return undefined;
    const tick = window.setInterval(() => step(1), STUDIO_INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, [paused, active, mode, step]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // ←/→ hop to prev/next, same GLOBAL window listener as the flash gate (works whenever the hero is
  // on screen, not only when focused). Ignored while typing in an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  // DEV-ONLY: apply hero-tuning URL params on localhost (the Hero Tuner panel drives this root). No-op
  // off localhost, so production renders the baked CSS-var defaults.
  const gateRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    applyHeroParams(gateRef.current);
  }, []);

  return (
    <Link
      ref={gateRef}
      data-hero-root
      className={styles.studioGate}
      to={CHOOSER_CARDS[active].to}
      aria-label={stripEmoji(CHOOSER_CARDS[active].title)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onClick={() =>
        posthog.capture('hero card clicked', {
          hero_variant: 'studio',
          destination: CHOOSER_CARDS[active].to,
        })
      }>
      {/* THE STUDIO FACADE: a traditional Lebanese central-hall HOME, defined once in StudioFacade and
          driven here by the timer state. */}
      <StudioFacade active={active} mode={mode} flashing={flashing} />
    </Link>
  );
}

// ── Navbar-item highlight: light the top-navbar link matching the active scene ───────────────────
// As the door shows /craft, the 'Craft' navbar item gets an active style; /journey → 'Journey', etc.
// The homepage route is '/', so Docusaurus marks NOTHING active by default — we own this highlight
// cleanly. We add a class to the matching navbar <a> (whose path ends with the card's `to`), revert
// on change / unmount, AND only while the hero is ON-SCREEN (so the highlight clears once you scroll
// past the hero). SSR-safe (effect only). `heroRef` is the hero gate we watch for visibility.
function useNavbarSceneHighlight(
  active: number,
  heroRef: React.MutableRefObject<HTMLElement | null>,
): void {
  // track whether the hero is in the viewport (so the highlight only applies while it's visible)
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {threshold: 0});
    io.observe(el);
    return () => io.disconnect();
  }, [heroRef]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const to = CHOOSER_CARDS[active]?.to;
    if (!to || !visible) return undefined;
    // match a top-navbar link whose pathname ends with the destination (ignore query/hash + baseUrl)
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('.navbar__item.navbar__link, a.navbar__link'),
    );
    const match = links.find((a) => {
      try {
        return new URL(a.href, window.location.origin).pathname.replace(/\/$/, '').endsWith(to);
      } catch {
        return false;
      }
    });
    if (!match) return undefined;
    match.classList.add(styles.navbarSceneActive);
    return () => match.classList.remove(styles.navbarSceneActive);
  }, [active, visible]);
}

// ── The scroll-driven parallax hero (3 scroll-models share this one component) ────────────────────
// `model` selects how vertical scroll maps to scene progress:
//   'pin'        — the hero sticks full-screen inside a TALL spacer; scrolling the spacer advances the
//                  scenes one-by-one, then the hero releases and the page scrolls on (scroll-jack).
//   'inplace'    — the hero lives in normal flow; progress = how far the hero has travelled THROUGH the
//                  viewport (no hijack; the effect spans the hero's own height).
//   'horizontal' — like 'pin', but the scenes pan HORIZONTALLY across a pinned track; the door shows
//                  the current scene in the pan.
// All three feed the shared useScrollScene engine; only the geometry (`compute`) + the wrapper layout
// differ. Pin/horizontal RELEASE after the last scene (the tall spacer simply ends), so the wheel is
// never trapped; the listener is passive. prefers-reduced-motion is handled inside the engine.
type ScrollModel = 'pin' | 'inplace' | 'horizontal';
const SCENE_VH = 0.85; // each scene gets ~85vh of scroll in the pinned models (spacer = count * this)

function ParallaxStudio({model}: {model: ScrollModel}): React.JSX.Element {
  const count = CHOOSER_CARDS.length;
  const progressRef = useRef(0);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const gateRef = useRef<HTMLAnchorElement | null>(null);

  // Per-model progress geometry. Pin/horizontal: progress = how far we've scrolled INTO the tall
  // spacer (0 when its top hits the viewport top, 1 when its bottom is one viewport from the top).
  // Inplace: progress = how far the hero has moved up through the viewport.
  const compute = useCallback(() => {
    const el = spacerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    if (model === 'inplace') {
      // 0 when the hero's top is at the viewport bottom, 1 when its bottom reaches the viewport top
      const total = rect.height + vh;
      const travelled = vh - rect.top;
      return Math.min(1, Math.max(0, travelled / total));
    }
    // pin / horizontal: the spacer is tall; we map its scroll-through to [0,1]
    const scrollable = rect.height - vh; // total scroll distance while pinned
    if (scrollable <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / scrollable));
  }, [model]);

  const tick = useScrollProgress(compute, progressRef);
  const {active, mode, flashing} = useScrollScene(progressRef, count, tick);

  useNavbarSceneHighlight(active, gateRef);

  // DEV-ONLY hero-tuning params (localhost), same as the timer studio.
  useEffect(() => {
    applyHeroParams(gateRef.current);
  }, []);

  const pinned = model === 'pin' || model === 'horizontal';
  // The horizontal pan offset: slide the scene track so the active scene is centred (cosmetic depth
  // layer BEHIND the facade; the door still carries the actual door↔scene flash).
  const panPct = model === 'horizontal' ? -(active * (100 / count)) : 0;

  const gate = (
    <Link
      ref={gateRef}
      data-hero-root
      data-scroll-model={model}
      data-active-scene={active}
      data-active-dest={CHOOSER_CARDS[active].to}
      className={clsx(styles.studioGate, pinned && styles.parallaxSticky)}
      to={CHOOSER_CARDS[active].to}
      aria-label={stripEmoji(CHOOSER_CARDS[active].title)}
      onClick={() =>
        posthog.capture('hero card clicked', {
          hero_variant: `parallax-${model}`,
          destination: CHOOSER_CARDS[active].to,
        })
      }>
      {model === 'horizontal' && (
        // a horizontal-pan depth strip behind the facade: the 7 scenes in a row, panned by `active`
        <div className={styles.parallaxPanLayer} aria-hidden="true">
          <div
            className={styles.parallaxPanTrack}
            style={{
              width: `${count * 100}%`,
              transform: `translateX(${panPct}%)`,
            }}>
            {CHOOSER_CARDS.map((card) => (
              <img
                key={card.to}
                className={styles.parallaxPanImg}
                src={useBaseUrl(card.img)}
                alt=""
                loading="lazy"
                width={400}
                height={400}
              />
            ))}
          </div>
        </div>
      )}
      <StudioFacade active={active} mode={mode} flashing={flashing} />
    </Link>
  );

  if (model === 'inplace') {
    // normal-flow: the hero IS the scroll element; no tall spacer, no pinning.
    return (
      <div ref={spacerRef} className={styles.parallaxInplace}>
        {gate}
      </div>
    );
  }

  // pin / horizontal: a TALL spacer (count * SCENE_VH viewport-heights) holds a sticky hero. Scrolling
  // the spacer drives the scenes; when the spacer ends the hero releases and the page scrolls on.
  return (
    <div
      ref={spacerRef}
      className={styles.parallaxSpacer}
      style={{height: `${Math.round(count * SCENE_VH * 100)}vh`}}>
      <div className={styles.parallaxStick}>{gate}</div>
    </div>
  );
}

/* A neutral, fixed-size SKELETON shown while the A/B variant is resolving (and as the SSR/no-JS
   fallback). It reserves the hero's height so there is NO layout jump when the real hero swaps in,
   and it doesn't commit to either arm, so a `test` user never sees the strip flash up first. */
function ChooserSkeleton() {
  return (
    <div className={styles.heroSkeleton} aria-hidden="true">
      <div className={styles.heroSkeletonCard}>
        <div className={styles.heroSkeletonArch} />
        <div className={styles.heroSkeletonLine} />
        <div className={clsx(styles.heroSkeletonLine, styles.heroSkeletonLineShort)} />
      </div>
    </div>
  );
}

/* Pick the hero animation by the A/B variant. Until the variant resolves we render the skeleton
   (not the strip), so a `test` user does not see the control strip flash up and then get replaced.
   FALLBACK: if the flag has not resolved within RESOLVE_TIMEOUT_MS (PostHog blocked, absent, or
   slow), default to control, so the hero never gets stuck on the skeleton. */
const RESOLVE_TIMEOUT_MS = 600;

// Resolve an experiment's active variant id, with the same no-strand fallback the hero used: null
// while unresolved, then the variant, then 'control' if PostHog is slow/absent. SSR-safe.
function useResolvedVariant(exp: Experiment): string | null {
  const [variant, setVariant] = useState<string | null>(null);
  useEffect(() => {
    let settled = false;
    const set = (v: string) => {
      settled = true;
      setVariant(v);
    };
    const unsub = resolveVariant(exp, set);
    const t = window.setTimeout(() => {
      if (!settled) setVariant('control');
    }, RESOLVE_TIMEOUT_MS);
    return () => {
      window.clearTimeout(t);
      if (typeof unsub === 'function') unsub();
    };
  }, [exp]);
  return variant;
}

function HeroChooser() {
  // Two composed experiments: `anim` picks WHICH hero (scroll strip / flash gate / studio house /
  // boutique); `scroll` picks the scroll-MODEL, but only matters for the studio house (the parallax
  // pivot). Both must resolve before we render (else the skeleton holds, reserving height).
  const animVariant = useResolvedVariant(EXPERIMENTS['homepage-hero-anim']);
  const scrollVariant = useResolvedVariant(EXPERIMENTS['homepage-hero-scroll']);
  if (animVariant === null || scrollVariant === null) return <ChooserSkeleton />;

  // 4-way A/B/C/D on the anim experiment.
  if (animVariant === 'test' || animVariant === 'flash') return <ChooserFlash />;
  if (animVariant === 'variant_d' || animVariant === 'boutique') return <ChooserBoutique />;
  if (animVariant === 'variant_c' || animVariant === 'studio') {
    // The studio HOUSE: the scroll experiment now decides timer-vs-parallax. control/static keeps the
    // original non-jacking timer hero (the safe default); pin/inplace/horizontal are scroll-driven.
    if (scrollVariant === 'pin') return <ParallaxStudio model="pin" />;
    if (scrollVariant === 'inplace') return <ParallaxStudio model="inplace" />;
    if (scrollVariant === 'horizontal') return <ParallaxStudio model="horizontal" />;
    return <ChooserStudio />;
  }
  return <ChooserStrip />;
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <p className={styles.heroEyebrow}>Engineering · Faith · Craft</p>
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        {/* The hero animation is A/B-tested (EXPERIMENTS['homepage-hero-anim']): control = the
            scrolling strip, test = the camera-flash rotator. BrowserOnly so the flag read + timers
            run client-side only; the SSR/no-JS fallback is a neutral skeleton (NOT a committed arm)
            so neither variant flashes up before the flag resolves. */}
        <BrowserOnly fallback={<ChooserSkeleton />}>{() => <HeroChooser />}</BrowserOnly>
      </div>
    </header>
  );
}

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const {url, title, tagline} = siteConfig;

  // WebSite + Organization JSON-LD for richer SERP results. Blog posts get their
  // own BlogPosting JSON-LD automatically from the Docusaurus blog plugin, so we
  // only add site-level structured data here on the homepage.
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url: `${url}/`,
        name: title,
        description: tagline,
        publisher: {'@id': `${url}/#organization`},
      },
      {
        '@type': 'Organization',
        '@id': `${url}/#organization`,
        name: title,
        url: `${url}/`,
        logo: `${url}/img/logo-binary.svg`,
        founder: {'@type': 'Person', name: 'Omar Eid'},
        sameAs: [
          'https://github.com/omars-lab',
          'https://www.linkedin.com/in/oeid/',
        ],
      },
    ],
  };

  return (
    <Layout
      description="Software engineering docs, blog posts, and system designs by Omar Eid: purposeful code, one byte at a time.">
      {/* Raw <title> overrides Docusaurus' templated "<title> | <siteTitle>" so
          the homepage browser tab reads exactly "Omars Blog". */}
      <Head>
        <title>Omars Blog</title>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Head>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <LatestPosts />
      </main>
    </Layout>
  );
}
