import React, {useMemo} from 'react';
import {parseRunLog} from './parseRunLog';
import styles from './styles.module.css';

// <RunTimeline log={...} title="..."/>: how one run of an AI coding session went over time.
// One lane per agent, a bar for when it was working, placed and sized by its share of the run.
// Every lane prints its label, seconds and cost as text, so nothing hides behind a hover.

export interface RunTimelineProps {
  /** The run log: one JSON object per line ({t, agent, ev, label?, costUsd?}). */
  log: string;
  title?: string;
}

function seconds(s: number): string {
  return `${Number.isInteger(s) ? s : s.toFixed(1)}s`;
}

function money(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

function pct(part: number, whole: number): string {
  return `${whole > 0 ? (part / whole) * 100 : 0}%`;
}

export default function RunTimeline({log, title}: RunTimelineProps) {
  const {agents, totalSeconds, totalCostUsd} = useMemo(() => parseRunLog(log), [log]);

  return (
    <figure className={styles.timeline}>
      {title && <figcaption className={styles.title}>{title}</figcaption>}
      {agents.length === 0 ? (
        <p className={styles.empty}>No agent activity in this log.</p>
      ) : (
        <ol className={styles.lanes}>
          {agents.map((a) => {
            const duration = a.end - a.start;
            return (
              <li key={a.id} className={styles.lane} data-agent={a.id}>
                <div className={styles.meta}>
                  <span className={styles.label}>{a.label}</span>
                  <span className={styles.stats}>
                    {seconds(duration)} · {money(a.costUsd)}
                  </span>
                </div>
                <div className={styles.track}>
                  <div
                    className={styles.bar}
                    style={{left: pct(a.start, totalSeconds), width: pct(duration, totalSeconds)}}
                    title={`${a.label}: ${seconds(a.start)} to ${seconds(a.end)}`}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className={styles.totals}>
        <span>
          Total time <strong>{seconds(totalSeconds)}</strong>
        </span>
        <span>
          Total cost <strong>{money(totalCostUsd)}</strong>
        </span>
      </p>
    </figure>
  );
}
