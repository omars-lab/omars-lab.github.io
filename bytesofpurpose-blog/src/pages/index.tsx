import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {EXPERIMENTS, resolveVariant, isLocalhost, urlOverride, type Experiment} from '../experiments';
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
    to: '/initiatives',
    img: '/img/cards/initiatives.png',
    alt: 'Omar conducting an orchestra from the podium',
    title: '📝 Explore My Initiatives',
    body: 'The dated things I actually did.',
  },
  {
    to: '/thoughts',
    img: '/img/cards/thinking.png',
    alt: 'Omar in thought, hand to his chin',
    title: '💭 Explore My Thoughts',
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
// A board WIDER than the longest title ("DISCOVER MY JOURNEY" = 19): each title is CENTERED on the
// board, so a short title (WELCOME) sits dead-center and the rest fill more of the row, with blank
// flap tiles flanking the centered title (a real departure board's empty flaps).
const STUDIO_BOARD_COLS = 24;
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

// Mobile breakpoint for the hero (matches the ≤600px studio media query in index.module.css). On
// mobile the house goes DOOR-ONLY (side windows hidden in CSS) with a NARROWER board, and the
// scroll-jacking models (pin/horizontal) fall back to in-flow behaviour (no 100vh pin). Reactive so
// a rotate/resize re-renders. SSR-safe (false until mounted).
const HERO_MOBILE_QUERY = '(max-width: 600px)';
// door-only board, but WIDE: wider than the longest title (19) so the title fits on ONE line AND has
// blank flap tiles either side (centered, not left-hugging). The shared-width centering (boardWidth)
// keeps each title centered within the same content block.
const STUDIO_BOARD_COLS_MOBILE = 22;

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(HERO_MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
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

type SceneState = {
  active: number; // the scene currently CENTERED (the one the gate links to / commits)
  shown: number; // the scene the DOOR currently shows (swaps to `active` at the flash peak)
  mode: 'door' | 'scene';
  flash: number; // CONTINUOUS flash opacity [0,1], driven by scroll position (0 = no flash)
  boardProgress: number; // CONTINUOUS board flip-progress [0,1] for the transition in flight
  boardFromText: string; // the board text flipping FROM (e.g. 'WELCOME' or a scene title)
  boardToText: string; // the board text flipping TO
};

// The fraction of each scene's slice spent in the TRANSITION zone (the rest is "settled on this
// scene"). 0.5 ⇒ the back half of every slice is the crossing to the next scene. Larger = longer, more
// gradual transitions; smaller = the scene holds longer then a quicker cross.
const TRANSITION_FRACTION = 0.5;

// ── ONE progress-driven model, TWO interchangeable drivers ───────────────────────────────────────
// Every animatable hero piece (the flash bloom, the door↔scene swap, the board flip) is a pure
// function of ONE normalized progress value p in [0,1] across all `count` scenes (deriveSceneState).
// That progress is supplied by either driver, and the components never know which:
//   • SCROLL driver  (useScrollScene): p = f(scroll position) — scrubbable, FREEZES when you stop.
//   • TIME driver    (useTimerScene):  p ramps on a rAF clock — self-running (the non-parallax hero).
// So the SAME visuals work "on scroll OR on animation" with no per-component special-casing.

/** PURE: map a single progress p∈[0,1] (across `count` scenes) to the full visual SceneState. */
function deriveSceneState(p: number, count: number, reduce: boolean): SceneState {
  const clamped = Math.min(0.999999, Math.max(0, p));
  // The journey has count+1 STOPS: stop 0 is the DOOR (board = WELCOME), then stops 1..count are the
  // scenes. So at rest before any scroll you see the carved door saying WELCOME; the first crossing is
  // door → scene 0, then scene 0 → scene 1, etc. We map progress across (count+1) equal slices.
  const stops = count + 1;
  const slice = 1 / stops;
  const s = Math.min(stops - 1, Math.floor(clamped / slice)); // current stop (0 = door)
  const within = (clamped - s * slice) / slice; // 0..1 within this stop's slice
  const nextStop = Math.min(stops - 1, s + 1);

  // a stop's CONTENT: stop 0 = the door (scene index 0 shown behind, but mode 'door'); stop k≥1 = scene k-1
  const sceneOf = (stop: number) => Math.max(0, stop - 1);
  const isDoor = (stop: number) => stop === 0;
  // the BOARD text for a stop: WELCOME at the door, else that scene's title.
  const boardTextOf = (stop: number) =>
    isDoor(stop) ? 'WELCOME' : stripEmoji(CHOOSER_CARDS[sceneOf(stop)].title);

  const settledFrac = 1 - TRANSITION_FRACTION;
  if (within < settledFrac || s === nextStop) {
    // SETTLED on this stop.
    const sc = sceneOf(s);
    const txt = boardTextOf(s);
    return {
      active: sc,
      shown: sc,
      mode: isDoor(s) ? 'door' : 'scene',
      flash: 0,
      boardProgress: 1,
      boardFromText: txt,
      boardToText: txt,
    };
  }
  // TRANSITION zone stop s → nextStop. t ramps 0..1 across the back TRANSITION_FRACTION of the slice.
  const t = (within - settledFrac) / TRANSITION_FRACTION;
  const flash = reduce ? 0 : Math.sin(Math.PI * t); // smooth 0→1→0 hump, peak at t=0.5
  const fromDoor = isDoor(s);
  const toScene = sceneOf(nextStop);
  const fromScene = sceneOf(s);
  // mode/shown swap at the bright peak (the swap hides under the flash)
  const past = t >= 0.5;
  return {
    active: past ? toScene : fromScene,
    shown: past ? toScene : fromScene,
    mode: !past && fromDoor ? 'door' : 'scene', // leaving the door: door until the peak, then the scene
    flash,
    boardProgress: reduce ? (past ? 1 : 0) : t,
    boardFromText: boardTextOf(s),
    boardToText: boardTextOf(nextStop),
  };
}

/**
 * SCROLL driver: derive the SceneState continuously from a scroll `progress` ref. Fully SCRUBBABLE
 * (scroll forward/back moves the flash + board + door together; STOP and it freezes). `scrollTick` is
 * bumped by the wrapper on each scroll frame so this recomputes.
 */
function useScrollScene(
  progressRef: React.MutableRefObject<number>,
  count: number,
  scrollTick: number,
): SceneState {
  const reduce = prefersReducedMotion();
  const forced = forcedScene(count); // TEST seam: ?hero-scene=N pins the scene (localhost only)
  return useMemo<SceneState>(() => {
    if (forced != null) {
      return {active: forced, shown: forced, mode: 'scene', flash: 0, boardProgress: 1, boardFromText: stripEmoji(CHOOSER_CARDS[forced].title), boardToText: stripEmoji(CHOOSER_CARDS[forced].title)};
    }
    return deriveSceneState(progressRef.current, count, reduce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTick, count, reduce, forced]);
}

/**
 * TIME driver: the SAME model self-running on a rAF clock (for the non-parallax timer hero). Progress
 * advances at a steady rate, holding on each settled scene and ramping through each transition, looping
 * back to 0 after the last scene. Paused while `paused` (hover/focus). Reduced-motion → no flash but
 * the scene still advances. Yields the identical SceneState shape as the scroll driver.
 */
// PURE: the timer hero's SceneState at `elapsed` ms. The board shows the door (WELCOME) ONLY on the
// first pass; then it loops the SCENE titles directly (scene i → i+1, wrapping count-1 → 0), never
// returning to the door — so every looping transition is title→title (only changed cells flip), not
// WELCOME↔title (which flips most of the board). Each step = a HOLD then a CROSS (flash) to the next.
function timerScene(
  elapsed: number,
  count: number,
  perStep: number,
  settleMs: number,
  crossMs: number,
  reduce: boolean,
): SceneState {
  const welcomeMs = perStep; // the opening door (WELCOME) shows for one step, then crosses to scene 0
  const titleOf = (i: number) => stripEmoji(CHOOSER_CARDS[((i % count) + count) % count].title);
  const settled = (sc: number, txt: string, door: boolean): SceneState => ({
    active: sc, shown: sc, mode: door ? 'door' : 'scene', flash: 0, boardProgress: 1,
    boardFromText: door ? 'WELCOME' : txt, boardToText: door ? 'WELCOME' : txt,
  });
  // WRAP an index into 0..count-1. The crossing from the LAST scene targets `count` (out of bounds);
  // `active`/`shown` index CHOOSER_CARDS directly, so an unwrapped `count` makes CHOOSER_CARDS[count]
  // undefined and crashes on `.to`/`.title`. Wrap every index that indexes the cards.
  const wrap = (i: number) => ((i % count) + count) % count;
  // build a crossing SceneState from `fromIdx`(/door) to `toIdx`, at phase t in [0,1]
  const crossing = (fromIdx: number, toIdx: number, fromDoor: boolean, t: number): SceneState => {
    const past = t >= 0.5;
    const flash = reduce ? 0 : Math.sin(Math.PI * t);
    const idx = wrap(past ? toIdx : fromIdx); // never out of bounds (last→0 wraps)
    return {
      active: idx,
      shown: idx,
      mode: !past && fromDoor ? 'door' : 'scene',
      flash,
      boardProgress: reduce ? (past ? 1 : 0) : t,
      boardFromText: fromDoor ? 'WELCOME' : titleOf(fromIdx),
      boardToText: titleOf(toIdx),
    };
  };

  // OPENING: the door (WELCOME) hold + its crossing to scene 0.
  if (elapsed < welcomeMs) {
    if (elapsed < settleMs) return settled(0, '', true); // door, WELCOME held
    const t = (elapsed - settleMs) / crossMs; // door → scene 0
    return crossing(0, 0, true, Math.min(1, t));
  }
  // LOOP over scenes: t0 measured from the end of the opening; step = scene i, holding then crossing→i+1.
  const t0 = elapsed - welcomeMs;
  const loopMs = perStep * count;
  const inLoop = ((t0 % loopMs) + loopMs) % loopMs;
  const i = Math.floor(inLoop / perStep); // current scene 0..count-1
  const inStep = inLoop - i * perStep;
  if (inStep < settleMs) return settled(i, titleOf(i), false); // hold on scene i
  const t = (inStep - settleMs) / crossMs; // scene i → i+1 (wraps to 0 after the last)
  return crossing(i, i + 1, false, Math.min(1, t));
}

function useTimerScene(count: number, paused: boolean): SceneState {
  const reduce = prefersReducedMotion();
  const SETTLE_MS = STUDIO_INTERVAL_MS; // hold on a step
  const CROSS_MS = STUDIO_FLASH_MS + STUDIO_FLASH_HOLD_MS; // the crossing (flash) to the next step
  const perStep = SETTLE_MS + CROSS_MS;
  const [scene, setScene] = useState<SceneState>(() => timerScene(0, count, perStep, SETTLE_MS, CROSS_MS, reduce));
  // accumulated elapsed ms (persists across pause/resume); advanced each frame by the real delta.
  const elapsedRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) {
      lastRef.current = null; // so the next resume starts a fresh delta (no jump)
      return undefined;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      elapsedRef.current += now - lastRef.current;
      lastRef.current = now;
      setScene(timerScene(elapsedRef.current, count, perStep, SETTLE_MS, CROSS_MS, reduce));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, count, perStep, SETTLE_MS, CROSS_MS, reduce]);

  return scene;
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
): {tick: number; scrolling: boolean} {
  const [tick, setTick] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    let raf = 0;
    let pending = false;
    let idle = 0; // timer that flips `scrolling` back to false after a short pause
    // recompute the progress fraction (without touching the `scrolling` flag — used by the mount init).
    const recompute = () => {
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
    const onScroll = () => {
      // a REAL scroll event: mark scrolling true + reset the idle timer that settles it back to false.
      // (NOT called on mount, so the board starts at rest showing WELCOME rather than churning.)
      setScrolling(true);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setScrolling(false), 140); // ~140ms of no scroll = "stopped"
      recompute();
    };
    recompute(); // initialise progress on mount WITHOUT flagging "scrolling"
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(idle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {tick, scrolling};
}

/* The presentational FACADE: the Lebanese central-hall home (roof + square body + three arches + the
   hanging Vestaboard + the centre door↔scene flash), driven purely by props. Both the original timer
   ChooserStudio and the scroll-driven parallax wrappers render this with their own {active, mode,
   flashing}, so the visual house is defined ONCE. The clickable <Link> + hover/keyboard behaviour and
   the data-hero-root / gateRef belong to the wrappers (they differ per scroll-model). */
function StudioFacade({
  shown,
  mode,
  flash,
  boardToText,
  spinning,
}: SceneState & {spinning?: boolean}): React.JSX.Element {
  // On mobile the house is DOOR-ONLY (side windows hidden via CSS), so the board uses far fewer
  // columns to fit the narrow viewport; on desktop it stays wide (~3x the arch).
  const isMobile = useIsMobile();
  const boardCols = isMobile ? STUDIO_BOARD_COLS_MOBILE : STUDIO_BOARD_COLS;
  // BOARD ↔ SCENE SYNC: the board's target text is the title of the scene the DOOR currently shows
  // (`shown`), or WELCOME in door mode — so the board can never settle to a title the door hasn't
  // reached. CHURN is SCROLL-ONLY (`spinning`): while the wheel moves the board churns random letters
  // and settles on stop. The TIMER house (spinning=undefined) instead does the clean per-cell flap-roll
  // on a text change. Each title is CENTERED on the (wider-than-the-title) board, so short titles sit
  // dead-center with blank flap tiles either side.
  const boardTarget = mode === 'door' ? 'WELCOME' : stripEmoji(CHOOSER_CARDS[shown].title);
  const boardSpinning = spinning;
  // the flash opacity is CONTINUOUS (driven by scroll); expose it as a CSS var the .studioFlash reads.
  const flashStyle = {['--flash-o' as string]: String(flash)} as React.CSSProperties;
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
                    text={boardTarget}
                    spinning={boardSpinning}
                    columns={boardCols}
                    rows={STUDIO_BOARD_ROWS}
                    settleMs={FLASH_SETTLE_MS}
                  />
                </div>
              </div>
            </div>
            {/* MOBILE-ONLY gold balcony railing in the teal gap between the hanging board and the door
                (the side-window railings are hidden on mobile, so this brings the Lebanese gold
                detailing back). Hidden on desktop via CSS. */}
            <span className={styles.studioBoardRail} aria-hidden="true" />
            {/* The centre arch is the DOORWAY you peek through: the carved DOOR (mode 'door') OR the
                current project SCENE (mode 'scene'), with a WHITE FLASH masked to the arch that blooms
                over the swap (a long camera-exposure). The door + scene cross-fade; the flash peak
                masks the change. */}
            <div className={styles.studioArch} style={flashStyle}>
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
              {/* the current project SCENE (shown when mode === 'scene'), clipped to the arch interior.
                  We show `shown` (the scene the door currently displays; it swaps to the next scene at
                  the flash peak during a scroll transition), not necessarily `active`. */}
              <div
                className={clsx(styles.studioDoorScene, mode === 'scene' && styles.studioLayerOn)}
                aria-hidden="true">
                {CHOOSER_CARDS.map((card, i) => (
                  <img
                    key={card.to}
                    className={clsx(styles.studioPeekImg, i === shown && styles.studioPeekImgActive)}
                    src={useBaseUrl(card.img)}
                    alt=""
                    loading="lazy"
                    width={400}
                    height={400}
                  />
                ))}
              </div>
              {/* the white flash bloom, masked to the arch; opacity is the CONTINUOUS --flash-o var */}
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
  // The TIMER (non-parallax) hero: the SAME progress-driven model as the scroll hero, but driven by a
  // rAF clock instead of scroll (useTimerScene). So the flash + door + board behave identically; only
  // the DRIVER differs. Paused on hover/focus.
  const [paused, setPaused] = useState(false);
  const scene = useTimerScene(CHOOSER_CARDS.length, paused);
  const {active} = scene;

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
      {/* THE STUDIO FACADE: defined once, driven here by the TIME driver (identical shape to scroll). */}
      <StudioFacade {...scene} />
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

function ParallaxStudio({model: requestedModel}: {model: ScrollModel}): React.JSX.Element {
  const count = CHOOSER_CARDS.length;
  const progressRef = useRef(0);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const gateRef = useRef<HTMLAnchorElement | null>(null);

  // The pin/horizontal scroll-jack works on mobile too (the user wants the pin transition on phones).
  // The mobile FIT is handled in CSS: the house goes door-only + a taller body + a smaller door, and
  // the hero header shrinks, so the pinned hero fits the viewport. The HORIZONTAL pan backdrop is the
  // one thing that reads poorly on a narrow screen, so on mobile horizontal degrades to pin (same
  // scroll-jack, no side pan). Desktop keeps the requested model.
  const isMobile = useIsMobile();
  const model: ScrollModel =
    isMobile && requestedModel === 'horizontal' ? 'pin' : requestedModel;

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

  const {tick, scrolling} = useScrollProgress(compute, progressRef);
  const scene = useScrollScene(progressRef, count, tick);
  const {active} = scene;

  useNavbarSceneHighlight(active, gateRef);

  // SNAP-TO-CLOSEST-SCENE: when scrolling STOPS mid-transition, glide to the nearest stop's settled
  // centre so the door + flash + board all land on the SAME scene (no resting mid-crossing with the
  // flash lingering). Inplace has no spacer runway, so it's skipped; reduced-motion + ?hero-scene skip.
  //
  // Driven by a rAF EASE (not window.scrollTo({behavior:'smooth'}) + a guard, which raced with its own
  // scroll events and intermittently failed to fire on deeper stops). The ease writes scrollTop each
  // frame toward the target; a GENUINE new user scroll (a delta we didn't write) cancels it. So it
  // ALWAYS lands on a settled scene and the flash clears, every stop.
  // The snap is a SELF-CONTAINED imperative rAF loop (kicked off by the effect, but NOT tied to React
  // cleanup — that raced with the loop's own scroll writes). `snapActive` guards re-entry; the loop
  // aborts only on a genuine NEW user scroll (a delta it didn't write).
  const snapActive = useRef(false);
  useEffect(() => {
    if (scrolling || model === 'inplace' || snapActive.current) return; // act only on a real STOP
    if (prefersReducedMotion() || forcedScene(count) != null) return;
    const el = spacerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const scrollable = rect.height - vh;
    if (scrollable <= 0) return;
    const stops = count + 1;
    const p = Math.min(0.999999, Math.max(0, progressRef.current));
    const within = (p * stops) % 1;
    if (within <= 1 - TRANSITION_FRACTION) return; // already settled in this slice → no snap

    const stop = Math.min(stops - 1, Math.max(0, Math.round(p * stops - 0.5)));
    const targetP = (stop + (1 - TRANSITION_FRACTION) / 2) / stops; // centre of that stop's settled zone
    const spacerTopPage = rect.top + window.scrollY; // page-coords of progress 0
    const targetY = Math.round(spacerTopPage + targetP * scrollable);

    snapActive.current = true;
    let last = window.scrollY; // the position we last WROTE; a bigger mismatch = a NEW user scroll
    const step = () => {
      if (!snapActive.current) return;
      if (Math.abs(window.scrollY - last) > 3) {
        snapActive.current = false; // the user grabbed the wheel mid-snap → abort, leave it to them
        return;
      }
      const cur = window.scrollY;
      if (Math.abs(targetY - cur) < 1) {
        window.scrollTo(0, targetY); // land exactly
        snapActive.current = false;
        return;
      }
      window.scrollTo(0, cur + (targetY - cur) * 0.2); // ease 20% toward target per frame
      last = window.scrollY;
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
    // no cleanup: the loop self-manages via snapActive (React cleanup would cancel our own writes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrolling, model, count]);

  // DEV-ONLY hero-tuning params (localhost), same as the timer studio.
  useEffect(() => {
    applyHeroParams(gateRef.current);
  }, []);

  const pinned = model === 'pin' || model === 'horizontal';

  // PIN FROM THE FIRST SCROLL: the hero header (eyebrow/title/subtitle) normally sits ABOVE the hero in
  // flow, so scrolling pushes those away first and the house DRIFTS up before the sticky engages. For
  // the pinned models we mark the closest `.heroBanner` so its CSS pulls the sticky up (negative top
  // margin = the header's own height) — the house then holds from scroll 0 and only releases at the end.
  useEffect(() => {
    if (!pinned || typeof document === 'undefined') return undefined;
    const banner = gateRef.current?.closest('header');
    banner?.setAttribute('data-parallax-pinned', '');
    return () => banner?.removeAttribute('data-parallax-pinned');
  }, [pinned]);
  // The horizontal pan offset: slide the scene track so the active scene is centred (cosmetic depth
  // layer BEHIND the facade; the door still carries the actual door↔scene flash).
  const panPct = model === 'horizontal' ? -(active * (100 / count)) : 0;

  const gate = (
    <Link
      ref={gateRef}
      data-hero-root
      data-scroll-model={requestedModel}
      data-effective-model={model}
      data-active-scene={active}
      data-active-dest={CHOOSER_CARDS[active].to}
      className={clsx(styles.studioGate, pinned && styles.parallaxSticky)}
      to={CHOOSER_CARDS[active].to}
      aria-label={stripEmoji(CHOOSER_CARDS[active].title)}
      onClick={() =>
        posthog.capture('hero card clicked', {
          hero_variant: `parallax-${requestedModel}`, // the assigned variant, not the mobile fallback
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
      {/* spinning = the user is scrolling → the board churns; on stop it settles to the title. */}
      <StudioFacade {...scene} spinning={scrolling} />
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

/* A neutral SKELETON shown while the A/B variant is resolving (and as the SSR/no-JS fallback). It
   doesn't commit to any arm. The DEFAULT hero is now the ANIMATION (timer) house in NORMAL flow (not
   the pinned spacer), so the skeleton reserves that house's natural height with a house-shaped pulse.
   No scrollbar jump when the real hero swaps in. (The parallax models, reached via override, manage
   their own spacer height; this default skeleton matches the timer house.) */
function ChooserSkeleton() {
  return (
    <div className={styles.heroSkeleton} aria-hidden="true">
      <div className={styles.heroSkeletonHouse}>
        <div className={styles.heroSkeletonRoof} />
        <div className={styles.heroSkeletonBody}>
          <div className={styles.heroSkeletonBoard} />
          <div className={styles.heroSkeletonDoor} />
        </div>
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

// The DEFAULT homepage hero when no experiment flag / override gives a signal (a bare visit to `/`):
// the ANIMATION-driven Lebanese HOUSE — the self-running timer (ChooserStudio via useTimerScene), NOT
// the scroll-driven parallax. So `localhost:3000/` cycles the house on its own clock (hold → flash →
// next), no scroll-jacking. The parallax scroll-models stay reachable + A/B-able via the override
// `?ab-homepage-hero-scroll=pin|inplace|horizontal`; the experiment overrides always win.
const DEFAULT_HERO = 'studio'; // anim default → the house
const DEFAULT_SCROLL_MODEL = 'static'; // scroll default → the self-running TIMER house (not parallax)

function HeroChooser() {
  // Two composed experiments: `anim` picks WHICH hero (scroll strip / flash gate / studio house /
  // boutique); `scroll` picks the scroll-MODEL, but only matters for the studio house (the parallax
  // pivot). Both must resolve before we render (else the skeleton holds, reserving height).
  const animVariant = useResolvedVariant(EXPERIMENTS['homepage-hero-anim']);
  const scrollVariant = useResolvedVariant(EXPERIMENTS['homepage-hero-scroll']);
  if (animVariant === null || scrollVariant === null) return <ChooserSkeleton />;

  // `control` with NO explicit URL force = the no-signal default → the pin house (not the old strip).
  // But an EXPLICIT `?ab-homepage-hero-anim=control` still renders the legacy scrolling strip (so it
  // stays reachable + testable). So: forced control → strip; unforced control → house default.
  const forcedAnim = urlOverride(EXPERIMENTS['homepage-hero-anim']);
  if (forcedAnim === 'control') return <ChooserStrip />;
  const anim = animVariant === 'control' ? DEFAULT_HERO : animVariant;

  // 4-way A/B/C/D on the anim experiment.
  if (anim === 'test' || anim === 'flash') return <ChooserFlash />;
  if (anim === 'variant_d' || anim === 'boutique') return <ChooserBoutique />;
  if (anim === 'variant_c' || anim === 'studio') {
    // The studio HOUSE: the scroll experiment decides the DRIVER. NO scroll signal (`control`) → the
    // DEFAULT (`static`) = the self-running TIMER house. An explicit pin/inplace/horizontal override
    // → the SCROLL-driven parallax. (Both go through the SAME progress model, just a different driver.)
    const scroll = scrollVariant === 'control' ? DEFAULT_SCROLL_MODEL : scrollVariant;
    if (scroll === 'pin') return <ParallaxStudio model="pin" />;
    if (scroll === 'inplace') return <ParallaxStudio model="inplace" />;
    if (scroll === 'horizontal') return <ParallaxStudio model="horizontal" />;
    return <ChooserStudio />; // `static` (the default) → the rAF-driven timer hero
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
