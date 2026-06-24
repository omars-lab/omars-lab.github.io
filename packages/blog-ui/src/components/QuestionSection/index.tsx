import React, {Children, ReactNode, isValidElement} from 'react';
import clsx from 'clsx';
import type {QuestionPriority} from '../Question';
import styles from './styles.module.css';

/**
 * QuestionSection — wraps the <Question> cards under one H2 and renders them sorted by
 * priority (core > high > medium > low), preserving the authored order WITHIN each tier
 * (a stable sort). Questions with no `priority` sort last, in authored order.
 *
 * Authors keep writing questions in whatever order reads naturally; the section presents
 * them most-foundational-first so the reader meets the core questions before the lighter
 * ones. Non-Question children (stray text, a note) are passed through in place after the
 * sorted questions.
 *
 *   ## Core purpose
 *   <SectionBanner why="…" />
 *   <QuestionSection>
 *     <Question priority="high" …>…</Question>
 *     <Question priority="core" …>…</Question>   (this one renders FIRST)
 *   </QuestionSection>
 */
export interface QuestionSectionProps {
  children: ReactNode;
  className?: string;
}

const PRIORITY_RANK: Record<QuestionPriority, number> = {
  core: 0,
  high: 1,
  medium: 2,
  low: 3,
};
const NO_PRIORITY_RANK = 4;

function rankOf(node: ReactNode): number {
  if (isValidElement(node)) {
    const p = (node.props as {priority?: QuestionPriority}).priority;
    if (p && p in PRIORITY_RANK) return PRIORITY_RANK[p];
  }
  return NO_PRIORITY_RANK;
}

const QuestionSection: React.FC<QuestionSectionProps> = ({children, className}) => {
  // Keep only real element children (MDX injects whitespace text nodes between blocks).
  const items = Children.toArray(children).filter(
    (c) => !(typeof c === 'string' && c.trim() === ''),
  );

  // Stable sort by priority rank. Array.prototype.sort is stable in modern engines, so
  // equal-rank items keep their authored order; we also carry the original index to be safe.
  const sorted = items
    .map((node, i) => ({node, i, rank: rankOf(node)}))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map(({node}) => node);

  return <div className={clsx(styles.section, className)}>{sorted}</div>;
};

export default QuestionSection;
