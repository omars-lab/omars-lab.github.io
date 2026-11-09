import React from 'react';
import styles from './styles.module.css';

/**
 * ExperimentDesign: the "How the experiment was set up" card on an experiment post.
 *
 * It sits right under <ExperimentOverview /> (the stage/owner/flag header) and says, in one
 * compact block, what the experiment asked and how it was run: the question, what was expected
 * before any run, which models did the work, what differed between the arms (the control
 * marked), what was counted, how many runs and what that many can show, how it was graded, and
 * the cost of one run. The full text of each arm stays in the page's own tabs; each arm here is
 * one line.
 *
 *   <ExperimentDesign
 *     question="Does a styled button draw more clicks than a plain link?"
 *     arms={[{id: 'control', label: 'Link', summary: '...'}, {id: 'test', label: 'Button', summary: '...'}]}
 *     control="control"
 *     measures={[{name: 'Clicks', how: '...'}]}
 *   />
 *
 * The prop names are fixed: a script in the social-presence-hub repo writes them from the
 * experiment's own files. `make validate-experiment-design` checks every experiment post
 * (kind experiment-plan or experiment-result) has one, with a question, two or more arms and a
 * measure.
 */

export interface ExperimentModel {
  /** What this model did, e.g. "Agent" or "Grader". */
  role: string;
  /** The model's name as a reader knows it, e.g. "Claude Opus 5.5". */
  model: string;
  /** The exact model id, e.g. "claude-opus-5-5". */
  id?: string;
  /** Effort setting, e.g. "medium". */
  effort?: string;
}

export interface ExperimentArm {
  id: string;
  label: string;
  /** One line on what this arm did differently. */
  summary: string;
  /** Length of the arm's paragraph, when the post states it. */
  words?: number;
}

export interface ExperimentMeasure {
  name: string;
  how: string;
}

export interface ExperimentDesignProps {
  /** The question, in one line. */
  question: string;
  /** What was expected, written before any run. */
  expectation?: string;
  /** Who did the work. */
  models?: ExperimentModel[];
  /** What differed between runs, one line each. */
  arms: ExperimentArm[];
  /** id of the control (or neutral) arm. */
  control?: string;
  /** What was counted or graded. */
  measures: ExperimentMeasure[];
  /** Runs per arm, and what that many can show. */
  runs?: {perArm: number; note?: string};
  /** How the runs were graded. */
  grading?: string;
  /** Cost of one run (never a private total). */
  cost?: string;
  /** Where the experiment's files live, shown as text only. */
  source?: string;
}

function Row({label, children}: {label: string; children: React.ReactNode}): React.JSX.Element {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}

export default function ExperimentDesign(props: ExperimentDesignProps): React.JSX.Element {
  const {question, expectation, models, arms = [], control, measures = [], runs, grading, cost, source} =
    props;
  const showEffort = (models || []).some((m) => m.effort);
  // The control arm reads first, whatever order the post lists the arms in.
  const ordered = [...arms.filter((a) => a.id === control), ...arms.filter((a) => a.id !== control)];

  return (
    <aside className={styles.design} aria-label="How the experiment was set up">
      <p className={styles.title}>How the experiment was set up</p>

      <p className={styles.question}>{question}</p>

      <dl className={styles.rows}>
        {expectation && <Row label="What I expected">{expectation}</Row>}

        {models && models.length > 0 && (
          <Row label="Who did the work">
            <table className={styles.models}>
              <thead>
                <tr>
                  <th scope="col">Role</th>
                  <th scope="col">Model</th>
                  {showEffort && <th scope="col">Effort</th>}
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => (
                  <tr key={`${m.role}-${m.model}-${i}`}>
                    <td>{m.role}</td>
                    <td>
                      {m.model}
                      {m.id && <code className={styles.modelId}>{m.id}</code>}
                    </td>
                    {showEffort && <td>{m.effort || ''}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </Row>
        )}

        <Row label="What changed between arms">
          <ul className={styles.arms}>
            {ordered.map((a) => {
              const isControl = control === a.id;
              return (
                <li key={a.id} className={isControl ? styles.controlArm : undefined}>
                  <span className={styles.armHead}>
                    <span className={styles.armLabel}>{a.label}</span>
                    {isControl && <span className={styles.controlTag}>control</span>}
                    {typeof a.words === 'number' && <span className={styles.words}>{a.words} words</span>}
                  </span>
                  <span className={styles.armSummary}>{a.summary}</span>
                </li>
              );
            })}
          </ul>
        </Row>

        <Row label="What was counted">
          <ul className={styles.measures}>
            {measures.map((m) => (
              <li key={m.name}>
                <strong>{m.name}:</strong> {m.how}
              </li>
            ))}
          </ul>
        </Row>

        {runs && (
          <Row label="How many runs">
            <strong>{runs.perArm} per arm.</strong>
            {runs.note && <> {runs.note}</>}
          </Row>
        )}

        {grading && <Row label="How it was graded">{grading}</Row>}
        {cost && <Row label="Cost of one run">{cost}</Row>}
        {source && (
          <Row label="Files">
            <code className={styles.source}>{source}</code>
          </Row>
        )}
      </dl>
    </aside>
  );
}
