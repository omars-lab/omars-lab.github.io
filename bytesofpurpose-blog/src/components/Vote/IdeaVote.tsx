import React, { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import type { IdeaEntry } from './types';

interface IdeaVoteProps {
  idea: IdeaEntry;
}

// localStorage (NOT sessionStorage) so "already voted" survives tab close +
// browser restart — sessionStorage clears on tab close, which would let the
// same person re-vote from a new tab. This is a soft, per-device dedup; the
// authoritative demand signal is still the PostHog 'idea_voted' event.
const votedKey = (id: string) => `idea-voted:${id}`;

function hasVoted(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(votedKey(id)) === '1';
  } catch {
    return false; // storage blocked (private mode / disabled) → just don't dedup
  }
}

/**
 * Vote control for a post idea. Fires the locked `idea_voted` PostHog signal and
 * remembers the vote in localStorage so the button stays "✓ Voted" across
 * reloads. Votes remain signal-only in v1 — no live count or backend tally; the
 * /vote page notes this. localStorage dedup is per-device/browser, best-effort.
 */
export const IdeaVote: React.FC<IdeaVoteProps> = ({ idea }) => {
  const [voted, setVoted] = useState(false);

  // Read persisted state after mount (avoids SSR/hydration mismatch — the server
  // has no localStorage, so first paint is "not voted", then we reconcile).
  useEffect(() => {
    if (hasVoted(idea.slug)) setVoted(true);
  }, [idea.slug]);

  return (
    <button
      type="button"
      className="button button--primary button--sm"
      disabled={voted}
      aria-pressed={voted}
      onClick={() => {
        posthog.capture('idea_voted', {
          idea_slug: idea.slug,
          idea_title: idea.title,
          type: idea.type,
          page_path: typeof window !== 'undefined' ? window.location.pathname : '/vote',
        });
        try {
          window.localStorage.setItem(votedKey(idea.slug), '1');
        } catch {
          /* storage blocked — vote still fired to PostHog, just not remembered */
        }
        setVoted(true);
      }}
    >
      {voted ? '✓ Voted' : '🗳️ Vote'}
    </button>
  );
};

export default IdeaVote;
