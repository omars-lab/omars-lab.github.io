import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';

/**
 * <ExperimentIterations>: one post that holds several rounds of the same experiment (a first run,
 * the ideas it led to, a follow-on run) behind a dropdown, so the reader starts on the newest and
 * can switch back to the first.
 *
 *   <ExperimentIterations>
 *   <Iteration id="v1" label="First run: one complex task" date="2026-10-27">
 *
 *   <ExperimentDesign ... />
 *   ...the first run's write-up...
 *
 *   </Iteration>
 *   <Iteration id="v2" label="Second run: ..." date="2026-11-10">
 *   ...
 *   </Iteration>
 *   </ExperimentIterations>
 *
 * - Write the iterations oldest first; the last one is the newest and opens by default.
 * - ?iteration=<id> in the URL opens that one, and switching rewrites the URL (replaceState), so a
 *   copied link keeps the choice.
 * - Only the chosen iteration's body is rendered.
 *
 * make validate-experiment-design checks the ids are unique and every Iteration has its own
 * <ExperimentDesign />.
 */
export interface IterationProps {
  id: string;
  label: string;
  /** YYYY-MM-DD */
  date?: string;
  children?: React.ReactNode;
}

export function Iteration({children}: IterationProps): React.JSX.Element {
  return <>{children}</>;
}

type IterationElement = React.ReactElement<IterationProps>;

const PARAM = 'iteration';

export default function ExperimentIterations({children}: {children?: React.ReactNode}): React.JSX.Element {
  const iterations = React.Children.toArray(children).filter(
    (c): c is IterationElement => React.isValidElement(c) && typeof (c.props as IterationProps).id === 'string',
  );
  const newest = iterations[iterations.length - 1];
  const [current, setCurrent] = useState<string | undefined>(newest?.props.id);

  // Open the one the URL names, after hydration (the server renders the newest).
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get(PARAM);
    if (wanted && iterations.some((it) => it.props.id === wanted)) setCurrent(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!newest) return <></>;

  const choose = (id: string) => {
    setCurrent(id);
    const url = new URL(window.location.href);
    if (id === newest.props.id) url.searchParams.delete(PARAM);
    else url.searchParams.set(PARAM, id);
    window.history.replaceState(window.history.state, '', url.toString());
  };

  const shown = iterations.find((it) => it.props.id === current) || newest;
  const onNewest = shown.props.id === newest.props.id;
  const selectId = 'experiment-iteration-select';
  const newestFirst = [...iterations].reverse();

  return (
    <div className={styles.iterations}>
      <div className={styles.picker}>
        <label htmlFor={selectId} className={styles.label}>
          Experiment iteration
        </label>
        <select
          id={selectId}
          className={styles.select}
          value={shown.props.id}
          onChange={(e) => choose(e.target.value)}>
          {newestFirst.map((it, n) => (
            <option key={it.props.id} value={it.props.id}>
              {it.props.label}
              {it.props.date ? ` (${it.props.date})` : ''}
              {n === 0 && iterations.length > 1 ? ', newest' : ''}
            </option>
          ))}
        </select>
        {!onNewest && (
          <p className={styles.note}>
            You're reading an earlier iteration. Newest:{' '}
            <button type="button" className={styles.jump} onClick={() => choose(newest.props.id)}>
              {newest.props.label}
            </button>
            .
          </p>
        )}
      </div>
      <div key={shown.props.id}>{shown}</div>
    </div>
  );
}
