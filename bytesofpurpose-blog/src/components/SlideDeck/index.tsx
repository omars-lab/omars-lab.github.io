import React, {useEffect, useRef} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * SlideDeck — a reveal.js-backed slide deck you embed inside an MDX post.
 *
 * Why a component (not a global script / an iframe): reveal.js is heavy and
 * stateful, so it must only mount on the ONE page that uses it, and only in the
 * browser (Docusaurus server-renders every page — importing reveal.js at module
 * scope would crash the build on `window`). This wraps the whole thing in
 * <BrowserOnly> and lazy-imports reveal.js + its CSS on mount, so the rest of
 * the site never pays for it.
 *
 * Design system: the deck does NOT ship a reveal.js theme. `styles.module.css`
 * restyles the reveal surface from our OWN tokens (src/css/custom.css) — Fraunces
 * display + Geist body, the tea pastels as accent fills only, --ifm-color-primary
 * eyebrows, the deep-green (--ifm-color-primary-darkest) full-bleed slides. So the
 * deck reads as the same brand as the surrounding post, in both light and dark mode.
 *
 * Accessibility / print: reveal.js gives us keyboard nav (←/→, Space, Esc for the
 * overview grid), a speaker-notes view (press `S`), and PDF export (append
 * `?print-pdf` to the URL, then Print → Save as PDF — one slide per page). We pass
 * `transition: 'none'` when the user prefers reduced motion.
 *
 * Authoring: children are <Slide> elements. Each <Slide> becomes one reveal
 * `<section>`. Put ordinary MDX/JSX inside. See the design-system slide helpers
 * (<SlideEyebrow>, <SlideTitle>, <SlideLede>, <Pastels>) for on-brand primitives.
 */

export type SlideBg =
  | 'paper' // default light surface (--surface-page)
  | 'card' // slightly raised surface (--surface-card)
  | 'deep'; // full-bleed deep green (cover / CTA / section breaks)

export interface SlideProps {
  children: React.ReactNode;
  /** Slide background intent — maps to a design-system surface token. */
  bg?: SlideBg;
  /** Speaker notes for this slide (shown in reveal's notes view, press `S`). */
  notes?: string;
  /** Extra class on the reveal <section>. */
  className?: string;
  /** Vertical alignment of slide content. Defaults to centered. */
  align?: 'center' | 'start';
}

/**
 * One slide. Renders a reveal `<section>`; reveal.js collects the direct
 * `<section>` children of `.slides` as the deck. `notes` becomes an
 * `<aside class="notes">` reveal reads for the speaker view.
 */
export function Slide({
  children,
  bg = 'paper',
  notes,
  className,
  align = 'center',
}: SlideProps): JSX.Element {
  return (
    <section
      className={clsx(styles.slide, styles[`bg_${bg}`], styles[`align_${align}`], className)}
      data-background-color="transparent"
    >
      {children}
      {notes ? <aside className="notes">{notes}</aside> : null}
    </section>
  );
}

/** Uppercase tracked eyebrow — the editorial kicker above a slide title. */
export function SlideEyebrow({children}: {children: React.ReactNode}): JSX.Element {
  return <div className={styles.eyebrow}>{children}</div>;
}

/** Fraunces display title. */
export function SlideTitle({
  children,
  size = 'md',
}: {
  children: React.ReactNode;
  /** `xl` for cover/CTA, `md` for content slides. */
  size?: 'xl' | 'md';
}): JSX.Element {
  return <h2 className={clsx(styles.title, styles[`title_${size}`])}>{children}</h2>;
}

/**
 * Lead paragraph under a title (secondary-ink, comfortable measure). Renders a
 * <div>, not a <p>: MDX wraps multi-line child text in its own <p>, and a <p>
 * inside a <p> is invalid HTML (a hydration error). A block <div> styled as a
 * paragraph nests cleanly.
 */
export function SlideLede({children}: {children: React.ReactNode}): JSX.Element {
  return <div className={styles.lede}>{children}</div>;
}

export interface Pillar {
  img: string;
  title: string;
  body: string;
}

