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
import {EXPERIMENTS, resolveVariant} from '../experiments';
import {applyHeroParams} from '../lib/hero-tuning';

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
const STUDIO_INTERVAL_MS = 12000; // time one project is shown before the inside cross-fades to the next

function ChooserStudio() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // ONE project change: advance `active`; the peek-inside cross-fades to the new project (CSS), and
  // the sign flips. No door machinery (a CSS-3D door read as fake, so it was dropped).
  const step = useCallback((delta: number) => {
    setActive((i) => (i + delta + CHOOSER_CARDS.length) % CHOOSER_CARDS.length);
  }, []);

  // Auto-rotate (paused on hover/focus); re-arms when `active` changes so a manual arrow nav resets
  // the countdown instead of double-firing.
  useEffect(() => {
    if (paused) return undefined;
    const tick = window.setInterval(() => step(1), STUDIO_INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, [paused, active, step]);

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
      {/* THE STUDIO FACADE: a Moroccan riad wall. A zellij tile CORNICE runs across the top; the wall
          is warm terracotta; the Vestaboard HANGS from a wall bracket on the LEFT; the arched WINDOW
          on the RIGHT is the scene art's own arch, set into the wall, giving a peek at the project. */}
      <div className={styles.studioFacade}>
        {/* The zellij mosaic cornice band across the top of the wall. */}
        <div className={styles.studioCornice} aria-hidden="true" />

        <div className={styles.studioRow}>
          {/* LEFT: the Vestaboard HANGING from a wall bracket (a mount bar + two chains), swaying
              gently. One persistent board (it flips, never re-mounts). */}
          <div className={styles.studioSignHanger}>
            <div className={styles.studioSignSwing}>
              <div className={styles.studioSign}>
                <SplitFlap
                  text={stripEmoji(CHOOSER_CARDS[active].title)}
                  columns={FLASH_BOARD_COLS}
                  rows={FLASH_BOARD_ROWS}
                  settleMs={FLASH_SETTLE_MS}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: the arched WINDOW set into the wall. The arch is the scene art's OWN: a fixed copy
              holds it still, and the cross-fading peek is clipped to that same arch via the
              white-interior mask. isolation:isolate contains any GPU layer so it can't seam on hi-DPI. */}
          <div className={styles.studioDoorway}>
            <img
              className={styles.studioDoorFixed}
              src={useBaseUrl(CHOOSER_CARDS[active].img)}
              alt={CHOOSER_CARDS[active].alt}
              loading="lazy"
              width={400}
              height={400}
            />
            <div className={styles.studioPeek} aria-hidden="true">
              {CHOOSER_CARDS.map((card, i) => (
                <img
                  key={card.to}
                  className={clsx(
                    styles.studioPeekImg,
                    i === active && styles.studioPeekImgActive,
                  )}
                  src={useBaseUrl(card.img)}
                  alt=""
                  loading="lazy"
                  width={400}
                  height={400}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
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

function HeroChooser() {
  const exp = EXPERIMENTS['homepage-hero-anim'];
  const [variant, setVariant] = useState<string | null>(null); // null = not resolved yet
  useEffect(() => {
    let settled = false;
    const set = (v: string) => {
      settled = true;
      setVariant(v);
    };
    const unsub = resolveVariant(exp, set);
    // Don't let a missing/slow PostHog strand us on the skeleton: fall back to control.
    const t = window.setTimeout(() => {
      if (!settled) setVariant('control');
    }, RESOLVE_TIMEOUT_MS);
    return () => {
      window.clearTimeout(t);
      if (typeof unsub === 'function') unsub();
    };
  }, [exp]);
  if (variant === null) return <ChooserSkeleton />;
  // 4-way A/B/C/D: test/flash → the camera-flash gate, variant_c/studio → the Moroccan creative-studio
  // scene, variant_d/boutique → the lit boutique storefront, else (control/scroll + fallback) → strip.
  if (variant === 'test' || variant === 'flash') return <ChooserFlash />;
  if (variant === 'variant_c' || variant === 'studio') return <ChooserStudio />;
  if (variant === 'variant_d' || variant === 'boutique') return <ChooserBoutique />;
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
