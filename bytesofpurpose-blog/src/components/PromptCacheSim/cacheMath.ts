// The cost maths behind the prompt cache widgets on the "pick the prompt cache's time limit" page.
// Plain functions, no React, so a unit test can check them (test/unit/cacheMath.test.ts).
//
// Prices are list prices from https://platform.claude.com/docs/en/about-claude/pricing, checked
// 2026-10-21. Writing to the cache costs 1.25x the input price for a 5-minute life and 2x for a
// 1-hour life, on every model. Reading it back costs `read` times the input price.

export type Ttl = '5m' | '1h';

export type ModelPrice = {
  id: string;
  label: string;
  /** Dollars per million input tokens. */
  input: number;
  /** Cache read price as a multiple of the input price. */
  read: number;
};

export const MODELS: ModelPrice[] = [
  {id: 'opus-5-5', label: 'Opus 5.5', input: 4, read: 0.05},
  {id: 'sonnet-5-5', label: 'Sonnet 5.5', input: 2, read: 0.05},
  {id: 'fable-5-1', label: 'Fable 5.1', input: 10, read: 0.025},
  {id: 'opus-4-5', label: 'Opus 4.5 to 5', input: 5, read: 0.1},
  {id: 'sonnet-4-6', label: 'Sonnet 4.5 / 4.6', input: 3, read: 0.1},
  {id: 'haiku-4-5', label: 'Haiku 4.5', input: 1, read: 0.1},
];

export const WRITE: Record<Ttl, number> = {'5m': 1.25, '1h': 2};
export const TTL_MINUTES: Record<Ttl, number> = {'5m': 5, '1h': 60};

export type Session = {
  /** Tokens in the prompt before the first turn: system prompt, tools, CLAUDE.md, memory. */
  start: number;
  /** Tokens each turn adds to the conversation (your message, tool output, Claude's reply). */
  perTurn: number;
  /** Minutes of pause before each turn. The first entry is ignored: turn one always writes. */
  gaps: number[];
};

export type TurnResult = {
  turn: number;
  gap: number;
  /** Minutes since the first turn, when this turn is sent. */
  elapsed: number;
  /** Tokens already in the prompt when this turn is sent. */
  prefix: number;
  warm: Record<Ttl, boolean>;
  /** Dollars this turn costs for its cached prompt, under each time limit. */
  cost: Record<Ttl, number>;
  /** Dollars spent so far, this turn included, under each time limit. */
  running: Record<Ttl, number>;
};

export type SessionResult = {
  turns: TurnResult[];
  total: Record<Ttl, number>;
  /** Positive when the 1-hour cache is cheaper. */
  oneHourSaves: number;
  /** Tokens written to the 1-hour cache over the session (first turn, new tokens, re-writes). */
  written1h: number;
  /** Tokens read back after a 5 to 60 minute pause: the reads only the 1-hour cache gets. */
  reReadAfterPause: number;
};

/** Is the cache still there after a pause of `gapMinutes`? Every hit restarts the clock, so only
 * the pause since the last request matters. */
export function isWarm(gapMinutes: number, ttl: Ttl): boolean {
  return gapMinutes <= TTL_MINUTES[ttl];
}

/**
 * Cost of one session's cached prompt under both time limits. Each turn either reads the prompt so
 * far from the cache (warm) or writes all of it again (expired), then writes what the turn added.
 * Output tokens and the few uncached input tokens cost the same either way, so they are left out.
 */
export function simulate(session: Session, model: ModelPrice): SessionResult {
  const perToken = model.input / 1e6;
  const total: Record<Ttl, number> = {'5m': 0, '1h': 0};
  let written1h = 0;
  let reReadAfterPause = 0;
  let elapsed = 0;
  const turns: TurnResult[] = session.gaps.map((gap, i) => {
    if (i > 0) elapsed += gap;
    const prefix = session.start + i * session.perTurn;
    const warm = {'5m': i > 0 && isWarm(gap, '5m'), '1h': i > 0 && isWarm(gap, '1h')};
    const cost = {'5m': 0, '1h': 0};
    for (const ttl of ['5m', '1h'] as Ttl[]) {
      const old = warm[ttl] ? prefix * model.read : prefix * WRITE[ttl];
      cost[ttl] = (old + session.perTurn * WRITE[ttl]) * perToken;
      total[ttl] += cost[ttl];
    }
    written1h += (warm['1h'] ? 0 : prefix) + session.perTurn;
    if (warm['1h'] && !warm['5m']) reReadAfterPause += prefix;
    return {turn: i + 1, gap, elapsed, prefix, warm, cost, running: {...total}};
  });
  return {turns, total, oneHourSaves: total['5m'] - total['1h'], written1h, reReadAfterPause};
}

/**
 * The break-even for the 1-hour cache: 0.75 / (1.25 - read price). The 1-hour write costs 0.75x
 * input more; each re-use after a 5 to 60 minute pause saves 1.25x (the 5-minute re-write) minus
 * the read price.
 *
 * Read it two ways. For one prompt written once, it is how many such re-uses pay back the extra
 * write (under 1 means a single re-use covers it). For a whole session, the 1-hour cache is cheaper
 * exactly when `reReadAfterPause / written1h` beats it, because
 * `oneHourSaves = input price x (reReadAfterPause x (1.25 - read) - written1h x 0.75)`.
 */
export function breakEvenReuses(model: ModelPrice): number {
  return (WRITE['1h'] - WRITE['5m']) / (WRITE['5m'] - model.read);
}

/** A session with short pauses, and one longer pause every `every` turns. */
export function pattern(turns: number, quickGap: number, longGap: number, every: number): number[] {
  return Array.from({length: turns}, (_, i) => (i > 0 && every > 0 && i % every === 0 ? longGap : quickGap));
}
