import React from 'react';
import styles from './styles.module.css';

/**
 * PostQuestions renders the "Questions this post answers" box from a post's
 * `questions:` frontmatter (a list of reader questions the post sets out to answer,
 * usually the questions behind the request that prompted it).
 *
 * This is the reader-facing mirror of the repo convention "frame each task around
 * the MAIN QUESTION it answers": the working task list reads as questions in flight,
 * and a published post carries the same framing so a reader sees, up front, exactly
 * which questions it will resolve.
 *
 * It is mounted automatically by the swizzled blog/doc item wrappers (so an author
 * never has to remember to place it); it renders nothing when `questions` is absent
 * or empty. An accessible landmark region, not decoration.
 */
export interface PostQuestionsProps {
  questions?: unknown;
}

function normalize(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((q) => (typeof q === 'string' ? q.trim() : ''))
    .filter((q) => q.length > 0);
}

export default function PostQuestions({
  questions,
}: PostQuestionsProps): React.JSX.Element | null {
  const items = normalize(questions);
  if (items.length === 0) return null;
  return (
    <aside className={styles.box} aria-label="Questions this post answers">
      <p className={styles.eyebrow}>Questions this post answers</p>
      <ul className={styles.list}>
        {items.map((q, i) => (
          <li key={i} className={styles.item}>
            {q}
          </li>
        ))}
      </ul>
    </aside>
  );
}
