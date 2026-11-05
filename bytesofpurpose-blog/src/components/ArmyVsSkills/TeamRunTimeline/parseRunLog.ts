/**
 * parseRunLog turns a JSONL run log (one event per line) into one entry per agent.
 *
 *   {"t":0,"agent":"lead","ev":"start","label":"Lead"}
 *   {"t":402,"agent":"lead","ev":"stop","costUsd":1.47}
 *
 * `t` is seconds since run start. Blank and malformed lines are skipped, never thrown on.
 */

export interface RunAgent {
  id: string;
  label: string;
  /** Seconds since run start of the agent's first `start`. */
  start: number;
  /** Seconds since run start of the agent's last `stop` (or the log's max `t` if still open). */
  end: number;
  /** Sum of the agent's stop costs. */
  costUsd: number;
}

export interface RunLog {
  agents: RunAgent[];
  totalSeconds: number;
  totalCostUsd: number;
}

interface RunEvent {
  t: number;
  agent: string;
  ev: 'start' | 'stop';
  label?: string;
  costUsd: number;
}

/** Trims float noise from summed costs (e.g. 4.040000000000001 -> 4.04). */
function tidy(n: number): number {
  const scaled = n * 1e6;
  return Number.isFinite(scaled) ? Math.round(scaled) / 1e6 : n;
}

function parseLine(line: string): RunEvent | null {
  const trimmed = line.trim();
  if (trimmed === '') return null;
  let raw: unknown;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const {t, agent, ev, label, costUsd} = obj;
  if (typeof agent !== 'string' || agent === '') return null;
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) return null;
  if (ev !== 'start' && ev !== 'stop') return null;
  return {
    t,
    agent,
    ev,
    label: typeof label === 'string' && label !== '' ? label : undefined,
    costUsd: typeof costUsd === 'number' && Number.isFinite(costUsd) && costUsd > 0 ? costUsd : 0,
  };
}

export function parseRunLog(text: string): RunLog {
  const events: RunEvent[] = [];
  for (const line of (typeof text === 'string' ? text : '').split(/\r?\n/)) {
    const event = parseLine(line);
    if (event) events.push(event);
  }

  // Per spec: the max `t` over every valid line, not just lines that pair into a lane.
  const totalSeconds = events.reduce((max, e) => Math.max(max, e.t), 0);

  // Pair events in time order. At equal t a start goes before a stop (so a stop listed first
  // still closes its lane), then file order.
  const ordered = events
    .map((e, i) => ({e, i}))
    .sort(
      (a, b) =>
        a.e.t - b.e.t || (a.e.ev === b.e.ev ? 0 : a.e.ev === 'start' ? -1 : 1) || a.i - b.i,
    )
    .map(({e}) => e);

  const byId = new Map<string, RunAgent & {open: boolean}>();
  for (const e of ordered) {
    const agent = byId.get(e.agent);
    if (e.ev === 'start') {
      if (!agent) {
        byId.set(e.agent, {
          id: e.agent,
          label: e.label ?? e.agent,
          start: e.t,
          end: e.t,
          costUsd: 0,
          open: true,
        });
      } else {
        if (agent.label === agent.id && e.label) agent.label = e.label;
        agent.open = true;
      }
    } else if (agent) {
      agent.end = e.t;
      agent.costUsd = tidy(agent.costUsd + e.costUsd);
      agent.open = false;
    }
  }

  const agents: RunAgent[] = [...byId.values()].map(({open, ...a}) => ({
    ...a,
    end: open ? totalSeconds : a.end,
  }));
  const totalCostUsd = tidy(agents.reduce((sum, a) => sum + a.costUsd, 0));

  return {agents, totalSeconds, totalCostUsd};
}

/** "143s"; fractional durations keep one decimal ("1.5s"). */
export function formatSeconds(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}s`;
}

/** "$0.84": always two decimals. */
export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}
