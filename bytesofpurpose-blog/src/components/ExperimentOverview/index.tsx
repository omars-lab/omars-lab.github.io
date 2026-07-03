import React from 'react';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import styles from './styles.module.css';

/**
 * ExperimentOverview — the on-brand header block for an experiment post.
 *
 * Renders the Status / Owner / Flag / Created badges + a LIFECYCLE BAR (proposed → designed →
 * running → analyzing → concluded → rolled-out / abandoned) with the CURRENT stage highlighted.
 *
 * FRONTMATTER-DRIVEN (no drift): it reads `stage`, `flag`, `owner`, and `date` straight from the
 * post's own frontmatter via useBlogPost(), so the header can never disagree with the stage the
 * Experimentation board reads from the same field. Author writes just:
 *
 *   <ExperimentOverview />
 *
 * (add `flag:` and `owner:` frontmatter alongside the existing `stage:` and `date:`). Optional props
 * override the frontmatter for a one-off (e.g. a re-scoped note): <ExperimentOverview note="…" />.
 *
 * The stage vocabulary + emoji mirror the KanbanBoard experiments columns so the two stay in sync.
 */

// The experiment lifecycle: the 5 board stages + the 2 terminal outcomes. Emoji match KanbanBoard.
const STAGES = [
  {id: 'proposed', label: 'Proposed', emoji: '💡'},
  {id: 'designed', label: 'Designed', emoji: '✏️'},
  {id: 'running', label: 'Running', emoji: '🟢'},
  {id: 'analyzing', label: 'Analyzing', emoji: '🔬'},
  {id: 'concluded', label: 'Concluded', emoji: '✅'},
] as const;
// Terminal outcomes (one of these follows `concluded`); either can be the current stage.
const OUTCOMES = [
  {id: 'rolled-out', label: 'Rolled out', emoji: '🚀'},
  {id: 'abandoned', label: 'Abandoned', emoji: '🗑️'},
] as const;

type Stage = (typeof STAGES)[number]['id'] | (typeof OUTCOMES)[number]['id'];

interface Props {
  /** Override the frontmatter stage (rare). */
  stage?: Stage;
  /** Override the frontmatter flag key. */
  flag?: string;
  /** Override the frontmatter owner. */
  owner?: string;
  /** A short parenthetical note next to the status (e.g. a re-scope note). */
  note?: string;
}

function Badge({label, value}: {label: string; value: React.ReactNode}): React.JSX.Element {
  return (
    <span className={styles.badge}>
      <span className={styles.badgeLabel}>{label}</span>
      <span className={styles.badgeValue}>{value}</span>
    </span>
  );
}

export default function ExperimentOverview(props: Props): React.JSX.Element {
  const {frontMatter, metadata} = useBlogPost();
  const fm = (frontMatter || {}) as Record<string, unknown>;

  const stage = (props.stage || (fm.stage as string) || 'proposed') as Stage;
  const flag = props.flag || (fm.flag as string) || '';
  const owner = props.owner || (fm.owner as string) || '';
  const created = (metadata?.date || (fm.date as string) || '').toString().slice(0, 10);

  // The current stage's index across the full lifecycle (stages + outcomes). Anything before it is
  // "done", after it is "upcoming". A terminal outcome sits at the end.
  const lifecycle = [...STAGES, ...OUTCOMES];
  const currentIdx = lifecycle.findIndex((s) => s.id === stage);
  const current = lifecycle[currentIdx] || STAGES[0];

  return (
    <aside className={styles.overview} aria-label="Experiment overview">
      <div className={styles.badges}>
        <Badge label="Status" value={`${current.emoji} ${current.label}`} />
        {owner && <Badge label="Owner" value={owner} />}
        {flag && <Badge label="Flag" value={<code className={styles.flag}>{flag}</code>} />}
        {created && <Badge label="Created" value={created} />}
        {props.note && <span className={styles.note}>{props.note}</span>}
      </div>

      <ol className={styles.lifecycle} aria-label="Lifecycle">
        {STAGES.map((s, i) => {
          const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming';
          return (
            <li key={s.id} className={styles[state]} title={s.label} aria-current={state === 'current'}>
              <span className={styles.stageEmoji}>{s.emoji}</span>
              <span className={styles.stageLabel}>{s.label}</span>
            </li>
          );
        })}
        {/* The terminal fork: rolled-out / abandoned. Highlight whichever is the current stage. */}
        <li className={styles.fork} aria-hidden={!OUTCOMES.some((o) => o.id === stage)}>
          {OUTCOMES.map((o) => {
            const isCurrent = o.id === stage;
            return (
              <span key={o.id} className={isCurrent ? styles.current : styles.upcoming} title={o.label}>
                <span className={styles.stageEmoji}>{o.emoji}</span>
                <span className={styles.stageLabel}>{o.label}</span>
              </span>
            );
          })}
        </li>
      </ol>
    </aside>
  );
}
