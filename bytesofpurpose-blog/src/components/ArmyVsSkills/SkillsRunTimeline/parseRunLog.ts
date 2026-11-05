// Parses a run log (one JSON object per line) into one span per agent. Pure: no React, so the
// parser can be unit-tested on its own.
//
// Line shape: {"t": seconds, "agent": id, "ev": "start" | "stop", "label"?: str, "costUsd"?: num}

export interface AgentSpan {
  id: string;
  label: string;
  start: number;
  end: number;
  costUsd: number;
}

export interface RunTimelineData {
  agents: AgentSpan[];
  totalSeconds: number;
  totalCostUsd: number;
}

interface RunEvent {
  t: number;
  agent: string;
  ev: 'start' | 'stop';
  label?: string;
  costUsd?: number;
}

function toEvent(line: string): RunEvent | null {
  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const {t, agent, ev, label, costUsd} = raw as Record<string, unknown>;
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) return null;
  if (typeof agent !== 'string' || agent === '') return null;
  if (ev !== 'start' && ev !== 'stop') return null;
  return {
    t,
    agent,
    ev,
    label: typeof label === 'string' && label.trim() !== '' ? label : undefined,
    costUsd: typeof costUsd === 'number' && Number.isFinite(costUsd) ? costUsd : undefined,
  };
}

export function parseRunLog(text: string): RunTimelineData {
  const events = (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '')
    .map(toEvent)
    .filter((e): e is RunEvent => e !== null)
    // Stable sort, so lines that share a `t` keep their log order.
    .sort((a, b) => a.t - b.t);

  const totalSeconds = events.reduce((max, e) => Math.max(max, e.t), 0);

  // An agent that starts again after stopping keeps one bar: first start to last stop, costs summed.
  const spans = new Map<string, AgentSpan & {open: boolean}>();
  for (const e of events) {
    const span = spans.get(e.agent);
    if (e.ev === 'start') {
      if (!span) {
        spans.set(e.agent, {
          id: e.agent,
          label: e.label ?? e.agent,
          start: e.t,
          end: e.t,
          costUsd: 0,
          open: true,
        });
      } else {
        span.open = true;
      }
    } else if (span && span.open) {
      span.open = false;
      span.end = e.t;
      span.costUsd += e.costUsd ?? 0;
    }
    // A stop with no open start is skipped.
  }

  const agents: AgentSpan[] = [...spans.values()].map(({open, ...span}) => ({
    ...span,
    end: open ? totalSeconds : span.end,
  }));
  const totalCostUsd = agents.reduce((sum, a) => sum + a.costUsd, 0);

  return {agents, totalSeconds, totalCostUsd};
}
