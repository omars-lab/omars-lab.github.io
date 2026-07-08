/// <reference types="jest" />
//
// Unit tests for the MindMap layout engine (packages/blog-ui). Layout is pure and
// deterministic; these tests lock in that determinism and that nodes never
// overlap (the readability contract).

import { parseMindmap } from '../../../packages/blog-ui/src/components/MindMap/parser';
import { computeMindLayout } from '../../../packages/blog-ui/src/components/MindMap/layout';

const CHART = `
mindmap
  root((Orchestrating Roles))
    The Starter
    The Executor
    The Finisher
`;

function layout(chart = CHART, mode: 'ltr' | 'spread' = 'ltr') {
  const { root } = parseMindmap(chart);
  return computeMindLayout(root, 'Orchestrating Roles', mode);
}

describe('computeMindLayout : determinism', () => {
  it('produces identical geometry across runs', () => {
    expect(layout()).toEqual(layout());
  });

  it('places every parsed node', () => {
    const m = layout();
    expect(m.nodes).toHaveLength(4); // root + 3 children
    expect(m.connectors).toHaveLength(3); // one per child
  });

  it('keeps the whole figure within the reported viewBox and non-negative', () => {
    const m = layout();
    for (const n of m.nodes) {
      expect(n.cx - n.w / 2).toBeGreaterThanOrEqual(0);
      expect(n.cy - n.h / 2).toBeGreaterThanOrEqual(0);
      expect(n.cx + n.w / 2).toBeLessThanOrEqual(m.svgW);
      expect(n.cy + n.h / 2).toBeLessThanOrEqual(m.svgH);
    }
  });
});

describe('computeMindLayout : no overlap', () => {
  it('does not overlap sibling boxes (ltr)', () => {
    const m = layout();
    const boxes = m.nodes.map((n) => ({
      x1: n.cx - n.w / 2,
      x2: n.cx + n.w / 2,
      y1: n.cy - n.h / 2,
      y2: n.cy + n.h / 2,
    }));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
        expect(overlap).toBe(false);
      }
    }
  });

  it('handles a deep nested tree without throwing', () => {
    const deep = `
mindmap
  root((R))
    A
      A1
        A1a
      A2
    B
      B1
`;
    const m = layout(deep);
    expect(m.nodes.length).toBe(7);
    // depth increases column x: root < A < A1 < A1a
    const byLabel = Object.fromEntries(m.nodes.map((n) => [n.label, n]));
    expect(byLabel['A'].cx).toBeGreaterThan(byLabel['R'].cx);
    expect(byLabel['A1'].cx).toBeGreaterThan(byLabel['A'].cx);
    expect(byLabel['A1a'].cx).toBeGreaterThan(byLabel['A1'].cx);
  });
});

describe('computeMindLayout : spread', () => {
  it('splits top-level branches to both sides of the root', () => {
    const m = layout(CHART, 'spread');
    const root = m.nodes.find((n) => n.depth === 0)!;
    const sides = new Set(m.nodes.filter((n) => n.depth === 1).map((n) => n.side));
    // With 3 children spread balances 1 vs 2, so both sides are used.
    expect(sides.has('left')).toBe(true);
    expect(sides.has('right')).toBe(true);
    // Left children sit left of root center; right children sit right.
    for (const n of m.nodes.filter((x) => x.depth === 1)) {
      if (n.side === 'left') expect(n.cx).toBeLessThan(root.cx);
      if (n.side === 'right') expect(n.cx).toBeGreaterThan(root.cx);
    }
  });
});

describe('computeMindLayout : density', () => {
  it('compact yields a smaller figure than comfortable', () => {
    const deep = `
mindmap
  root((R))
    A
      A1
      A2
    B
      B1
`;
    const comfy = layout(deep, 'ltr');
    const { root } = parseMindmap(deep);
    const compact = computeMindLayout(root, 'Orchestrating Roles', 'ltr', 'compact');
    expect(compact.svgW).toBeLessThan(comfy.svgW);
    expect(compact.svgH).toBeLessThan(comfy.svgH);
    // node count unchanged
    expect(compact.nodes.length).toBe(comfy.nodes.length);
  });

  it('does not overlap boxes in compact mode', () => {
    const { root } = parseMindmap(CHART);
    const m = computeMindLayout(root, 'Orchestrating Roles', 'ltr', 'compact');
    const boxes = m.nodes.map((n) => ({
      x1: n.cx - n.w / 2,
      x2: n.cx + n.w / 2,
      y1: n.cy - n.h / 2,
      y2: n.cy + n.h / 2,
    }));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
        expect(overlap).toBe(false);
      }
    }
  });
});

describe('computeMindLayout : accent survives to placed node', () => {
  it('carries the accent onto the placed node', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    Ship:::green
`);
    const m = computeMindLayout(root, 'X');
    expect(m.nodes.find((n) => n.label === 'Ship')!.accent).toBe('green');
  });
});

describe('computeMindLayout : link metadata survives', () => {
  it('carries href onto the placed node', () => {
    const m = layout(`
mindmap
  root((R))
    [Start](#start)
`);
    const linked = m.nodes.find((n) => n.label === 'Start')!;
    expect(linked.href).toBe('#start');
  });
});
