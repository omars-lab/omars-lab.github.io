import React, { useEffect } from 'react';
import posthog from 'posthog-js';
// @ts-ignore - Docusaurus theme module
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { Quote } from '@omars-lab/blog-ui';
import '@omars-lab/blog-ui/style.css';
import styles from './mindset.module.css';

// A few featured quotes shown inline on the landing (the <Quote> pull-quote CX). The full,
// growing collection lives in the quote-set posts linked below; this page is the front door.
type Featured = {
  id: string;
  quote: string;
  source: string;
  cite?: string;
  reflection: string;
};

const FEATURED: Featured[] = [
  {
    id: 'habit',
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    source: 'Will Durant',
    cite: 'often attributed to Aristotle',
    reflection:
      'It reframed mastery as something I build in the small, unglamorous reps rather than chase in a single breakthrough. It is why I care more about the systems I keep than the bursts I manage.',
  },
  {
    id: 'obstacle',
    quote: 'The obstacle is the way.',
    source: 'Marcus Aurelius',
    cite: 'via Ryan Holiday',
    reflection:
      'The thing blocking me is usually the thing worth doing. When I notice resistance now I lean toward it instead of around it, because that friction tends to mark where the growth is.',
  },
];

// The quote-set collections this page surfaces. Each is a published quote-set post.
const COLLECTIONS: { title: string; blurb: string; to: string }[] = [
  {
    title: 'Quotes That Moved Me',
    blurb: 'The curated set: the few lines that rearranged how I think, each with a note on why.',
    to: '/initiatives/quotes-that-moved-me',
  },
  {
    title: 'Affirmations for the Inner Game',
    blurb: 'The raw deck I flip through when I need the right words: hundreds of lines, grouped by theme.',
    to: '/initiatives/affirmations-for-the-inner-game',
  },
];

export default function MindsetPage() {
  useEffect(() => {
    posthog.capture('mindset page viewed');
  }, []);

  return (
    <Layout
      title="My Mindset"
      description="The quotes that moved me, and my reflections on why: the ideas that shape how I think."
      noFooter={false}
    >
      <div className="container margin-vert--lg">
        <h1>🧠 My Mindset</h1>
        <p className={styles.intro}>
          The lines that actually moved me, with my own reflection on why they landed and how they
          shape the way I think. Less a list of clever quotes than a record of the ideas I keep
          coming back to.
        </p>

        <h2 className={styles.sectionTitle}>A few that stuck</h2>
        <div className={styles.featured}>
          {FEATURED.map((q) => (
            <Quote key={q.id} source={q.source} cite={q.cite} reflection={q.reflection}>
              {q.quote}
            </Quote>
          ))}
        </div>

        <h2 className={styles.sectionTitle}>The collections</h2>
        <div className={styles.collections}>
          {COLLECTIONS.map((c) => (
            <Link key={c.to} to={c.to} className={styles.collectionCard}>
              <span className={styles.collectionTitle}>{c.title}</span>
              <span className={styles.collectionBlurb}>{c.blurb}</span>
              <span className={styles.collectionArrow} aria-hidden="true">
                &#8250;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
