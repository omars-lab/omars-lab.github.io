import React, {useEffect, useState} from 'react';
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
import posthog from 'posthog-js';
import {EXPERIMENTS, resolveVariant} from '../experiments';

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
}: {
  card: (typeof CHOOSER_CARDS)[number];
  duplicate?: boolean;
  /** The hero animation the user saw when they clicked: the A/B conversion dimension. */
  variant?: string;
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
      <div className={styles.chooserCardTitle}>{card.title}</div>
      <p className={styles.chooserCardBody}>{card.body}</p>
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
const FLASH_INTERVAL_MS = 4000;

function ChooserFlash() {
  const [active, setActive] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const tick = window.setInterval(() => {
      // Fire the flash, then swap the active card at peak white (~half the flash), then clear.
      setFlashing(true);
      window.setTimeout(() => setActive((i) => (i + 1) % CHOOSER_CARDS.length), 320);
      window.setTimeout(() => setFlashing(false), 640);
    }, FLASH_INTERVAL_MS);
    return () => window.clearInterval(tick);
  }, [paused]);

  return (
    <div
      className={styles.flashViewport}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}>
      <div className={styles.flashStage}>
        {CHOOSER_CARDS.map((card, i) => (
          <div
            key={card.to}
            className={clsx(
              styles.flashSlide,
              i === active && styles.flashSlideActive,
            )}
            aria-hidden={i === active ? undefined : true}>
            <ChooserCard card={card} duplicate={i !== active} variant="flash" />
          </div>
        ))}
        {/* The white flash overlay: radiates from the arch center, opacity driven by `flashing`. */}
        <div
          className={clsx(styles.flash, flashing && styles.flashOn)}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/* Pick the hero animation by the A/B variant. SSR + no-PostHog default is the scrolling strip
   (control), so the page renders fully without JS and only the client swaps to the flash variant
   for users bucketed into `test`. */
function HeroChooser() {
  const exp = EXPERIMENTS['homepage-hero-anim'];
  const [variant, setVariant] = useState('control');
  useEffect(() => resolveVariant(exp, setVariant), [exp]);
  return variant === 'test' ? <ChooserFlash /> : <ChooserStrip />;
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
            scrolling strip, test = the camera-flash rotator. BrowserOnly so the flag read +
            timers run client-side only; the SSR fallback is the strip (control). */}
        <BrowserOnly fallback={<ChooserStrip />}>{() => <HeroChooser />}</BrowserOnly>
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
