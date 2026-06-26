import React, {CSSProperties} from 'react';
import clsx from 'clsx';
import {Tooltip} from '@omars-lab/blog-ui';
import blogKinds from '../../../scripts/lib/blog-kinds.json';
import styles from './styles.module.css';

/**
 * ThoughtKind — a small badge that labels a "thought" by its KIND (idea, question, simulation,
 * prediction, critique, principle, design). The emoji + gloss come straight from the single
 * source of truth (scripts/lib/blog-kinds.json: the kinds flagged `thought: true`), so the
 * badge can never drift from the post-kind taxonomy the rest of the site uses.
 *
 *   <ThoughtKind kind="simulation" />            // emoji + label + hover gloss
 *   <ThoughtKind kind="idea" showLabel={false}/> // emoji-only (still tooltipped)
 *
 * <ThoughtKindLegend /> renders ALL the thought kinds at once (drop it on the /thoughts
 * landing) — the analog of <PowerLegend> for the question-set kit. Mirrors that pattern: the
 * legend is generated from the taxonomy, never hand-authored as an approximate table.
 */

interface KindMeta {
  emoji: string;
  description: string;
  thought?: boolean;
  thoughtGloss?: string;
  mindset?: boolean;
  mindsetGloss?: string;
}

const KINDS = (blogKinds as {kinds: Record<string, KindMeta>}).kinds;

// Reading order per collection. A flagged kind not listed falls through to the end, so adding a
// kind to the JSON surfaces it even before these lists are updated.
const THOUGHT_ORDER = ['idea', 'research', 'simulation', 'prediction', 'critique', 'design-story'];
const MINDSET_ORDER = ['question-set', 'quote-set', 'principle'];

function kindsFor(flag: 'thought' | 'mindset', order: string[]): string[] {
  const flagged = Object.keys(KINDS).filter((k) => KINDS[k]?.[flag]);
  const ordered = order.filter((k) => flagged.includes(k));
  const rest = flagged.filter((k) => !ordered.includes(k));
  return [...ordered, ...rest];
}

export function thoughtKinds(): string[] {
  return kindsFor('thought', THOUGHT_ORDER);
}
export function mindsetKinds(): string[] {
  return kindsFor('mindset', MINDSET_ORDER);
}

// The gloss to show for a kind: prefer its collection-specific gloss, else the description.
function kindGloss(meta: KindMeta): string {
  return meta.mindsetGloss || meta.thoughtGloss || meta.description;
}

/** Human label for a kind: a friendly noun derived from the kind id (idea → "Idea"). */
function kindLabel(kind: string): string {
  const overrides: Record<string, string> = {
    'question-set': 'Question',
    'quote-set': 'Quote',
    'design-story': 'Design',
    critique: 'Critique',
  };
  if (overrides[kind]) return overrides[kind];
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export interface ThoughtKindProps {
  /** The kind id from blog-kinds.json (idea, question-set, simulation, prediction, critique, principle, design-story). */
  kind: string;
  /** Show the text label next to the emoji (default true). When false, emoji-only (still tooltipped). */
  showLabel?: boolean;
  className?: string;
  style?: CSSProperties;
}

const ThoughtKind: React.FC<ThoughtKindProps> = ({kind, showLabel = true, className, style}) => {
  const meta = KINDS[kind];
  if (!meta || !(meta.thought || meta.mindset)) {
    // Not a known thought/mindset kind — render nothing rather than a misleading badge.
    return null;
  }
  const label = kindLabel(kind);
  const gloss = kindGloss(meta);
  return (
    <Tooltip
      content={
        <>
          <b>{label}</b>
          <br />
          {gloss}
        </>
      }>
      <span className={clsx(styles.badge, className)} style={style} aria-label={`${label}: ${gloss}`}>
        <span className={styles.emoji} aria-hidden="true">
          {meta.emoji}
        </span>
        {showLabel && <span className={styles.label}>{label}</span>}
      </span>
    </Tooltip>
  );
};

export default ThoughtKind;

export interface KindLegendProps {
  className?: string;
  style?: CSSProperties;
}

/** Shared legend renderer — a <dl> of {emoji, label, gloss} for the given kind ids. */
function KindLegend({kinds, className, style}: KindLegendProps & {kinds: string[]}): React.JSX.Element {
  return (
    <dl className={clsx(styles.legend, className)} style={style}>
      {kinds.map((kind) => {
        const meta = KINDS[kind];
        return (
          <div key={kind} className={styles.legendRow}>
            <dt className={styles.legendEmoji} aria-hidden="true">
              {meta.emoji}
            </dt>
            <dd className={styles.legendText}>
              <span className={styles.legendName}>{kindLabel(kind)}</span>
              <span className={styles.legendGloss}>{kindGloss(meta)}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * ThoughtKindLegend — the canonical reader-facing legend of the THOUGHT kinds (ideas that occurred
 * to me: idea/simulation/prediction/critique/design), rendered straight from blog-kinds.json (the
 * `thought: true` kinds). Drop it on the /thoughts landing. Generated from the source of truth so
 * it can never drift from the badges the posts carry.
 */
export function ThoughtKindLegend(props: KindLegendProps): React.JSX.Element {
  return <KindLegend kinds={thoughtKinds()} {...props} />;
}

/**
 * MindsetKindLegend — the same, for the MINDSET kinds (the curated inputs I keep to shape my
 * thinking: question-set/quote-set/principle, the `mindset: true` kinds). Drop it on the /mindset
 * landing.
 */
export function MindsetKindLegend(props: KindLegendProps): React.JSX.Element {
  return <KindLegend kinds={mindsetKinds()} {...props} />;
}
