import React, { useEffect } from 'react';
import posthog from 'posthog-js';
// @ts-ignore - Docusaurus theme module
import Layout from '@theme/Layout';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';
import styles from './mindset.module.css';

// Placeholder data. These are sample entries showing the intended format
// (a quote that moved me, its source, and my reflection on why). Real entries
// will replace these over time.
type Quote = {
  id: string;
  quote: string;
  source: string;
  reflection: string;
};

const QUOTES: Quote[] = [
  {
    id: 'sample-1',
    quote:
      'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    source: 'Will Durant (often attributed to Aristotle)',
    reflection:
      'It reframed mastery as something I build in the small, unglamorous reps rather than chase in a single breakthrough. It is why I care more about the systems I keep than the bursts I manage.',
  },
  {
    id: 'sample-2',
    quote: 'The obstacle is the way.',
    source: 'Marcus Aurelius (via Ryan Holiday)',
    reflection:
      'The thing blocking me is usually the thing worth doing. When I notice resistance now I lean toward it instead of around it, because that friction tends to mark where the growth is.',
  },
  {
    id: 'sample-3',
    quote:
      'If you want to go fast, go alone. If you want to go far, go together.',
    source: 'African proverb',
    reflection:
      'A quiet correction to my instinct to do everything myself. The work I am proudest of was slower because it was shared, and it lasted because of it.',
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
          A collection of quotes that have moved me, with my own reflections on
          why they landed and how they shape the way I think. Less a list of
          clever lines than a record of the ideas I keep coming back to.
        </p>
        <p className={styles.placeholderNote}>
          This page is just getting started. The entries below are samples that
          show the format; more (and more personal) ones are on the way.
        </p>

        <div className={styles.quoteGrid}>
          {QUOTES.map((q) => (
            <Card key={q.id} shadow="md" className={styles.quoteCard}>
              <CardHeader>
                <blockquote className={styles.quote}>{q.quote}</blockquote>
              </CardHeader>
              <CardBody>
                <p className={styles.source}>{q.source}</p>
              </CardBody>
              <CardFooter>
                <p className={styles.reflectionLabel}>Why it moved me</p>
                <p className={styles.reflection}>{q.reflection}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
