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
}

const KINDS = (blogKinds as {kinds: Record<string, KindMeta>}).kinds;

// The thought kinds, in a deliberate reading order (generative → interrogative → evaluative →
// distilling → design). Any kind flagged `thought: true` that isn't listed still falls through
// to the end, so adding a thought kind to the JSON surfaces it here even before this list is
// updated.
const THOUGHT_ORDER = [
  'idea',
  'question-set',
  'simulation',
  'prediction',
  'critique',
  'principle',
  'design-story',
];

export function thoughtKinds(): string[] {
  const flagged = Object.keys(KINDS).filter((k) => KINDS[k]?.thought);
  const ordered = THOUGHT_ORDER.filter((k) => flagged.includes(k));
  const rest = flagged.filter((k) => !ordered.includes(k));
  return [...ordered, ...rest];
}

/** Human label for a kind: the gloss's subject, derived from the kind id (idea → "Idea"). */
function kindLabel(kind: string): string {
  // question-set reads better as "Question"; design-story as "Design"; otherwise title-case.
  const overrides: Record<string, string> = {
    'question-set': 'Question',
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
  if (!meta || !meta.thought) {
    // Not a known thought kind — render nothing rather than a misleading badge.
    return null;
  }
  const label = kindLabel(kind);
  const gloss = meta.thoughtGloss || meta.description;
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

export interface ThoughtKindLegendProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * ThoughtKindLegend — the canonical reader-facing legend of the thought kinds, rendered straight
 * from blog-kinds.json (the `thought: true` kinds). Drop it on the /thoughts landing. Same role
 * <PowerLegend> plays for the question-set kit: generated from the source of truth so it can
 * never drift from the badges the posts actually carry.
 */
export function ThoughtKindLegend({className, style}: ThoughtKindLegendProps): React.JSX.Element {
  return (
    <dl className={clsx(styles.legend, className)} style={style}>
      {thoughtKinds().map((kind) => {
        const meta = KINDS[kind];
        const label = kindLabel(kind);
        return (
          <div key={kind} className={styles.legendRow}>
            <dt className={styles.legendEmoji} aria-hidden="true">
              {meta.emoji}
            </dt>
            <dd className={styles.legendText}>
              <span className={styles.legendName}>{label}</span>
              <span className={styles.legendGloss}>{meta.thoughtGloss || meta.description}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
