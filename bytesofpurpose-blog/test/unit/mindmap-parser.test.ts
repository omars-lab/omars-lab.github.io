/// <reference types="jest" />
//
// Unit tests for the MindMap parser (packages/blog-ui). The parser turns Mermaid
// mindmap text into a node tree and is the build-time gate: malformed input MUST
// throw so the SSG build fails rather than shipping an unreadable diagram.

import { parseMindmap } from '../../../packages/blog-ui/src/components/MindMap/parser';

describe('parseMindmap : structure', () => {
  it('builds a single-root tree from indentation', () => {
    const { root } = parseMindmap(`
mindmap
  root((Orchestrating Roles))
    The Starter
    The Executor
    The Finisher
`);
    expect(root.label).toBe('Orchestrating Roles');
    expect(root.shape).toBe('root');
    expect(root.children.map((c) => c.label)).toEqual([
      'The Starter',
      'The Executor',
      'The Finisher',
    ]);
  });

  it('nests deeper indentation as descendants', () => {
    const { root } = parseMindmap(`
mindmap
  root((Purpose))
    Vision
      The WHAT
        Highest level
    Mission
`);
    const vision = root.children.find((c) => c.label === 'Vision')!;
    expect(vision.children.map((c) => c.label)).toEqual(['The WHAT']);
    expect(vision.children[0].children.map((c) => c.label)).toEqual(['Highest level']);
    expect(root.children.map((c) => c.label)).toEqual(['Vision', 'Mission']);
  });

  it('pops back up the stack when indentation decreases', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    A
      A1
    B
`);
    expect(root.children.map((c) => c.label)).toEqual(['A', 'B']);
    expect(root.children[0].children.map((c) => c.label)).toEqual(['A1']);
    expect(root.children[1].children).toHaveLength(0);
  });
});

describe('parseMindmap : shapes', () => {
  it('maps mermaid shape delimiters', () => {
    const { root } = parseMindmap(`
mindmap
  root((Root))
    id1[Square]
    id2(Rounded)
    {{Hexagon}}
    ((Circle))
`);
    const byLabel = Object.fromEntries(root.children.map((c) => [c.label, c.shape]));
    expect(byLabel['Square']).toBe('square');
    expect(byLabel['Rounded']).toBe('rounded');
    expect(byLabel['Hexagon']).toBe('hexagon');
    expect(byLabel['Circle']).toBe('circle');
  });

  it('drops a leading id before a shape', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    node1[Labelled]
`);
    expect(root.children[0].label).toBe('Labelled');
  });

  it('strips ::icon() and :::class decorations', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    Idea ::icon(fa fa-book)
    Styled:::urgent
`);
    expect(root.children.map((c) => c.label)).toEqual(['Idea', 'Styled']);
  });
});

describe('parseMindmap : links', () => {
  it('treats a whole-label markdown link as a linked node', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    [The Starter](#the-starter)
    [Elsewhere](/blog/other#anchor)
    [External](https://example.com)
`);
    const [a, b, c] = root.children;
    expect(a.label).toBe('The Starter');
    expect(a.href).toBe('#the-starter');
    expect(b.href).toBe('/blog/other#anchor');
    expect(c.href).toBe('https://example.com');
  });

  it('does not treat a square node as a link', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    [Just a square]
`);
    expect(root.children[0].href).toBeUndefined();
    expect(root.children[0].label).toBe('Just a square');
  });

  it('unwraps a link inside a shape wrapper', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    (([Deep](#x)))
`);
    expect(root.children[0].label).toBe('Deep');
    expect(root.children[0].href).toBe('#x');
  });
});

describe('parseMindmap : comments + cross-connections', () => {
  it('ignores %% comments but captures cross-connections', () => {
    const { root, crossConnections } = parseMindmap(`
mindmap
  root((R))
    A
    B

%% cross-connection: A --> B
%% just a note
`);
    expect(root.children.map((c) => c.label)).toEqual(['A', 'B']);
    expect(crossConnections).toEqual(['A --> B']);
  });
});

describe('parseMindmap : accents', () => {
  it('captures a `:::name` accent (mermaid style, no spaces)', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    Ship it:::green
`);
    expect(root.children[0].label).toBe('Ship it');
    expect(root.children[0].accent).toBe('green');
  });

  it('also accepts a forgiving `text ::: name` with spaces', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    Risky ::: pink
`);
    expect(root.children[0].label).toBe('Risky');
    expect(root.children[0].accent).toBe('pink');
  });

  it('ignores an unknown class name (no accent, class stripped)', () => {
    const { root } = parseMindmap(`
mindmap
  root((R))
    Thing:::whatever
`);
    expect(root.children[0].label).toBe('Thing');
    expect(root.children[0].accent).toBeUndefined();
  });
});

describe('parseMindmap : malformed input throws (build gate)', () => {
  it('throws when the mindmap header is missing', () => {
    expect(() => parseMindmap('root((R))\n  A')).toThrow(/mindmap/i);
  });

  it('throws when there are no nodes', () => {
    expect(() => parseMindmap('mindmap\n')).toThrow(/no nodes/i);
  });

  it('throws on a second root at the root indentation level', () => {
    expect(() =>
      parseMindmap(`
mindmap
  root((R))
  SecondRoot
`),
    ).toThrow(/one root/i);
  });
});
