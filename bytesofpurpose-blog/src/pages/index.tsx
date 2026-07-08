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
import {HERO_SCENE_PARAM, HERO_PROGRESS_PARAM} from '../lib/url-params';

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
  const reduce = useReducedMotion();
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
  // (which changes `active`) resets the countdown instead of double-firing right after. Under
  // prefers-reduced-motion we never arm the interval, so the hero holds on its first card (the arrows
  // still let a reduced-motion user step through scenes by choice).
  useEffect(() => {
    if (paused || reduce) return undefined;
    const tick = window.setInterval(() => step(1), FLASH_INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, [paused, reduce, active, step]);

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
  const reduce = useReducedMotion();

  const step = useCallback((delta: number) => {
    setActive((i) => (i + delta + CHOOSER_CARDS.length) % CHOOSER_CARDS.length);
  }, []);

  // Auto-cycle the storefront scenes — but never under prefers-reduced-motion (the gate holds on the
  // first scene; the arrow keys still let a reduced-motion user step through by choice).
  useEffect(() => {
    if (paused || reduce) return undefined;
    const tick = window.setInterval(() => step(1), BOUTIQUE_INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, [paused, reduce, active, step]);

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
// The WIDEST board message across the whole journey (every scene title + the door's WELCOME). The
// pickets board centers EVERY message on this one width (SplitFlap `anchorWidth`) so each scene sits in
// the SAME columns in every crossing. Without it, each title is centered on its own width, so a scene's
// letters SLIDE sideways when you scroll from one crossing into the next (they re-center to a different
// pair's max width) instead of flipping in place. Computed from the titles so it can never drift.
const STUDIO_BOARD_ANCHOR_WIDTH = Math.max(
  'WELCOME'.length,
  ...CHOOSER_CARDS.map((c) => stripEmoji(c.title).length),
);
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

// Reactive companion to the one-shot prefersReducedMotion() read: returns the current
// reduced-motion preference AND re-renders when the OS setting is toggled at runtime, so the
// auto-advancing chooser heroes can STOP cycling the moment the user asks for no motion. SSR-safe
// (false until mounted). The auto-rotate effects gate on this so the timer/interval never arms
// under reduce — the scene pins to its first card instead of cross-fading forever.
function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduce;
}

// ── TEMP PERF DEBUG (localhost + ?hero-perf=1): count renders/scroll-events/frames and log once a
// second so we can see WHERE the pickets scroll lag comes from in the console. Zero-cost when off. ─────
function heroPerfOn(): boolean {
  if (typeof window === 'undefined' || !isLocalhost()) return false;
  return new URLSearchParams(window.location.search).get('hero-perf') === '1';
}
const HERO_PERF: {
  on: boolean;
  facadeRenders: number;
  parallaxRenders: number;
  scrollEvents: number;
  rawTicks: number;
  started: boolean;
  lastFrameStart: number; // performance.now() at the last rAF, to time the frame that FOLLOWS an event
} = {on: false, facadeRenders: 0, parallaxRenders: 0, scrollEvents: 0, rawTicks: 0, started: false, lastFrameStart: 0};
function heroPerfBump(k: 'facadeRenders' | 'parallaxRenders' | 'scrollEvents' | 'rawTicks') {
  if (!HERO_PERF.on) return;
  HERO_PERF[k]++;
}
// Log a discrete lifecycle EVENT with a timestamp, so we can line up WHEN the lag hits vs what happened
// (scroll started/stopped, a picket crossing entered/exited, the board settled). No-op when off.
function heroPerfEvent(label: string, extra?: string) {
  if (!HERO_PERF.on) return;
  const t = (performance.now() / 1000).toFixed(3);
  // eslint-disable-next-line no-console
  console.log(`[hero-perf @${t}s] ${label}${extra ? ' ' + extra : ''}`);
}
function heroPerfStart() {
  if (HERO_PERF.started || typeof window === 'undefined') return;
  HERO_PERF.on = heroPerfOn();
  if (!HERO_PERF.on) return;
  HERO_PERF.started = true;
  heroPerfEvent('perf logging ON', '(fps sampled each second; events timestamped as they happen)');
  // frame timing via rAF gaps
  let last = performance.now();
  let frames = 0;
  let overBudget = 0;
  let worstFrame = 0;
  let worstFrameAt = 0;
  const tick = (now: number) => {
    const d = now - last;
    last = now;
    HERO_PERF.lastFrameStart = now;
    frames++;
    if (d > 20) overBudget++;
    if (d > worstFrame) {
      worstFrame = d;
      worstFrameAt = now;
    }
    // Flag a SEVERE hitch immediately with context (which is the lag the user feels), not just in the
    // 1s summary — so we can see exactly when a long frame lands relative to the lifecycle events.
    if (d > 50) {
      // eslint-disable-next-line no-console
      console.warn(
        `[hero-perf @${(now / 1000).toFixed(3)}s] HITCH ${d.toFixed(1)}ms frame | ` +
          `since last sec: renders(P=${HERO_PERF.parallaxRenders} F=${HERO_PERF.facadeRenders}) ` +
          `scroll=${HERO_PERF.scrollEvents} raw=${HERO_PERF.rawTicks}`,
      );
    }
    window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
  window.setInterval(() => {
    // eslint-disable-next-line no-console
    console.log(
      `[hero-perf] fps~${frames} overBudgetFrames=${overBudget} worstFrame=${worstFrame.toFixed(1)}ms@${(worstFrameAt / 1000).toFixed(3)}s | ` +
        `scrollEvents=${HERO_PERF.scrollEvents} rawTicks=${HERO_PERF.rawTicks} | ` +
        `ParallaxStudio renders=${HERO_PERF.parallaxRenders} StudioFacade renders=${HERO_PERF.facadeRenders}`,
    );
    frames = 0;
    overBudget = 0;
    worstFrame = 0;
    worstFrameAt = 0;
    HERO_PERF.scrollEvents = 0;
    HERO_PERF.rawTicks = 0;
    HERO_PERF.parallaxRenders = 0;
    HERO_PERF.facadeRenders = 0;
  }, 1000);
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

// TEST/QA seam: `?hero-progress=P` PINS the engine's raw progress p in [0,1], bypassing scroll AND the
// pickets smoothing, so ANY state is deterministically FROZEN — crucially a specific pickets crossing
// PHASE (a mid-wave frame), which `?hero-scene=N` (settled scenes only) cannot express. Localhost-only
// (same gate as the ab- overrides + hero-scene) so production ignores it. Registered as `hero-progress`
// in the URL-param registry (src/lib/url-params.ts). When set it wins over hero-scene.
function forcedProgress(): number | null {
  if (!isLocalhost()) return null;
  const raw = new URLSearchParams(window.location.search).get(HERO_PROGRESS_PARAM);
  if (raw == null) return null;
  const p = Number.parseFloat(raw);
  if (!Number.isFinite(p)) return null;
  return Math.min(1, Math.max(0, p)); // clamp to [0,1]
}

type SceneState = {
  active: number; // the scene currently CENTERED (the one the gate links to / commits)
  shown: number; // the scene the DOOR currently shows (swaps to `active` at the flash peak)
  mode: 'door' | 'scene';
  flash: number; // CONTINUOUS flash opacity [0,1], driven by scroll position (0 = no flash)
  boardProgress: number; // CONTINUOUS board flip-progress [0,1] for the transition in flight
  boardFromText: string; // the board text flipping FROM (e.g. 'WELCOME' or a scene title)
  boardToText: string; // the board text flipping TO
  // The CROSSING in flight, exposed for the PICKET renderer (null when settled on a stop). `t` is the
  // raw transition phase [0,1] (same `t` that drives `flash`); `fromDoor` means we are leaving the door.
  // The single flash consumers (pin/timer house) ignore this; the picket renderer reads it to build the
  // per-strip wave. Non-picket paths behave identically whether this is null or populated.
  transition: null | {t: number; fromScene: number; toScene: number; fromDoor: boolean};
};

// The fraction of each scene's slice spent in the TRANSITION zone (the rest is "settled on this
// scene"). 0.5 ⇒ the back half of every slice is the crossing to the next scene. Larger = longer, more
// gradual transitions; smaller = the scene holds longer then a quicker cross.
const TRANSITION_FRACTION = 0.5;
// PICKETS gives the crossing MORE of each slice (with a ~30% settled dwell so each scene still gets a
// legible rest). Combined with the taller pickets spacer (PICKET_SCENE_VH), this is the wave's scroll
// RUNWAY: at 0.5 x 0.85vh-per-scene a whole crossing was ~250px of scroll, so one trackpad nudge
// teleported past it (skipped pickets, jumped a scene). 0.7 x 1.5vh-per-scene makes a crossing ~650px,
// long enough that a slow scroll really scrubs it picket by picket.
const PICKET_TRANSITION_FRACTION = 0.7;

// ── ONE progress-driven model, TWO interchangeable drivers ───────────────────────────────────────
// Every animatable hero piece (the flash bloom, the door↔scene swap, the board flip) is a pure
// function of ONE normalized progress value p in [0,1] across all `count` scenes (deriveSceneState).
// That progress is supplied by either driver, and the components never know which:
//   • SCROLL driver  (useScrollScene): p = f(scroll position) — scrubbable, FREEZES when you stop.
//   • TIME driver    (useTimerScene):  p ramps on a rAF clock — self-running (the non-parallax hero).
// So the SAME visuals work "on scroll OR on animation" with no per-component special-casing.

/** PURE: map a single progress p∈[0,1] (across `count` scenes) to the full visual SceneState.
 * `transitionFraction` is the share of each slice spent crossing (pin keeps the 0.5 default;
 * pickets passes PICKET_TRANSITION_FRACTION for its longer runway). */
function deriveSceneState(
  p: number,
  count: number,
  reduce: boolean,
  transitionFraction: number = TRANSITION_FRACTION,
): SceneState {
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

  const settledFrac = 1 - transitionFraction;
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
      transition: null, // settled: no crossing in flight
    };
  }
  // TRANSITION zone stop s → nextStop. t ramps 0..1 across the back transitionFraction of the slice.
  const t = (within - settledFrac) / transitionFraction;
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
    // the crossing in flight, for the picket renderer (the single-flash consumers ignore it)
    transition: {t, fromScene, toScene, fromDoor},
  };
}

// ── PICKETS: a scrubbable per-strip flash wave (the "pin-with-pickets" scroll model) ───────────────
// The single flash blooms the WHOLE arch at once; the PICKET wave divides the arch into vertical strips
// and staggers the SAME sin-hump across them left→right. As you scroll into a crossing, the LEFT strip
// lights first, the wave sweeps right until the whole arch is lit (a bell of intensity across strips),
// then the left strips dim first, revealing the NEW scene strip-by-strip. It is a PURE function of the
// transition phase `t`, so scrolling back reverses it exactly (no snap, every position is stable).
const PICKET_COUNT = 9; // odd, so a centre strip peaks at the mid of the crossing
// How far the strips' peaks are SPREAD across the crossing (0 = all peak together = a single flash;
// larger = a narrower bright BAND that visibly TRAVELS across, only a few strips lit at once). At 0.5 the
// peaks bunched in the middle third so the whole door bloomed white with little visible motion; 2.5
// spreads them so it reads as a wave sweeping strip-by-strip.
const PICKET_SPREAD = 2.5;
// (The pickets board carries NO settle/scramble machinery of its own any more: it renders in
// SplitFlap's SWEEP mode, a pure function of the crossing phase, in lockstep with the wave. See
// StudioFacade's board wiring.)

// The board's SETTLED text for a (mode, shown scene): WELCOME at the door, else the scene's title.
function boardTextForScene(mode: 'door' | 'scene', shown: number): string {
  return mode === 'door' ? 'WELCOME' : stripEmoji(CHOOSER_CARDS[shown].title);
}

/** PURE: per-strip {flash, revealed} for a crossing at phase `t`, plus the reveal INSET (right %).
 *  `local_i` is strip i's own phase, staggered so lower i (left) leads; `flash_i = sin(π·local_i)`;
 *  a strip has flipped to the NEW scene once its own phase passes the peak (`local_i >= 0.5`). Because
 *  `local_i` is monotone in i, the revealed strips are always a CONTIGUOUS LEFT block, so the new scene
 *  needs ONE clip-path inset (revealRight %) rather than N separate slices. */
function picketStates(
  t: number,
  n: number,
  spread: number,
  reduce: boolean,
): {flash: number[]; revealRight: number} {
  const flash: number[] = [];
  let revealed = 0;
  for (let i = 0; i < n; i++) {
    // strip i's own timeline: the whole wave spans (1 + spread); strip i starts `frac·spread` later.
    const frac = n > 1 ? i / (n - 1) : 0;
    const local = Math.min(1, Math.max(0, t * (1 + spread) - frac * spread));
    flash.push(reduce ? 0 : Math.sin(Math.PI * local));
    if (local >= 0.5) revealed++; // this strip now shows the NEW scene
  }
  // reveal is a contiguous left block of `revealed` strips → clip the new image to hide the right rest.
  const revealRight = 100 * (1 - revealed / n);
  return {flash, revealRight};
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
  transitionFraction: number = TRANSITION_FRACTION,
): SceneState {
  const reduce = prefersReducedMotion();
  const forced = forcedScene(count); // TEST seam: ?hero-scene=N pins the scene (localhost only)
  const forcedProg = forcedProgress(); // TEST seam: ?hero-progress=P pins raw progress (wins over scene)
  return useMemo<SceneState>(() => {
    // ?hero-progress=P wins: derive from that EXACT progress, so a specific crossing PHASE (mid-wave)
    // is frozen deterministically — the picket renderer sees the real `transition` for that p.
    if (forcedProg != null) return deriveSceneState(forcedProg, count, reduce, transitionFraction);
    if (forced != null) {
      return {active: forced, shown: forced, mode: 'scene', flash: 0, boardProgress: 1, boardFromText: stripEmoji(CHOOSER_CARDS[forced].title), boardToText: stripEmoji(CHOOSER_CARDS[forced].title), transition: null};
    }
    return deriveSceneState(progressRef.current, count, reduce, transitionFraction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTick, count, reduce, forced, forcedProg, transitionFraction]);
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
    transition: null, // the timer house never renders pickets
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
      transition: null, // the timer house uses the single flash, never the picket wave
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
  const reduce = useReducedMotion();
  const SETTLE_MS = STUDIO_INTERVAL_MS; // hold on a step
  const CROSS_MS = STUDIO_FLASH_MS + STUDIO_FLASH_HOLD_MS; // the crossing (flash) to the next step
  const perStep = SETTLE_MS + CROSS_MS;
  const [scene, setScene] = useState<SceneState>(() => timerScene(0, count, perStep, SETTLE_MS, CROSS_MS, reduce));
  // accumulated elapsed ms (persists across pause/resume); advanced each frame by the real delta.
  const elapsedRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    // prefers-reduced-motion: never start the rAF clock. The scene stays pinned (settled, no flash,
    // no cross-fade) on whatever step it is on — on first mount that is scene 0. This is the P0 fix:
    // previously `reduce` only zeroed the flash while the clock kept advancing the scene forever.
    if (paused || reduce) {
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
  }, [paused, reduce, count, perStep, SETTLE_MS, CROSS_MS]);

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
  directionRef?: React.MutableRefObject<number>,
): {tick: number; scrolling: boolean} {
  const [tick, setTick] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    let raf = 0;
    let pending = false;
    let idle = 0; // timer that flips `scrolling` back to false after a short pause
    let lastY = window.scrollY; // for the scroll DIRECTION (so the snap can go WITH your momentum)
    // recompute the progress fraction (without touching the `scrolling` flag — used by the mount init).
    const recompute = () => {
      if (pending) return;
      pending = true;
      raf = window.requestAnimationFrame(() => {
        pending = false;
        const next = compute();
        if (next !== progressRef.current) {
          progressRef.current = next;
          heroPerfBump('rawTicks');
          setTick((t) => (t + 1) % 1_000_000);
        }
      });
    };
    let scrollingNow = false; // local mirror so we can log the true→false / false→true EDGES
    const onScroll = () => {
      heroPerfBump('scrollEvents');
      // a REAL scroll event: mark scrolling true + reset the idle timer that settles it back to false.
      // (NOT called on mount, so the board starts at rest showing WELCOME rather than churning.)
      // Also record the DIRECTION of this scroll (down = +1, up = -1) so the snap glides WITH the user's
      // momentum instead of ever pulling them back against the way they were scrolling.
      const y = window.scrollY;
      if (directionRef && y !== lastY) directionRef.current = y > lastY ? 1 : -1;
      lastY = y;
      if (!scrollingNow) {
        scrollingNow = true;
        heroPerfEvent('SCROLL START', `y=${Math.round(y)}`);
      }
      setScrolling(true);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        setScrolling(false);
        scrollingNow = false;
        heroPerfEvent('SCROLL STOP', `y=${Math.round(window.scrollY)}`);
      }, 140); // ~140ms of no scroll = "stopped"
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

/**
 * CATCH-UP display progress (pickets only): eases a DISPLAYED progress toward the raw scroll progress
 * so the renderer sweeps THROUGH every intermediate state instead of teleporting. Scroll input is
 * quantized and inertial: a trackpad flick moves hundreds of px BETWEEN two animation frames, so a
 * pure f(rawScroll) renderer skips pickets and whole crossings no matter how fast it renders. This
 * hook closes that gap with a short exponential ease (TAU below) PLUS a minimum close-rate so a huge
 * flick still lands within ~CATCHUP_MAX_S seconds (it sweeps fast, it never crawls).
 *
 * The TWO prior failure modes this threads between (both shipped, both wrong):
 *   • long smoothing (tau 0.12s on 400ms+ thrash frames) → the wave TRAILED: "moves only after I stop"
 *   • raw tracking → the wave TELEPORTED: "a nudge jumps to the next scene"
 * Short tau + min close-rate + healthy frame times = liquid AND live.
 *
 * Rules: NEVER writes to scroll (read-only display easing, no scroll-jack). Disabled (raw passthrough)
 * for reduced motion and for the ?hero-progress freeze seam.
 *
 * LIFECYCLE: a SINGLE always-on rAF loop runs for as long as the hook is `enabled` (pickets active).
 * Every frame it eases `displayRef` toward `progressRef` and, when they differ, bumps `displayTick` to
 * re-render. When they are equal the frame is a cheap no-op. This is deliberately NOT a start-on-input /
 * stop-on-converge loop: that earlier design had a RACE — the loop self-terminated inside a rAF
 * callback (`runningRef=false`), and if a scroll event had already bumped the input `tick` while that
 * final frame was in flight, the restart effect saw `runningRef` still true, returned early, and then
 * the loop stopped with no restart queued. So the display FROZE until the NEXT scroll event — which
 * during a slow, steady finger-drag (coalesced scroll events) read as "the pickets don't cycle until I
 * stop scrolling and lift my finger". An always-on loop cannot race: there is nothing to restart.
 */
const CATCHUP_TAU_S = 0.07; // exponential time constant: ~70ms lag feels liquid, not laggy
const CATCHUP_MAX_S = 0.3; // a small-to-medium gap fully closes within about this long (rate floor)
// Speed LIMIT on the displayed progress (progress-units/sec; the whole journey is 1.0). Without it a
// multi-crossing flick still closes in CATCHUP_MAX_S, sweeping so fast that only 2-3 frames of wave
// render: visually a teleport again. 0.5/s sweeps one crossing (~0.0875) in ~175ms — fast, but every
// picket and scene visibly passes (GSAP's numeric `scrub` is this same idea, typically 0.5s).
const CATCHUP_MAX_RATE = 0.5;
const CATCHUP_EPS = 0.0004; // treat the display as in-sync (no re-render) within this of the raw progress
function useCatchUpProgress(
  progressRef: React.MutableRefObject<number>,
  tick: number,
  enabled: boolean,
): {ref: React.MutableRefObject<number>; tick: number; active: boolean} {
  const displayRef = useRef(progressRef.current);
  const [displayTick, setDisplayTick] = useState(0);
  const [active, setActive] = useState(false);
  const rafRef = useRef(0);
  const activeRef = useRef(false); // mirrors `active` so the rAF loop only setState on a real edge

  useEffect(() => {
    if (!enabled) return undefined;
    // Start the display in sync so the first frames don't sweep from a stale position.
    displayRef.current = progressRef.current;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.max(0.001, (now - last) / 1000);
      last = now;
      const gap = progressRef.current - displayRef.current;
      if (Math.abs(gap) < CATCHUP_EPS) {
        // Converged: snap exact, mark inactive on the falling edge, and idle (no re-render this frame).
        if (displayRef.current !== progressRef.current) {
          displayRef.current = progressRef.current;
          setDisplayTick((t) => (t + 1) % 1_000_000);
        }
        if (activeRef.current) {
          activeRef.current = false;
          setActive(false);
        }
      } else {
        // exponential ease toward the raw progress, floored by the min close-rate so medium gaps close
        // within ~CATCHUP_MAX_S, then SPEED-CAPPED so a huge flick still SWEEPS visibly (never teleports)
        const ease = 1 - Math.exp(-dt / CATCHUP_TAU_S);
        const floor = Math.min(1, dt / CATCHUP_MAX_S);
        const desired = gap * Math.max(ease, floor);
        const capped = Math.sign(desired) * Math.min(Math.abs(desired), CATCHUP_MAX_RATE * dt);
        displayRef.current += capped;
        setDisplayTick((t) => (t + 1) % 1_000_000);
        if (!activeRef.current) {
          activeRef.current = true;
          setActive(true);
        }
      }
      rafRef.current = window.requestAnimationFrame(step);
    };
    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(rafRef.current);
      activeRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled) return {ref: progressRef, tick, active: false};
  return {ref: displayRef, tick: displayTick, active};
}

/* FESTOON STRING LIGHTS: the scene-progress indicator. A swag of bulbs strung under the eave, one per
   destination scene, warming up LEFT-TO-RIGHT as you advance through the scenes (a Lebanese courtyard
   string-light motif, not a UI progress bar). Bulb `i` is LIT once `active >= i`. When `onJump` is
   given (the scroll models), each bulb is a real <button> that scrolls to that scene; without it (the
   timer house) the bulbs are a plain read-only indicator. The swag CORD is a single SVG catenary curve
   the bulbs hang from. Reduced motion is handled in CSS (no glow pulse). */
// MEMOIZED: the festoon rebuilds an SVG catenary path + all its bulbs on every render, but its inputs
// (litCount/active/onJump) only change per SCENE, not per scroll frame. Without memo the pickets model
// (which re-renders StudioFacade every smoothed-progress frame) would rebuild the whole festoon ~60×/s,
// a big chunk of the scroll-lag cost. React.memo skips the rebuild unless a prop actually changes.
const StudioFestoon = React.memo(function StudioFestoon({
  litCount,
  active,
  onJump,
}: {
  /** How many bulbs are lit (0 at the WELCOME door; scene i reached => i+1 lit). */
  litCount: number;
  /** The current scene index (for the aria-current "you are here" marker). */
  active: number;
  onJump?: (scene: number) => void;
}): React.JSX.Element {
  const count = CHOOSER_CARDS.length;
  // The bulbs hang along a shallow catenary (a dipping swag). We place `count` bulbs evenly across the
  // width and drop each onto the curve; the cord is one SVG path through the same points.
  const xs = Array.from({length: count}, (_, i) => (100 * (i + 0.5)) / count); // % across the width
  // The CORD droops in scallops between pins: it sags between each pair of bulbs and lifts at each bulb,
  // like a real string of lights. `cordY` is where the cord passes THROUGH each bulb's pin (high in the
  // strip); the bulbs then hang a UNIFORM short drop BELOW that (bulbAt), so they form a neat even row
  // that stays high and clears the board hanging below, instead of a deep parabola that dips onto it.
  const cordY = (x: number) => {
    const t = (x - 50) / 50; // -1..1
    return 18 - 8 * t * t; // a gentle overall arch: 18 at centre, 10 at the ends (both near the top)
  };
  const bulbDrop = 12; // % of the strip: how far each bulb hangs below its cord pin (uniform)
  const bulbAt = (x: number) => cordY(x) + bulbDrop;
  // Build the cord as scallops: from the top-left anchor, sag between each pin, lifting at each bulb.
  const seg = xs
    .map((x, i) => {
      const prevX = i === 0 ? 0 : xs[i - 1];
      const midX = (prevX + x) / 2;
      const sag = Math.max(cordY(prevX), cordY(x)) + 7; // the low point of the droop between two pins
      return `Q ${midX.toFixed(1)},${sag.toFixed(1)} ${x.toFixed(1)},${cordY(x).toFixed(1)}`;
    })
    .join(' ');
  const lastX = xs[xs.length - 1];
  const cordPath = `M0,7 ${seg} Q ${((lastX + 100) / 2).toFixed(1)},${(cordY(lastX) + 7).toFixed(1)} 100,7`;
  return (
    <div className={styles.studioFestoon} aria-hidden={onJump ? undefined : true}>
      <svg
        className={styles.studioFestoonCord}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true">
        <path d={cordPath} />
      </svg>
      {xs.map((x, i) => {
        const lit = i < litCount; // 0 lit at the WELCOME door; N lit once you've reached scene N-1
        const title = stripEmoji(CHOOSER_CARDS[i].title);
        const style = {
          left: `${x}%`,
          top: `${bulbAt(x)}%`, // hang a uniform short drop below the cord pin (a neat even row)
          // stagger the (reduced-motion-gated) glow so the lit bulbs shimmer like a real string
          ['--bulb-delay' as string]: `${(i % 4) * 0.4}s`,
        } as React.CSSProperties;
        const cls = clsx(styles.studioBulb, lit && styles.studioBulbLit);
        return onJump ? (
          <button
            key={CHOOSER_CARDS[i].to}
            type="button"
            className={cls}
            style={style}
            aria-label={`Go to ${title}`}
            aria-current={active === i ? 'true' : undefined}
            onClick={(e) => {
              // The whole facade is inside the gate <Link>; a bulb click must NOT navigate, it JUMPS.
              e.preventDefault();
              e.stopPropagation();
              onJump(i);
            }}>
            <span className={styles.studioBulbGlass} aria-hidden="true" />
          </button>
        ) : (
          <span key={CHOOSER_CARDS[i].to} className={cls} style={style} aria-hidden="true">
            <span className={styles.studioBulbGlass} aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
});

/* PICKET WAVE overlay: the picket scroll-model's replacement for the single white flash. `PICKET_COUNT`
   vertical strips fill the arch; each strip's opacity is its own point on the staggered sin-wave (from
   picketStates), so the bloom sweeps left→right and back as you scrub. Masked to the arch + isolated,
   exactly like .studioFlash (NO mix-blend/filter, per the hi-DPI seam lesson); each strip is a hair
   WIDER than 1/N (+0.5px) so anti-aliasing paints no hairline seam between neighbours. Reduced motion
   zeroes every strip in CSS (matching .studioFlash). */
// The strips' left/width are CONSTANT (only opacity changes per frame), so precompute them once for the
// fixed PICKET_COUNT instead of rebuilding the strings every render.
const PICKET_GEOMETRY = Array.from({length: PICKET_COUNT}, (_, i) => ({
  left: `${(i / PICKET_COUNT) * 100}%`,
  width: `calc(${100 / PICKET_COUNT}% + 0.5px)`, // +0.5px overlap kills the hairline seam between strips
}));

function StudioPickets({flash}: {flash: number[]}): React.JSX.Element {
  return (
    <div className={styles.studioPickets} aria-hidden="true">
      {flash.map((o, i) => (
        <span
          key={i}
          className={styles.studioPicket}
          style={{
            left: PICKET_GEOMETRY[i].left,
            width: PICKET_GEOMETRY[i].width,
            opacity: o,
          }}
        />
      ))}
    </div>
  );
}

/* The presentational FACADE: the Lebanese central-hall home (roof + square body + three arches + the
   hanging Vestaboard + the centre door↔scene flash), driven purely by props. Both the original timer
   ChooserStudio and the scroll-driven parallax wrappers render this with their own {active, mode,
   flashing}, so the visual house is defined ONCE. The clickable <Link> + hover/keyboard behaviour and
   the data-hero-root / gateRef belong to the wrappers (they differ per scroll-model). */
function StudioFacade({
  active,
  shown,
  mode,
  flash,
  boardFromText,
  boardToText,
  boardProgress,
  transition,
  spinning,
  onJump,
  picketed,
}: SceneState & {
  spinning?: boolean;
  /** Only the scroll models pass this: jump to scene `i` (the festoon bulbs call it). */
  onJump?: (scene: number) => void;
  /** The `pickets` scroll-model: render the per-strip flash WAVE instead of the single door flash. */
  picketed?: boolean;
}): React.JSX.Element {
  heroPerfBump('facadeRenders');
  // On mobile the house is DOOR-ONLY (side windows hidden via CSS), so the board uses far fewer
  // columns to fit the narrow viewport; on desktop it stays wide (~3x the arch).
  const isMobile = useIsMobile();
  const boardCols = isMobile ? STUDIO_BOARD_COLS_MOBILE : STUDIO_BOARD_COLS;
  // BOARD <-> SCENE SYNC: the board's target text is the title of the scene the DOOR currently shows
  // (`shown`), or WELCOME in door mode, so the board can never settle to a title the door hasn't
  // reached. CHURN (`spinning`) is SCOPED to the flash TRANSITION only (the scroll wrapper passes
  // spinning only while mid-crossing): while crossing between scenes the board churns random letters,
  // and the moment it enters a scene's settled zone it snaps cleanly to that title (even if the wheel
  // is still moving). The TIMER house (spinning=undefined) does the clean per-cell flap-roll on a text
  // change. Each title is CENTERED on the (wider-than-the-title) board, so short titles sit dead-center
  // with blank flap tiles either side.
  // PICKETS is different: the board is SCRUBBED by the scroll (SplitFlap's SWEEP mode, below), a pure
  // function of the crossing phase — no churn, no settle roll, no scramble. A flip front tracks the
  // wave: columns behind it already show the NEXT title, columns ahead still show the text you came
  // from, and only the column the front is crossing flips. Stop mid-wave = the mixed board freezes;
  // scroll back = the letters revert. boardProgress (settled: 1, crossing: t) IS the front's position.
  const sceneTitle = boardTextForScene(mode, shown);
  const boardTarget = sceneTitle;
  const boardSpinning = picketed ? undefined : spinning;
  // Quantize the sweep front to the board's own column resolution so the (memoized) board only
  // re-renders when the front actually moves a step, not on every catch-up frame.
  const sweepQuantum = 2 * boardCols;
  const boardSweepProgress = picketed
    ? Math.round(boardProgress * sweepQuantum) / sweepQuantum
    : undefined;
  // Base-URL the scene + door images ONCE, at the top level, so hook count is constant across renders.
  // CHOOSER_CARDS has a fixed length, so this map is a fixed number of useBaseUrl calls; the picket
  // reveal layer reuses cardUrls[toScene] instead of calling useBaseUrl conditionally (which would
  // change the hook count between settled and crossing renders and crash React).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cardUrls = CHOOSER_CARDS.map((c) => useBaseUrl(c.img));
  const doorUrl = useBaseUrl('/img/cards/door.png');
  const windowUrl = useBaseUrl('/img/cards/window.png');
  // PICKET WAVE: only in the pickets model, mid-crossing. Build the per-strip flash + the reveal inset
  // that clips the NEW scene to a contiguous LEFT block. Outside a crossing (or any other model) this is
  // null and the single-flash / settled path renders exactly as before.
  const reduce = prefersReducedMotion();
  const wave =
    picketed && transition
      ? picketStates(transition.t, PICKET_COUNT, PICKET_SPREAD, reduce)
      : null;
  // the single flash opacity is CONTINUOUS (driven by scroll); expose it as a CSS var .studioFlash reads.
  // In picket mode the PICKETS are the flash, so the single-flash overlay is forced off (--flash-o 0).
  const flashStyle = {['--flash-o' as string]: String(wave ? 0 : flash)} as React.CSSProperties;
  return (
    <div className={styles.studioFacade}>
      {/* The TEAL triangular roof sits ABOVE the square body (a sibling, not inside it). */}
      <div className={styles.studioRoof} aria-hidden="true" />

      {/* The SQUARE terracotta house body: holds the festoon lights + the board + the three arches. */}
      <div className={styles.studioBody}>
        {/* FESTOON STRING LIGHTS = the scene-progress indicator. A swag of warm bulbs draped under the
            eave: one bulb per destination scene, lighting up LEFT-TO-RIGHT as you advance (bulb i is
            "on" once you've reached scene i). A Lebanese courtyard motif rather than a UI progress bar.
            Each bulb is a real <button> that JUMPS to its scene (scroll models only; the timer house
            has no runway, so it renders the bulbs as a plain read-only indicator with no onJump). */}
        <StudioFestoon
          litCount={mode === 'door' ? 0 : active + 1}
          active={active}
          onJump={onJump}
        />
        <div className={styles.studioRow}>
          {/* LEFT: the cleaned zellij WINDOW (static), with a GOLD balcony railing in front of it. */}
          <div className={styles.studioArch}>
            <img
              className={styles.studioArchImg}
              src={windowUrl}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
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
                    // PICKETS: the SWEEP mode — the board is scrubbed by the crossing phase, its flip
                    // front tracking the picket wave (boardFromText → boardToText). Other models keep
                    // the churn-while-crossing + snap-on-settle behavior (sweep props undefined).
                    text={picketed ? boardToText : boardTarget}
                    sweepFromText={picketed ? boardFromText : undefined}
                    sweepProgress={boardSweepProgress}
                    spinning={boardSpinning}
                    columns={boardCols}
                    rows={STUDIO_BOARD_ROWS}
                    settleMs={FLASH_SETTLE_MS}
                    // PICKETS: anchor every message to the widest title so scenes sit in fixed columns
                    // across crossings (no sideways slide on a scene change; letters flip in place).
                    anchorWidth={picketed ? STUDIO_BOARD_ANCHOR_WIDTH : undefined}
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
                masks the change. In the PICKET model a mid-crossing renders differently: the FROM
                content stays fully visible while the TO scene is revealed strip-by-strip under a
                staggered per-strip wave (see below), so no single peak-swap happens. */}
            <div className={styles.studioArch} style={flashStyle}>
              {/* the carved DOOR: shown in door mode, OR (picket crossing) whenever we are LEAVING the
                  door (it stays fully lit underneath while the first scene reveals over it). */}
              <img
                className={clsx(
                  styles.studioArchImg,
                  styles.studioDoorLayer,
                  (wave ? transition!.fromDoor : mode === 'door') && styles.studioLayerOn,
                )}
                src={doorUrl}
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width={400}
                height={400}
              />
              {/* the current project SCENE (shown when mode === 'scene'), clipped to the arch interior.
                  Normally we show `shown` (the scene the door displays; it swaps at the flash peak on a
                  scroll transition). In a PICKET crossing this is the FROM layer instead: it holds the
                  scene we are LEAVING fully visible (hidden when leaving the door), and the TO scene
                  reveals over it in the picket reveal layer below. */}
              <div
                className={clsx(
                  styles.studioDoorScene,
                  (wave ? !transition!.fromDoor : mode === 'scene') && styles.studioLayerOn,
                )}
                aria-hidden="true">
                {CHOOSER_CARDS.map((card, i) => (
                  <img
                    key={card.to}
                    className={clsx(
                      styles.studioPeekImg,
                      i === (wave ? transition!.fromScene : shown) && styles.studioPeekImgActive,
                    )}
                    src={cardUrls[i]}
                    alt=""
                    // The FIRST scene is above-the-fold on load (the door opens onto it); eager-load it
                    // so the arch isn't briefly empty. The other 6 scenes stay lazy (only the active one
                    // is ever visible, swapped via opacity).
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    width={400}
                    height={400}
                  />
                ))}
              </div>
              {/* PICKET REVEAL layer: the TO scene on top of FROM, clipped to a contiguous LEFT block
                  (inset from the right by revealRight%). As the wave sweeps right, more strips have
                  passed their peak, revealRight shrinks, and the new scene wipes in left-to-right. */}
              {wave && (
                <div
                  className={clsx(styles.studioDoorScene, styles.studioLayerOn)}
                  style={{clipPath: `inset(0 ${wave.revealRight}% 0 0)`}}
                  aria-hidden="true">
                  <img
                    className={clsx(styles.studioPeekImg, styles.studioPeekImgActive)}
                    src={cardUrls[transition!.toScene]}
                    alt=""
                    loading="eager"
                    decoding="async"
                    width={400}
                    height={400}
                  />
                </div>
              )}
              {/* the white flash bloom, masked to the arch; opacity is the CONTINUOUS --flash-o var.
                  Forced to 0 in picket mode (the picket wave IS the flash). */}
              <span className={styles.studioFlash} aria-hidden="true" />
              {/* the PICKET WAVE: per-strip flashes that sweep the arch (picket model, mid-crossing). */}
              {wave && <StudioPickets flash={wave.flash} />}
            </div>
          </div>

          {/* RIGHT: a second cleaned zellij WINDOW (static), mirroring the left window. The project
              peek now lives ONLY in the centre door (the door↔scene flash), so both side arches are
              decorative windows. */}
          <div className={styles.studioArch}>
            <img
              className={styles.studioArchImg}
              src={windowUrl}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
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
type ScrollModel = 'pin' | 'inplace' | 'horizontal' | 'pickets';
const SCENE_VH = 0.85; // each scene gets ~85vh of scroll in the pinned models (spacer = count * this)
// PICKETS: a much taller spacer, so each crossing spans real scroll distance (~650px, vs ~250px at
// 0.85). The wave is a pure function of scroll position, so its scrub fidelity IS its runway: too
// short and one inertial trackpad nudge jumps a whole crossing (skipped pickets, teleported scenes).
const PICKET_SCENE_VH = 1.5;
// Per-model engine knobs, picked once: the spacer height factor + the slice share spent crossing.
const sceneVhOf = (model: ScrollModel) => (model === 'pickets' ? PICKET_SCENE_VH : SCENE_VH);
const transitionFractionOf = (model: ScrollModel) =>
  model === 'pickets' ? PICKET_TRANSITION_FRACTION : TRANSITION_FRACTION;

function ParallaxStudio({model: requestedModel}: {model: ScrollModel}): React.JSX.Element {
  heroPerfBump('parallaxRenders');
  useEffect(() => heroPerfStart(), []);
  const count = CHOOSER_CARDS.length;
  const progressRef = useRef(0);
  const directionRef = useRef(1); // last scroll direction: +1 down, -1 up (so the snap goes WITH momentum)
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

  // PICKETS renders from a CATCH-UP display progress (useCatchUpProgress): the raw scroll is the
  // INPUT, but the displayed frame chases it through every intermediate state, so a flick sweeps
  // through each picket and scene instead of teleporting (see the hook's comment for the two failure
  // modes this threads between). Other models read the raw progress directly, as before.
  const reduce = useReducedMotion();
  const tf = transitionFractionOf(model);
  const {tick, scrolling} = useScrollProgress(compute, progressRef, directionRef);
  const catchUp = useCatchUpProgress(progressRef, tick, model === 'pickets' && !reduce);
  const scene = useScrollScene(catchUp.ref, count, catchUp.tick, tf);
  const {active} = scene;

  // PERF DEBUG: the engine's scroll GEOMETRY in px, once at mount. crossing = the scroll distance one
  // picket wave spans; picket = the distance one strip's own rise-and-fall spans. If these are small
  // (~250px crossing), a single trackpad nudge jumps a whole crossing and the wave cannot read.
  useEffect(() => {
    if (!HERO_PERF.on || !spacerRef.current) return;
    const rect = spacerRef.current.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const scrollable = Math.max(0, rect.height - vh);
    const slice = scrollable / (count + 1);
    const crossing = slice * tf;
    heroPerfEvent(
      'GEOMETRY',
      `scrollable=${Math.round(scrollable)}px slice=${Math.round(slice)}px ` +
        `crossing=${Math.round(crossing)}px picket=${Math.round(crossing / (1 + PICKET_SPREAD))}px`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PERF DEBUG: log the picket lifecycle EDGES (crossing enter/exit, scene commit) with timestamps, so
  // the console shows WHEN the lag hits relative to what the wave is doing. No-op when ?hero-perf is off.
  const prevInCrossingRef = useRef(false);
  const prevActiveRef = useRef(active);
  if (HERO_PERF.on) {
    const inCrossing = scene.transition != null;
    if (inCrossing !== prevInCrossingRef.current) {
      heroPerfEvent(
        inCrossing ? 'CROSSING ENTER' : 'CROSSING EXIT (settled)',
        `active=${active} shown=${scene.shown}`,
      );
      prevInCrossingRef.current = inCrossing;
    }
    if (active !== prevActiveRef.current) {
      heroPerfEvent('SCENE COMMIT', `active ${prevActiveRef.current}→${active}`);
      prevActiveRef.current = active;
    }
  }

  useNavbarSceneHighlight(active, gateRef);

  // SNAP-TO-CLOSEST-SCENE: when scrolling STOPS mid-transition, glide to the nearest stop's settled
  // centre so the door + flash + board all land on the SAME scene (no resting mid-crossing with the
  // flash lingering). Inplace has no spacer runway, so it's skipped; reduced-motion + ?hero-scene skip.
  //
  // Two hard invariants (both cost real bugs to learn):
  //   • RELEASED = UNTOUCHABLE. The snap only ever fires while the hero is PINNED (raw progress in
  //     [0,1)). Above the runway (raw < 0) or below it (raw >= 1) the hero is off-screen or released,
  //     so we must NEVER write scroll there. Clamping progress to [0,1] BEFORE this check is what let
  //     the old code read "past the runway" as "stopped mid-transition on the last scene" and yank the
  //     page ~2000px back UP into the hero after a fast flick to the bottom. Compute `raw` first, bail.
  //   • SNAP WITH YOUR MOMENTUM. When you stop mid-transition, the glide continues the DIRECTION you were
  //     scrolling: down → forward to the next scene, up → back to the current one. It never pulls you the
  //     opposite way you were going (an earlier "nearest settled centre" rule yanked a just-past-centre
  //     stop BACKWARD against a down-scroll). The door/board scrub to match the target as the glide eases.
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
    // PICKETS deliberately has NO snap: every scroll position is already a stable, legible picture (a
    // partial wave / partial reveal), so tidying a mid-crossing rest would fight the "stop anywhere,
    // scroll back" contract. inplace has no runway to snap within. Both bail here.
    if (scrolling || model === 'inplace' || model === 'pickets' || snapActive.current) return; // act only on a real STOP
    if (prefersReducedMotion() || forcedScene(count) != null) return;
    const el = spacerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const scrollable = rect.height - vh;
    if (scrollable <= 0) return;
    // RAW (unclamped) progress: <0 above the runway, >=1 released below it. Only snap while PINNED.
    const raw = -rect.top / scrollable;
    if (raw < 0 || raw >= 1) return; // hero not pinned → never touch scroll (kills the yank-back trap)
    const stops = count + 1;
    const p = Math.min(0.999999, Math.max(0, raw));
    const s = Math.floor(p * stops); // current stop (mirrors deriveSceneState)
    if (s >= stops - 1) return; // the LAST stop's whole slice is settled there (no transition to snap)
    const settledFrac = 1 - TRANSITION_FRACTION;
    const within = (p * stops) % 1;
    if (within < settledFrac) return; // already settled in this slice → no snap

    // SNAP WITH YOUR MOMENTUM, never against it. You're stopped in a TRANSITION zone (between two settled
    // scenes). The snap glides you to the nearest settled centre — but if it always chose "nearest", a
    // stop just past a settled centre would pull you BACKWARD, up against a down-scroll (the "it goes
    // backwards" bug). So we pick the target by the DIRECTION you were last scrolling: scrolling DOWN
    // lands you FORWARD on the next scene; scrolling UP lands you BACK on the current one. Either way the
    // glide continues the way you were already going, and the door/board scrub to match as it eases in.
    const goingDown = directionRef.current >= 0;
    const stop = goingDown ? s + 1 : s;
    const targetP = (stop + settledFrac / 2) / stops; // centre of that stop's settled zone
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

  // pickets uses the SAME pinned geometry as pin (sticky hero over a tall spacer); it only differs in
  // how a CROSSING is rendered (the per-strip wave vs the single flash) and in skipping the snap.
  const pinned = model === 'pin' || model === 'horizontal' || model === 'pickets';
  const picketed = model === 'pickets';

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

  // JUMP-TO-SCENE (the festoon bulbs): scroll to scene `i`'s settled centre. Scene `i` is stop `i+1`
  // (stop 0 is the door), so its settled centre is at progress (i + 1 + settledFrac/2)/stops of the
  // runway. We reuse the SAME rAF ease as the snap (a deliberate glide, abort on a genuine user scroll)
  // and point `directionRef` at the jump so the settle-snap agrees with the jump instead of fighting it.
  // Pinned models only (inplace has no runway to scroll within); reduced-motion jumps INSTANTLY.
  const jumpGenRef = useRef(0); // bumped per jump so a NEW jump cleanly supersedes an in-flight one
  const jumpToScene = useCallback(
    (i: number) => {
      const el = spacerRef.current;
      if (!el || !pinned) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const scrollable = rect.height - vh;
      if (scrollable <= 0) return;
      const stops = count + 1;
      const settledFrac = 1 - tf; // the MODEL's transition fraction (pickets crossings are longer)
      const targetP = (i + 1 + settledFrac / 2) / stops; // scene i => stop i+1, its settled centre
      const spacerTopPage = rect.top + window.scrollY;
      const targetY = Math.round(spacerTopPage + targetP * scrollable);
      directionRef.current = targetY >= window.scrollY ? 1 : -1; // glide + snap agree with the jump
      snapActive.current = false; // a jump supersedes any in-flight settle-snap
      const gen = (jumpGenRef.current += 1); // this jump's token; a newer jump invalidates it
      if (prefersReducedMotion()) {
        window.scrollTo(0, targetY); // no animation under reduced motion
        return;
      }
      let last = window.scrollY;
      const step = () => {
        if (jumpGenRef.current !== gen) return; // a newer jump took over → stop this loop
        if (Math.abs(window.scrollY - last) > 3) return; // a genuine user scroll → hand it back
        const cur = window.scrollY;
        if (Math.abs(targetY - cur) < 1) {
          window.scrollTo(0, targetY); // land exactly
          return;
        }
        window.scrollTo(0, cur + (targetY - cur) * 0.2); // ease 20%/frame, same feel as the snap
        last = window.scrollY;
        window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    },
    [count, pinned, tf],
  );

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
      {/* The BOARD, two behaviors by model (handled in StudioFacade):
          • pin/inplace/horizontal: churn random glyphs only while scrolling AND mid-crossing
            (boardFromText !== boardToText), snapping to the scene TITLE on settle.
          • PICKETS: NO churn: the board is SCRUBBED by the crossing phase (SplitFlap SWEEP mode):
            a flip front tracks the picket wave, letters left of it already show the next title,
            letters right of it still show the previous text, and only the column the front crosses
            flips. The facade wires boardFromText/boardToText/boardProgress straight through. */}
      <StudioFacade
        {...scene}
        spinning={picketed ? undefined : scrolling && scene.boardFromText !== scene.boardToText}
        onJump={pinned ? jumpToScene : undefined}
        picketed={picketed}
      />
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

  // pin / horizontal / pickets: a TALL spacer (count * per-model viewport-heights) holds a sticky
  // hero. Scrolling the spacer drives the scenes; when the spacer ends the hero releases and the page
  // scrolls on. Pickets uses a much taller spacer (PICKET_SCENE_VH): the wave's scrub fidelity is its
  // scroll runway.
  return (
    <div
      ref={spacerRef}
      className={styles.parallaxSpacer}
      style={{height: `${Math.round(count * sceneVhOf(model) * 100)}vh`}}>
      <div className={styles.parallaxStick}>{gate}</div>
    </div>
  );
}

/* A neutral SKELETON shown while the A/B variant is resolving (and as the SSR/no-JS fallback). It
   doesn't commit to any arm. The DEFAULT hero is the scroll-scrubbed PICKETS house, which mounts a
   TALL parallax spacer (a ~12-viewport scroll runway) with the house STICKY at the top. So the
   skeleton reserves the SAME pinned shape: a tall spacer (`heroSkeletonSpacer`, its height matching
   `count * PICKET_SCENE_VH` vh) with the house-pulse stuck to the top. Otherwise the document would
   jump from ~1 screen tall to ~12 the instant the real hero swaps in (a large CLS / scrollbar jump on
   every bare-/ load). An explicit override to a NON-pinned model (`?ab-homepage-hero-scroll=static`)
   over-reserves height for one paint, a far cheaper miss than under-reserving the pinned default. */
const SKELETON_SPACER_VH = Math.round(CHOOSER_CARDS.length * PICKET_SCENE_VH * 100);
function ChooserSkeleton() {
  return (
    <div
      className={styles.heroSkeletonSpacer}
      style={{height: `${SKELETON_SPACER_VH}vh`}}
      aria-hidden="true">
      <div className={styles.heroSkeletonStick}>
        <div className={styles.heroSkeleton}>
          <div className={styles.heroSkeletonHouse}>
            <div className={styles.heroSkeletonRoof} />
            <div className={styles.heroSkeletonBody}>
              <div className={styles.heroSkeletonBoard} />
              <div className={styles.heroSkeletonDoor} />
            </div>
          </div>
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
// the ANIMATION-driven Lebanese HOUSE, driven by the scroll-scrubbed PICKETS parallax. So a bare
// `localhost:3000/` PINS the house and lets the visitor scroll THROUGH the destinations (the picket
// wave reveals each scene strip-by-strip, the Vestaboard scrubs in lockstep). The self-running timer
// house + the other parallax models stay reachable + A/B-able via the override
// `?ab-homepage-hero-scroll=static|pin|inplace|horizontal`; the experiment overrides always win.
const DEFAULT_HERO = 'studio'; // anim default → the house
const DEFAULT_SCROLL_MODEL = 'pickets'; // scroll default → the scrubbable picket-wave parallax house

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
    // DEFAULT (`pickets`) = the scroll-scrubbed picket-wave parallax house. An explicit
    // static/pin/inplace/horizontal override picks another driver. (All go through the SAME progress
    // model, just a different driver.)
    const scroll = scrollVariant === 'control' ? DEFAULT_SCROLL_MODEL : scrollVariant;
    if (scroll === 'pin') return <ParallaxStudio model="pin" />;
    if (scroll === 'inplace') return <ParallaxStudio model="inplace" />;
    if (scroll === 'horizontal') return <ParallaxStudio model="horizontal" />;
    if (scroll === 'pickets') return <ParallaxStudio model="pickets" />;
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
