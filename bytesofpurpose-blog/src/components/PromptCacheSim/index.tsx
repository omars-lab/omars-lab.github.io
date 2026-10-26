import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {
  MODELS,
  TTL_MINUTES,
  type ModelPrice,
  type Ttl,
  type TurnResult,
  breakEvenReuses,
  pattern,
  simulate,
} from './cacheMath';
import styles from './styles.module.css';

// Three small widgets for the "pick the prompt cache's time limit" technique page:
//   <ContextSim/>  what sits in the cached prompt, and how it grows turn by turn
//   <ChatSim/>     a chat you click through turn by turn, two terminals side by side, one per time limit
//   <CostSim/>     sliders for prompt size, turns and pauses, with the cost under each time limit
// All maths lives in cacheMath.ts. Client state only: no network calls, no tracking.

const TTLS: Ttl[] = ['5m', '1h'];
const TTL_LABEL: Record<Ttl, string> = {'5m': '5-minute cache', '1h': '1-hour cache'};

function money(usd: number): string {
  const abs = Math.abs(usd);
  if (abs >= 100) return `$${Math.round(usd).toLocaleString('en-US')}`;
  if (abs >= 1) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(3)}`;
}

function tokens(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

function minutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = m / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
}

/** Time since the first turn, as h:mm. */
function clock(m: number): string {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

function ModelPicker({value, onChange}: {value: ModelPrice; onChange: (m: ModelPrice) => void}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>Model</label>
      <select
        id={id}
        className={styles.select}
        value={value.id}
        onChange={(e) => onChange(MODELS.find((m) => m.id === e.target.value) || MODELS[0])}>
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}, ${m.input} per million
          </option>
        ))}
      </select>
    </div>
  );
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  show: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {props.label} <output htmlFor={id} className={styles.value}>{props.show(props.value)}</output>
      </label>
      <input
        id={id}
        className={styles.range}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        aria-valuetext={props.show(props.value)}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- context */

export function ContextSim() {
  const [system, setSystem] = useState(18_000);
  const [project, setProject] = useState(4_000);
  const [perTurn, setPerTurn] = useState(8_000);
  const [turn, setTurn] = useState(12);

  const past = (turn - 1) * perTurn;
  const total = system + project + past + perTurn;
  const max = 40_000 + 30 * 30_000; // the bar's scale stays put while you drag
  const pct = (n: number) => `${(100 * n) / max}%`;

  const layers = [
    {key: 'system', label: 'System prompt and tools', n: system, cls: styles.layerSystem},
    {key: 'project', label: 'CLAUDE.md, memory, rules', n: project, cls: styles.layerProject},
    {key: 'past', label: `Turns 1 to ${turn - 1}`, n: past, cls: styles.layerPast},
    {key: 'new', label: `Turn ${turn} (new)`, n: perTurn, cls: styles.layerNew},
  ];

  return (
    <figure className={styles.widget} aria-labelledby="ctx-sim-title">
      <figcaption id="ctx-sim-title" className={styles.title}>
        What the cache holds at turn {turn}
      </figcaption>
      <div className={styles.bar} role="img" aria-label={`Prompt of ${tokens(total)} tokens: ${layers.map((l) => `${l.label} ${tokens(l.n)}`).join(', ')}`}>
        {layers.map((l) => (l.n > 0 ? <span key={l.key} className={`${styles.layer} ${l.cls}`} style={{width: pct(l.n)}} /> : null))}
      </div>
      <ul className={styles.legend}>
        {layers.map((l) => (
          <li key={l.key}>
            <span className={`${styles.swatch} ${l.cls}`} aria-hidden="true" />
            {l.label}: <strong>{tokens(l.n)}</strong>
          </li>
        ))}
      </ul>
      <p className={styles.readout} aria-live="polite">
        The prompt is <strong>{tokens(total)}</strong> tokens. If the cache is still there, turn {turn} reads the
        first <strong>{tokens(total - perTurn)}</strong> at a fraction of the price and only writes its own{' '}
        <strong>{tokens(perTurn)}</strong>. If it has expired, all <strong>{tokens(total)}</strong> are written again.
      </p>
      <div className={styles.controls}>
        <Slider label="Turn" value={turn} min={1} max={30} step={1} show={String} onChange={setTurn} />
        <Slider label="Tokens each turn adds" value={perTurn} min={1_000} max={30_000} step={1_000} show={tokens} onChange={setPerTurn} />
        <Slider label="System prompt and tools" value={system} min={5_000} max={40_000} step={1_000} show={tokens} onChange={setSystem} />
        <Slider label="CLAUDE.md, memory, rules" value={project} min={0} max={30_000} step={1_000} show={tokens} onChange={setProject} />
      </div>
      <p className={styles.note}>Example sizes. Run <code>/context</code> in Claude Code to see your own.</p>
    </figure>
  );
}

/* ---------------------------------------------------------------- chat */

const GAP_CHOICES = [1, 3, 10, 20, 45, 120];
const PRESETS: {label: string; gaps: number[]}[] = [
  {label: 'Fast back and forth', gaps: [0, 1, 1, 3, 1, 1, 3, 1]},
  {label: 'Coffee and meetings', gaps: [0, 1, 10, 1, 20, 1, 45, 3]},
  {label: 'Two sessions at once', gaps: [0, 10, 10, 20, 10, 10, 20, 10]},
  {label: 'Back the next day', gaps: [0, 1, 3, 120, 1, 120, 1, 120]},
];

const CHAT_START = 22_000;
const CHAT_PER_TURN = 8_000;

function turnState(t: TurnResult, ttl: Ttl): 'first write' | 'read' | 'expired' {
  return t.turn === 1 ? 'first write' : t.warm[ttl] ? 'read' : 'expired';
}

function chipClass(t: TurnResult, ttl: Ttl): string {
  return t.turn === 1 ? styles.chipFirst : t.warm[ttl] ? styles.chipWarm : styles.chipCold;
}

/** One time limit's side of the chat, drawn as a terminal: each pause as a break line, each turn
 * as what the cache did with it, and a status line that shows where things stand. */
function Terminal({ttl, turns, model}: {ttl: Ttl; turns: TurnResult[]; model: ModelPrice}) {
  const body = useRef<HTMLDivElement>(null);
  const now = turns[turns.length - 1];
  useEffect(() => {
    if (body.current) body.current.scrollTop = body.current.scrollHeight;
  }, [turns.length]);

  return (
    <div className={styles.term} role="group" aria-label={TTL_LABEL[ttl]}>
      <div className={styles.termBar} aria-hidden="true">
        <span className={styles.termDots}>
          <i />
          <i />
          <i />
        </span>
        <span>{TTL_LABEL[ttl]}</span>
      </div>
      <div className={styles.termBody} ref={body}>
        {turns.map((t) => {
          const state = turnState(t, ttl);
          const gone = t.gap > TTL_MINUTES[ttl];
          return (
            <React.Fragment key={t.turn}>
              {t.turn > 1 && (
                <div className={`${styles.termBreak} ${gone ? styles.termBreakLong : ''}`}>
                  <span>
                    ⏲️ {minutes(t.gap)} pause{gone ? ', cache gone' : ''}
                  </span>
                </div>
              )}
              <div className={`${styles.termTurn} ${t === now ? styles.termNew : ''}`}>
                <div className={styles.termLine}>
                  <span>
                    <span className={styles.termPrompt}>&gt;</span> do task #{t.turn}
                  </span>
                  <span className={styles.termPrompt}>{clock(t.elapsed)}</span>
                </div>
                <div
                  className={`${styles.termLine} ${state === 'expired' ? styles.termCold : state === 'read' ? styles.termWarm : styles.termDim}`}>
                  <span>
                    ⏺{' '}
                    {state === 'first write'
                      ? `writes ${tokens(t.prefix)}`
                      : state === 'read'
                        ? `reads ${tokens(t.prefix)} from cache`
                        : `writes all ${tokens(t.prefix)} again`}
                  </span>
                  <span>{money(t.cost[ttl])}</span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className={styles.termStatus}>
        <span className={`${styles.chip} ${chipClass(now, ttl)}`}>{turnState(now, ttl)}</span>
        <span className={styles.termModel}>{model.label}</span>
        <span className={styles.termSoFar}>
          so far <b>{money(now.running[ttl])}</b>
        </span>
      </div>
    </div>
  );
}

export function ChatSim() {
  const [gaps, setGaps] = useState(PRESETS[1].gaps);
  const [model, setModel] = useState(MODELS[0]);
  const [step, setStep] = useState(1);
  const result = useMemo(() => simulate({start: CHAT_START, perTurn: CHAT_PER_TURN, gaps}, model), [gaps, model]);

  const setGap = (i: number, g: number) => setGaps((prev) => prev.map((v, j) => (j === i ? g : v)));
  const last = result.turns.length;
  const shown = result.turns.slice(0, step);
  const now = shown[shown.length - 1];
  const soFar = {'5m': now.running['5m'], '1h': now.running['1h']};

  return (
    <figure className={styles.widget} aria-labelledby="chat-sim-title">
      <figcaption id="chat-sim-title" className={styles.title}>
        A chat with pauses you set
      </figcaption>
      <div className={styles.presets} role="group" aria-label="Example days">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={styles.preset}
            aria-pressed={p.gaps.join() === gaps.join()}
            onClick={() => {
              setGaps(p.gaps);
              setStep(1);
            }}>
            {p.label}
          </button>
        ))}
      </div>
      {/* Click through one turn at a time: the pause, then what each cache did with the turn. */}
      <div className={styles.stepper}>
        <button type="button" className={styles.stepBtn} disabled={step <= 1} onClick={() => setStep(step - 1)}>
          ◀ Back
        </button>
        <span className={styles.stepAt} aria-live="polite">
          Task {step} of {last}
        </span>
        <button type="button" className={styles.stepBtn} disabled={step >= last} onClick={() => setStep(step + 1)}>
          Next ▶
        </button>
        {step < last ? (
          <label className={styles.stepGap}>
            then pause{' '}
            <select value={gaps[step]} onChange={(e) => setGap(step, Number(e.target.value))} className={styles.select}>
              {GAP_CHOICES.map((g) => (
                <option key={g} value={g}>
                  {minutes(g)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <button type="button" className={styles.stepBtn} onClick={() => setStep(1)}>
            Start over
          </button>
        )}
      </div>
      <div className={styles.terms}>
        {TTLS.map((ttl) => (
          <Terminal key={ttl} ttl={ttl} turns={shown} model={model} />
        ))}
      </div>
      <Totals total={soFar} saves={soFar['5m'] - soFar['1h']} />
      <details className={styles.details}>
        <summary>Every turn as a table</summary>
        {/* One row per turn, the two time limits side by side, so the running totals can be
            compared down the page. On a phone the table scrolls inside its own box. */}
        <div className={styles.tableWrap} tabIndex={0} role="region" aria-labelledby="chat-sim-title">
          <table className={styles.chatTable}>
            <thead>
              <tr>
                <th rowSpan={2} scope="col">Turn</th>
                <th rowSpan={2} scope="col">Pause</th>
                <th rowSpan={2} scope="col">Clock</th>
                {TTLS.map((ttl) => (
                  <th key={ttl} colSpan={2} scope="colgroup" className={styles.side}>
                    {TTL_LABEL[ttl]}
                  </th>
                ))}
              </tr>
              <tr>
                {TTLS.map((ttl) => (
                  <React.Fragment key={ttl}>
                    <th scope="col" className={styles.side}>This turn</th>
                    <th scope="col">So far</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.turns.map((t, i) => {
                const cheaper: Ttl | null =
                  Math.abs(t.running['5m'] - t.running['1h']) < 0.0005 ? null : t.running['5m'] < t.running['1h'] ? '5m' : '1h';
                return (
                  <tr key={i}>
                    <th scope="row">{t.turn}</th>
                    <td>
                      {i === 0 ? (
                        <span className={styles.muted}>first message</span>
                      ) : (
                        <select
                          aria-label={`Pause before turn ${t.turn}`}
                          value={t.gap}
                          onChange={(e) => setGap(i, Number(e.target.value))}
                          className={styles.select}>
                          {GAP_CHOICES.map((g) => (
                            <option key={g} value={g}>
                              {minutes(g)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className={styles.num}>{clock(t.elapsed)}</td>
                    {TTLS.map((ttl) => {
                      const state = i === 0 ? 'first write' : t.warm[ttl] ? 'read' : 'expired';
                      const cls = i === 0 ? styles.chipFirst : t.warm[ttl] ? styles.chipWarm : styles.chipCold;
                      return (
                        <React.Fragment key={ttl}>
                          <td className={styles.side}>
                            <span className={`${styles.chip} ${cls}`}>{state}</span>{' '}
                            <span className={styles.num}>{money(t.cost[ttl])}</span>
                          </td>
                          <td className={`${styles.num} ${cheaper === ttl ? styles.cheaper : ''}`}>
                            {money(t.running[ttl])}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
      <ModelPicker value={model} onChange={setModel} />
      <p className={styles.note}>
        Starts at 22k tokens and adds 8k a turn. Each Next is one task you give Claude: the pause before it, then
        what each cache did. The clock on the right is hours and minutes since the first task. "Read" means the cache was still there; "expired"
        means the whole prompt was written again. The bars are the cost so far. Cost of the cached prompt only;
        output costs the same either way.
      </p>
    </figure>
  );
}

function Totals({total, saves}: {total: Record<Ttl, number>; saves: number}) {
  const max = Math.max(total['5m'], total['1h']) || 1;
  const verdict =
    Math.abs(saves) < 0.005
      ? 'About the same either way.'
      : saves > 0
        ? `The 1-hour cache is ${money(saves)} cheaper (${Math.round((100 * saves) / total['5m'])}% less).`
        : `The 5-minute cache is ${money(-saves)} cheaper (${Math.round((-100 * saves) / total['1h'])}% less).`;
  return (
    <div className={styles.totals}>
      {TTLS.map((ttl) => (
        <div key={ttl} className={styles.totalRow}>
          <span className={styles.totalLabel}>{TTL_LABEL[ttl]}</span>
          <span className={styles.totalTrack}>
            <span className={`${styles.totalFill} ${ttl === '1h' ? styles.fillLong : styles.fillShort}`} style={{width: `${(100 * total[ttl]) / max}%`}} />
          </span>
          <span className={styles.totalValue}>{money(total[ttl])}</span>
        </div>
      ))}
      <p className={styles.verdict} aria-live="polite">
        {verdict}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- cost */

export function CostSim() {
  const [model, setModel] = useState(MODELS[0]);
  const [start, setStart] = useState(22_000);
  const [perTurn, setPerTurn] = useState(8_000);
  const [turns, setTurns] = useState(30);
  const [longGap, setLongGap] = useState(20);
  const [every, setEvery] = useState(15);

  const result = useMemo(
    () => simulate({start, perTurn, gaps: pattern(turns, 1, longGap, every)}, model),
    [start, perTurn, turns, longGap, every, model],
  );

  const reuse = breakEvenReuses(model);
  const share = result.written1h ? result.reReadAfterPause / result.written1h : 0;
  const pctOf = (x: number) => `${Math.round(100 * x)}%`;
  const longPauses = every > 0 ? Math.floor((turns - 1) / every) : 0;

  return (
    <figure className={styles.widget} aria-labelledby="cost-sim-title">
      <figcaption id="cost-sim-title" className={styles.title}>
        What a session costs under each time limit
      </figcaption>
      <div className={styles.controls}>
        <ModelPicker value={model} onChange={setModel} />
        <Slider label="Prompt at the start" value={start} min={5_000} max={200_000} step={1_000} show={tokens} onChange={setStart} />
        <Slider label="Tokens each turn adds" value={perTurn} min={1_000} max={40_000} step={1_000} show={tokens} onChange={setPerTurn} />
        <Slider label="Turns" value={turns} min={2} max={80} step={1} show={String} onChange={setTurns} />
        <Slider label="Length of a long pause" value={longGap} min={6} max={180} step={1} show={minutes} onChange={setLongGap} />
        <Slider
          label="A long pause every"
          value={every}
          min={0}
          max={40}
          step={1}
          show={(v) => (v === 0 ? 'never' : `${v} turns`)}
          onChange={setEvery}
        />
      </div>
      <p className={styles.readout}>
        {turns} turns, a minute apart, with {longPauses} pause{longPauses === 1 ? '' : 's'} of {minutes(longGap)}.
      </p>
      <Totals total={result.total} saves={result.oneHourSaves} />
      <div className={styles.share}>
        <div className={styles.shareTrack} aria-hidden="true">
          <span className={styles.shareFill} style={{width: `${Math.min(100, 100 * share)}%`}} />
          <span className={styles.shareMark} style={{left: `${100 * reuse}%`}} />
        </div>
        <p className={styles.readout} aria-live="polite">
          {longGap > 60
            ? `A ${minutes(longGap)} pause outlasts both caches, so nothing is read back after it and the 1-hour cache only adds cost.`
            : `Read back after a long pause: ${pctOf(share)} of everything the 1-hour cache wrote. It wins above ${pctOf(reuse)} (the line).`}
        </p>
      </div>
      <p className={styles.note}>
        On {model.label}, a 1-hour write costs 0.75x the input price more. Each re-use after a 5 to 60 minute pause
        saves {(1.25 - model.read).toFixed(3).replace(/0+$/, '')}x. So the extra pays back once the tokens read back
        after such pauses reach {pctOf(reuse)} of the tokens written. One return late in a long session can do it,
        because it re-reads almost everything written before it.
      </p>
    </figure>
  );
}
