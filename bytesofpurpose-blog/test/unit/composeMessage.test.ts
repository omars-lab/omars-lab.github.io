/**
 * Unit proof for ShareButton's composeMessage truncation contract (#8).
 *
 * Follows the repo convention (see GraphRenderer.title.test.ts): test a testable
 * copy of the implementation logic rather than importing the component (which
 * pulls posthog-js + @site aliases that aren't wired into jest). Keep this copy
 * byte-for-byte in sync with composeMessage() in src/components/ShareButton/index.tsx
 * — if the wording or cap logic changes there, change it here too.
 */
/// <reference types="jest" />

const X_MAX_LEN = 200;

// --- mirror of src/components/ShareButton/index.tsx::composeMessage ---
function composeMessage(title: string, description: string, maxLen?: number): string {
  const head = `Hey, check out this post I came across: "${title}".`;
  if (!description) return head;
  const summary = description.replace(/\.$/, '');
  let full = `${head} Here's what it covers: ${summary}.`;
  if (maxLen && full.length > maxLen) {
    const prefix = `${head} Here's what it covers: `;
    const room = Math.max(0, maxLen - prefix.length - 1);
    let trimmed = summary.slice(0, room);
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > 0) trimmed = trimmed.slice(0, lastSpace);
    full = `${prefix}${trimmed}…`;
  }
  return full;
}

describe('composeMessage', () => {
  const TITLE = 'Docs vs Blogs';

  it('includes the friendly intro + title', () => {
    expect(composeMessage(TITLE, '')).toBe(
      'Hey, check out this post I came across: "Docs vs Blogs".',
    );
  });

  it('appends the summary clause when a description is present', () => {
    const msg = composeMessage(TITLE, 'A short note about the difference.');
    expect(msg).toContain("Here's what it covers: A short note about the difference.");
  });

  it('strips a single trailing period from the description before re-adding one', () => {
    const msg = composeMessage(TITLE, 'Ends with a period.');
    expect(msg.endsWith('Ends with a period.')).toBe(true);
    expect(msg).not.toContain('period..');
  });

  it('does NOT truncate when no maxLen is given (email path), however long', () => {
    const long = 'x'.repeat(500);
    const msg = composeMessage(TITLE, long);
    expect(msg.length).toBeGreaterThan(500);
    expect(msg.endsWith('…')).toBe(false);
  });

  it('truncates the summary to within maxLen and ends with an ellipsis (X path)', () => {
    const long =
      'A topic-organized knowledge base for engineers: generative AI, software ' +
      'development, product management, productivity, blogging, interview prep, ' +
      'companies, entrepreneurship, faith, and personal growth.';
    const msg = composeMessage(TITLE, long, X_MAX_LEN);
    expect(msg.length).toBeLessThanOrEqual(X_MAX_LEN);
    expect(msg.endsWith('…')).toBe(true);
    // The title clause is always preserved, even when the summary is trimmed.
    expect(msg).toContain('Hey, check out this post I came across: "Docs vs Blogs".');
    expect(msg).toContain("Here's what it covers: ");
  });

  it('trims at a word boundary (no mid-word cut)', () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
    const msg = composeMessage(TITLE, long, X_MAX_LEN);
    // The char before the ellipsis is the end of a whole word, not a partial token.
    const body = msg.slice(0, -1); // drop the ellipsis
    expect(body.endsWith(' ')).toBe(false); // we drop the trailing space too
    expect(/word\d+$/.test(body)).toBe(true);
  });

  it('leaves a short message untouched even with maxLen set', () => {
    const msg = composeMessage(TITLE, 'Tiny summary', X_MAX_LEN);
    expect(msg.endsWith('…')).toBe(false);
    expect(msg).toContain("Here's what it covers: Tiny summary.");
  });
});
