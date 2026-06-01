import React, { useEffect } from 'react';
import posthog from 'posthog-js';
// @ts-ignore - Docusaurus theme module
import Layout from '@theme/Layout';
import Card from '@site/src/components/Card';
import CardHeader from '@site/src/components/Card/CardHeader';
import CardBody from '@site/src/components/Card/CardBody';
import CardFooter from '@site/src/components/Card/CardFooter';
import { IdeaVote } from '@site/src/components/Vote/IdeaVote';
import { getAllIdeas } from '@site/src/components/Vote/ideasUtils';
import styles from './vote.module.css';

export default function VotePage() {
  useEffect(() => {
    posthog.capture('vote page viewed');
  }, []);

  // Ideas come from the generated data file (scripts/generate-ideas-data.js),
  // which scans the `ideas/` folder at build time — the same pipeline as the
  // changelog page.
  const ideas = getAllIdeas();

  return (
    <Layout
      title="Vote on Post Ideas"
      description="Tell me what to write next — vote on upcoming post ideas for the blog."
      noFooter={false}
    >
      <div className="container margin-vert--lg">
        <h1>Vote on Post Ideas</h1>
        <p>
          These are posts I'm considering writing. Vote for the ones you'd most
          like to read and I'll prioritize accordingly.
        </p>
        <p className={styles.signalNote}>
          <em>
            Votes are signal-only for now — clicking 👍 records your interest
            (no live tally is shown yet).
          </em>
        </p>

        <div className={styles.ideaGrid}>
          {ideas.map((idea) => (
            <Card key={idea.slug} shadow="md" className={styles.ideaCard}>
              <CardHeader>
                <h3 className={styles.ideaTitle}>{idea.title}</h3>
              </CardHeader>
              <CardBody>{idea.description}</CardBody>
              <CardFooter className={styles.ideaFooter}>
                <span className={styles.typeBadge}>{idea.type}</span>
                <IdeaVote idea={idea} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
