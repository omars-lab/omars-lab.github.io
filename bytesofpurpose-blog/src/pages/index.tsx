import React from 'react';
import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './index.module.css';
import HomepageFeatures from '../components/HomepageFeatures';
import LatestPosts from '../components/LatestPosts';

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
}: {
  card: (typeof CHOOSER_CARDS)[number];
  duplicate?: boolean;
}) {
  return (
    <Link
      className={styles.chooserCard}
      to={card.to}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}>
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

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <p className={styles.heroEyebrow}>Engineering · Faith · Craft</p>
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        {/* Film-strip chooser: the cards auto-scroll sideways in a seamless, infinite loop
            (a conveyor). We render the card list TWICE inside the moving track; the keyframe
            translates the track by exactly half its width (one full set), so when it resets the
            second copy is pixel-aligned with where the first started: no visible seam. The strip
            pauses on hover/focus (so a card is clickable), and prefers-reduced-motion users get a
            static, scrollable, wrapped grid instead (the CSS turns the animation off). The
            duplicate set is aria-hidden so screen readers and keyboard tab order see each card
            once. */}
        <div className={styles.chooserViewport}>
          <div className={styles.chooserTrack}>
            {CHOOSER_CARDS.map((card) => (
              <ChooserCard key={card.to} card={card} />
            ))}
            {/* Seamless-loop duplicate: identical flex children, just a11y/keyboard-hidden. */}
            {CHOOSER_CARDS.map((card) => (
              <ChooserCard key={`dup-${card.to}`} card={card} duplicate />
            ))}
          </div>
        </div>
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
