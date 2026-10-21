import React, {useId, useMemo, useState} from 'react';
import {
  MODELS,
  type ModelPrice,
  type Ttl,
  breakEvenReuses,
  pattern,
  simulate,
} from './cacheMath';
import styles from './styles.module.css';

// Three small widgets for the "pick the prompt cache's time limit" technique page:
//   <ContextSim/>  what sits in the cached prompt, and how it grows turn by turn
//   <ChatSim/>     a chat you set the pauses for, showing which turns find the cache still there
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

export function ChatSim() {
  const [gaps, setGaps] = useState(PRESETS[1].gaps);
  const [model, setModel] = useState(MODELS[0]);
  const result = useMemo(() => simulate({start: 22_000, perTurn: 8_000, gaps}, model), [gaps, model]);

  const setGap = (i: number, g: number) => setGaps((prev) => prev.map((v, j) => (j === i ? g : v)));

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
            onClick={() => setGaps(p.gaps)}>
            {p.label}
          </button>
        ))}
      </div>
      <ol className={styles.timeline}>
        {result.turns.map((t, i) => (
          <li key={i} className={styles.turn}>
            <div className={styles.turnHead}>
              <span className={styles.turnNo}>Turn {t.turn}</span>
              {i === 0 ? (
                <span className={styles.muted}>first message</span>
              ) : (
                <label className={styles.gapPick}>
                  <span>after</span>
                  <select value={t.gap} onChange={(e) => setGap(i, Number(e.target.value))} className={styles.select}>
                    {GAP_CHOICES.map((g) => (
                      <option key={g} value={g}>
                        {minutes(g)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className={styles.chips}>
              {TTLS.map((ttl) => {
                const state = i === 0 ? 'first write' : t.warm[ttl] ? 'still there, read' : 'expired, written again';
                const cls = i === 0 ? styles.chipFirst : t.warm[ttl] ? styles.chipWarm : styles.chipCold;
                return (
                  <span key={ttl} className={`${styles.chip} ${cls}`}>
                    <span className={styles.chipTtl}>{ttl === '5m' ? '5 min' : '1 hour'}:</span> {state}{' '}
                    <span className={styles.chipCost}>{money(t.cost[ttl])}</span>
                  </span>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <Totals total={result.total} saves={result.oneHourSaves} />
      <ModelPicker value={model} onChange={setModel} />
      <p className={styles.note}>Starts at 22k tokens and adds 8k a turn. Cost of the cached prompt only; output costs the same either way.</p>
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
