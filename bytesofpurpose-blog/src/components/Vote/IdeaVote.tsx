import React, { useState } from 'react';
import posthog from 'posthog-js';
import styles from '../../css/FancyButton.module.css';
import type { IdeaEntry } from './types';

interface IdeaVoteProps {
  idea: IdeaEntry;
}

/**
 * Vote control for a post idea. Mirrors src/components/VoteButton's
 * posthog.capture pattern, but fires the locked `idea_voted` signal with the
 * idea's identifying properties. Votes are signal-only in v1 — there is no
 * persistent count or backend; PostHog is the source of truth for demand.
 */
export const IdeaVote: React.FC<IdeaVoteProps> = ({ idea }) => {
  const [voted, setVoted] = useState(false);

  return (
    <button
      className={styles.FancyButton}
      disabled={voted}
      aria-pressed={voted}
      onClick={() => {
        posthog.capture('idea_voted', {
          idea_id: idea.id,
          idea_title: idea.title,
          type: idea.type,
          page_path: typeof window !== 'undefined' ? window.location.pathname : '/vote',
        });
        // eslint-disable-next-line no-console
        console.log('Thanks for voting!', idea.id);
        setVoted(true);
      }}
    >
      {voted ? '✓ Voted' : '👍 Vote'}
    </button>
  );
};

export default IdeaVote;
