/**
 * Unit proof for the prompt cache cost maths behind the widgets on the
 * "pick the prompt cache's time limit" technique page.
 */
/// <reference types="jest" />

import {
  MODELS,
  breakEvenReuses,
  isWarm,
  pattern,
  simulate,
} from '../../src/components/PromptCacheSim/cacheMath';

const opus55 = MODELS.find((m) => m.id === 'opus-5-5')!;
const haiku45 = MODELS.find((m) => m.id === 'haiku-4-5')!;

describe('isWarm', () => {
  it('keeps the 5-minute cache up to 5 minutes and the 1-hour cache up to 60', () => {
    expect(isWarm(5, '5m')).toBe(true);
    expect(isWarm(6, '5m')).toBe(false);
    expect(isWarm(60, '1h')).toBe(true);
    expect(isWarm(61, '1h')).toBe(false);
  });
});

describe('simulate', () => {
  it('makes the 5-minute cache cheaper when every pause is short', () => {
    const r = simulate({start: 100_000, perTurn: 5_000, gaps: pattern(10, 1, 1, 0)}, opus55);
    expect(r.turns.every((t) => t.turn === 1 || (t.warm['5m'] && t.warm['1h']))).toBe(true);
    expect(r.oneHourSaves).toBeLessThan(0);
  });

  it('makes the 1-hour cache cheaper after a single 10-minute pause', () => {
    const gaps = [0, 1, 10, 1];
    const r = simulate({start: 100_000, perTurn: 5_000, gaps}, opus55);
    expect(r.turns[2].warm).toEqual({'5m': false, '1h': true});
    expect(r.oneHourSaves).toBeGreaterThan(0);
  });

  it('makes the 5-minute cache cheaper when every pause is over an hour', () => {
    const r = simulate({start: 100_000, perTurn: 5_000, gaps: pattern(5, 90, 90, 0)}, opus55);
    expect(r.turns.slice(1).every((t) => !t.warm['5m'] && !t.warm['1h'])).toBe(true);
    // Both write everything every turn; the 1-hour write just costs more.
    expect(r.total['1h'] / r.total['5m']).toBeCloseTo(2 / 1.25, 6);
  });

  it('prices a turn exactly: warm read plus the new tokens written', () => {
    const r = simulate({start: 1_000_000, perTurn: 0, gaps: [0, 1]}, haiku45);
    // Turn 2 reads 1M tokens at 0.1x of $1/M.
    expect(r.turns[1].cost['5m']).toBeCloseTo(0.1, 9);
    expect(r.turns[1].cost['1h']).toBeCloseTo(0.1, 9);
    // Turn 1 writes 1M tokens: $1.25 at 5 minutes, $2 at 1 hour.
    expect(r.turns[0].cost['5m']).toBeCloseTo(1.25, 9);
    expect(r.turns[0].cost['1h']).toBeCloseTo(2, 9);
  });
});

describe('the break-even share', () => {
  it('decides the winner exactly: re-reads after a pause against everything written', () => {
    for (const every of [0, 3, 7, 10, 14, 15, 29]) {
      for (const longGap of [10, 45, 90]) {
        const r = simulate({start: 22_000, perTurn: 8_000, gaps: pattern(30, 1, longGap, every)}, opus55);
        const predicted = (r.reReadAfterPause * (1.25 - opus55.read) - r.written1h * 0.75) * (opus55.input / 1e6);
        expect(r.oneHourSaves).toBeCloseTo(predicted, 9);
        expect(r.oneHourSaves > 0).toBe(r.reReadAfterPause / r.written1h > breakEvenReuses(opus55));
      }
    }
  });
});

describe('breakEvenReuses', () => {
  it('is under one re-use on every model', () => {
    for (const m of MODELS) expect(breakEvenReuses(m)).toBeLessThan(1);
    expect(breakEvenReuses(haiku45)).toBeCloseTo(0.75 / 1.15, 9);
    expect(breakEvenReuses(opus55)).toBeCloseTo(0.75 / 1.2, 9);
  });
});

describe('pattern', () => {
  it('puts a long pause every n turns, never before the first', () => {
    expect(pattern(7, 1, 20, 3)).toEqual([1, 1, 1, 20, 1, 1, 20]);
    expect(pattern(3, 2, 20, 0)).toEqual([2, 2, 2]);
  });
});
