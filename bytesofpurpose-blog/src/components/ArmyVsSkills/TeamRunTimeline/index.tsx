import React, {useMemo} from 'react';
import {parseRunLog, formatSeconds, formatCost} from './parseRunLog';
import styles from './styles.module.css';

/**
 * RunTimeline shows one run of an AI coding session over time: one lane per agent, with a bar
 * for when that agent was working. Feed it the raw JSONL run log (see parseRunLog.ts).
 *
 *   <RunTimeline title="Run 42" log={`{"t":0,"agent":"lead","ev":"start"}\n...`} />
 *
 * Each lane's label, duration and cost are plain text in a header beside the track (stacked
 * above it on narrow screens), so tiny bars stay readable. An empty or garbage log renders a
 * short "No agent activity" line instead of an empty chart.
 */
export interface RunTimelineProps {
  /** The run log as JSONL text. */
  log: string;
  title?: string;
}

function percent(value: number, total: number): string {
  return `${total > 0 ? (value / total) * 100 : 0}%`;
}

export default function RunTimeline({log, title}: RunTimelineProps): React.JSX.Element {
  const run = useMemo(() => parseRunLog(log), [log]);

  return (
    <figure className={styles.runTimeline}>
      {title && <figcaption className={styles.title}>{title}</figcaption>}
      {run.agents.length === 0 ? (
        <p className={styles.empty}>No agent activity in this log.</p>
      ) : (
        <>
          <ol className={styles.lanes}>
            {run.agents.map((agent) => {
              const seconds = formatSeconds(agent.end - agent.start);
              const cost = formatCost(agent.costUsd);
              return (
                <li key={agent.id} className={styles.lane} data-agent={agent.id}>
                  <div className={styles.header}>
                    <span className={styles.label}>{agent.label}</span>
                    <span className={styles.stats}>
                      {seconds} · {cost}
                    </span>
                    <span className={styles.srOnly}>
                      from {formatSeconds(agent.start)} to {formatSeconds(agent.end)}
                    </span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={styles.bar}
                      aria-hidden="true"
                      style={{
                        left: percent(agent.start, run.totalSeconds),
                        width: percent(agent.end - agent.start, run.totalSeconds),
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
          <p className={styles.total}>
            Total {formatSeconds(run.totalSeconds)} · {formatCost(run.totalCostUsd)}
          </p>
        </>
      )}
    </figure>
  );
}