/** Three-up card grid of illustrated pillars (slide 3 layout). */
export function PillarGrid({items}: {items: Pillar[]}): JSX.Element {
  return (
    <div className={styles.pillarGrid}>
      {items.map((p) => (
        <figure key={p.title} className={styles.pillar}>
          <div className={styles.pillarArt}>
            <img src={p.img} alt={p.title} />
          </div>
          <figcaption>
            <h3 className={styles.pillarTitle}>{p.title}</h3>
            <p className={styles.pillarBody}>{p.body}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export interface FormatRow {
  icon: string;
  title: string;
  kicker: string;
  body: string;
}

/** Stacked icon + label + body rows (slide 4 layout). */
export function FormatList({items}: {items: FormatRow[]}): JSX.Element {
  return (
    <div className={styles.formatList}>
      {items.map((r) => (
        <div key={r.title} className={styles.formatRow}>
          <div className={styles.formatIcon}>
            <img src={r.icon} alt="" />
          </div>
          <div className={styles.formatLabel}>
            <h3 className={styles.pillarTitle}>{r.title}</h3>
            <div className={styles.formatKicker}>{r.kicker}</div>
          </div>
          <p className={styles.formatBody}>{r.body}</p>
        </div>
      ))}
    </div>
  );
}

/** A row of pastel accent pills (accent fills only; --tea-ink is the only ink on them). */
export function Pastels({items}: {items: string[]}): JSX.Element {
  // Cycle the three brand pastels; discipline: pastels are fills, never text color.
  const tones = ['pink', 'mint', 'green'] as const;
  return (
    <div className={styles.pastels}>
      {items.map((label, i) => (
        <span key={label} className={clsx(styles.pastel, styles[`pastel_${tones[i % tones.length]}`])}>
          {label}
        </span>
      ))}
    </div>
  );
}

export interface SlideDeckProps {
  children: React.ReactNode;
  /** Design aspect. reveal scales the fixed canvas to fit. Defaults to 16:9. */
  width?: number;
  height?: number;
}

function SlideDeckImpl({children, width = 1280, height = 720}: SlideDeckProps): JSX.Element {
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let reveal: any;

    (async () => {
      // Lazy-load reveal.js core + its base layout CSS only now (browser only).
      // Subpaths must match reveal's `exports` map: bare `reveal.js` (→ reveal.mjs),
      // `reveal.js/plugin/notes` (→ notes.mjs), and `reveal.js/reveal.css` (the map
      // exposes `./reveal.css`, NOT `./dist/reveal.css`).
      const [{default: Reveal}, {default: Notes}] = await Promise.all([
        import('reveal.js'),
        import('reveal.js/plugin/notes'),
      ]);
      // reveal's own reset + layout CSS. Our styles.module.css themes on top.
      await import('reveal.js/reveal.css');

      if (cancelled || !deckRef.current) return;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      reveal = new Reveal(deckRef.current, {
        // Scoped to this element (not the whole page) so multiple decks / the
        // surrounding post are unaffected.
        embedded: true,
        width,
        height,
        margin: 0.04,
        controls: true,
        progress: true,
        hash: false,
        // Keep keyboard nav local to the deck when it's focused, not global.
        keyboardCondition: 'focused',
        transition: prefersReducedMotion ? 'none' : 'slide',
        plugins: [Notes],
      });
      await reveal.initialize();
      revealRef.current = reveal;
    })();

    return () => {
      cancelled = true;
      try {
        revealRef.current?.destroy();
      } catch {
        /* reveal throws if already torn down; ignore */
      }
      revealRef.current = null;
    };
  }, [width, height]);

  return (
    <div className={styles.deckFrame}>
      <div className={clsx('reveal', styles.reveal)} ref={deckRef} tabIndex={-1}>
        <div className="slides">{children}</div>
      </div>
      <p className={styles.hint}>
        Use ← / → to move, <kbd>F</kbd> for fullscreen, <kbd>S</kbd> for speaker notes, <kbd>Esc</kbd>{' '}
        for the slide grid.
      </p>
    </div>
  );
}

/**
 * Public entry. BrowserOnly guarantees reveal.js never runs during SSR; the
 * fallback is a lightweight placeholder so the post still has layout height
 * before hydration.
 */
export default function SlideDeck(props: SlideDeckProps): JSX.Element {
  return (
    <BrowserOnly fallback={<div className={styles.deckFallback} aria-hidden />}>
      {() => <SlideDeckImpl {...props} />}
    </BrowserOnly>
  );
}
