import React, {useState} from 'react';
import TeamRunTimeline from './TeamRunTimeline';
import SkillsRunTimeline from './SkillsRunTimeline';
import styles from './styles.module.css';

// The experiment's task B asked both setups to build a RunTimeline component from the same
// task text. TeamRunTimeline and SkillsRunTimeline are those two outputs, copied in unchanged
// (team: task B repeat 2; skills: task B repeat 2). This playground feeds both the same log,
// which the reader can edit, so they can be compared side by side.

// The task's sample log: made-up runs, one JSON object per line.
const SAMPLE_LOG = [
  '{"t":0,"agent":"lead","ev":"start","label":"Lead"}',
  '{"t":18,"agent":"coder","ev":"start","label":"Coder"}',
  '{"t":21,"agent":"tester","ev":"start","label":"Tester"}',
  '{"t":164,"agent":"tester","ev":"stop","costUsd":0.84}',
  '{"t":197,"agent":"coder","ev":"stop","costUsd":1.12}',
  '{"t":205,"agent":"reviewer","ev":"start","label":"Reviewer"}',
  '{"t":298,"agent":"reviewer","ev":"stop","costUsd":0.61}',
  '{"t":402,"agent":"lead","ev":"stop","costUsd":1.47}',
].join('\n');

export default function ArmyVsSkillsPlayground(): React.JSX.Element {
  const [log, setLog] = useState(SAMPLE_LOG);
  return (
    <div className={styles.playground}>
      <label className={styles.editor}>
        <span className={styles.label}>
          The task's sample run log (made-up times and costs), drawn by both components. Edit it:
          change a time, add an agent, break a line.
        </span>
        <textarea
          className={styles.log}
          value={log}
          onChange={(e) => setLog(e.target.value)}
          spellCheck={false}
          rows={9}
        />
        <button type="button" className={styles.reset} onClick={() => setLog(SAMPLE_LOG)} disabled={log === SAMPLE_LOG}>
          Put the sample log back
        </button>
      </label>
      <div className={styles.pair}>
        <figure className={styles.side}>
          <figcaption className={styles.caption}>Built by the team (lead + subagents)</figcaption>
          <TeamRunTimeline log={log} title="The team's RunTimeline" />
        </figure>
        <figure className={styles.side}>
          <figcaption className={styles.caption}>Built by one agent with skills</figcaption>
          <SkillsRunTimeline log={log} title="The skills run's RunTimeline" />
        </figure>
      </div>
    </div>
  );
}
