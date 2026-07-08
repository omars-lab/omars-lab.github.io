// MindMap parser : Mermaid mindmap text -> a plain node tree.
//
// Framework-agnostic (no React, no DOM). We parse the same
// mindmap syntax mermaid uses (https://mermaid.js.org/syntax/mindmap.html) so a
// diagram authored for <MindMap> also renders on mermaid.live, but we add ONE
// convention mermaid mindmaps lack: a node whose whole label is a markdown link
// `[Text](href)` becomes a linked node (mermaid renders that as a plain square
// node, which is a fine fallback; we render a real anchor). This is why the
// component parses the syntax itself instead of delegating to mermaid, whose
// mindmap renderer supports neither node links (mermaid-js/mermaid#4099) nor
// reliable per-node theming (mermaid-js/mermaid#5156).
//
// Hierarchy comes from indentation, exactly like mermaid: a line indented more
// than the previous line is its child; less-or-equal pops back up the stack. A
// malformed document throws, which (rendered at build time by the SSG) fails the
// build : an unreadable diagram does not ship. Same blocking-gate philosophy as
// FlowDiagram's computeFlowLayout.

export type MindShape = 'root' | 'square' | 'rounded' | 'circle' | 'bang' | 'cloud' | 'hexagon';

/** Accent names a node can carry (from a mermaid `:::name` class). These map to
 *  the blog's tea-pastel accents in CSS; an unknown class name is ignored. */
export type MindAccent = 'green' | 'mint' | 'pink' | 'blue' | 'amber' | 'violet';
const ACCENTS: readonly MindAccent[] = ['green', 'mint', 'pink', 'blue', 'amber', 'violet'];

export interface MindNode {
  /** Display text, with shape delimiters and markdown-link syntax stripped. */
  label: string;
  /** When the label was a markdown link `[text](href)`, the destination. */
  href?: string;
  shape: MindShape;
  /** Optional accent tint from a mermaid `:::name` class (green/mint/pink/...). */
  accent?: MindAccent;
  children: MindNode[];
}

const INDENT_RE = /^(\s*)(.*)$/;

// A line is a comment if, after indentation, it starts with `%%` (mermaid) .
function isComment(body: string): boolean {
  return body.startsWith('%%');
}

// Match `[text](href)` occupying the ENTIRE body (a linked node). We deliberately
// only treat a whole-label link as a link so ordinary bracketed text (a mermaid
// square node `id[text]`) is not misread.
const WHOLE_LINK_RE = /^\[([^\]]+)\]\(([^)]+)\)$/;

interface ShapeMatch {
  label: string;
  shape: MindShape;
}

// Strip a mermaid shape wrapper from a node body, returning the inner text and the
// shape. Order matters: the double-delimiter forms (`((`, `))(( ` ) must be tried
// before the single ones. An optional leading id (mermaid allows `id[text]`) is
// dropped : we key nodes by structure, not id.
function parseShape(bodyRaw: string): ShapeMatch {
  let body = bodyRaw.trim();

  // Drop a leading identifier before a shape delimiter: `id[text]` -> `[text]`.
  // Only when a shape wrapper actually follows, so a bare word stays intact.
  const idShape = body.match(/^[A-Za-z0-9_-]+([([{].*)$/);
  if (idShape) body = idShape[1];

  const wrappers: Array<[RegExp, MindShape]> = [
    [/^\(\((.*)\)\)$/, 'circle'], // ((text))
    [/^\)(.*)\($/, 'cloud'], // )text(  (mermaid "bang"/cloud-ish); treat as cloud
    [/^\{\{(.*)\}\}$/, 'hexagon'], // {{text}}
    [/^\[\[(.*)\]\]$/, 'square'], // [[text]]
    [/^\[(.*)\]$/, 'square'], // [text]
    [/^\((.*)\)$/, 'rounded'], // (text)
    [/^\{(.*)\}$/, 'rounded'], // {text}
  ];
  for (const [re, shape] of wrappers) {
    const m = body.match(re);
    if (m) return { label: m[1].trim(), shape };
  }
  return { label: body, shape: 'rounded' };
}

// Strip mermaid decorations from a node body: `::icon(fa fa-book)` (dropped) and a
// trailing `:::className` (kept as an accent when the class is a known accent
// name, otherwise dropped). Applied BEFORE shape parsing. Returns the cleaned body
// and any accent.
function stripDecorations(body: string): { body: string; accent?: MindAccent } {
  let accent: MindAccent | undefined;
  const cleaned = body
    .replace(/::icon\([^)]*\)/g, '')
    // Accept mermaid's `text:::name` and the more forgiving `text ::: name`.
    .replace(/\s*:::\s*([A-Za-z0-9_-]+)\s*$/, (_m, cls: string) => {
      if ((ACCENTS as readonly string[]).includes(cls)) accent = cls as MindAccent;
      return '';
    })
    .trim();
  return { body: cleaned, accent };
}

function makeNode(bodyRaw: string, isRootLine: boolean): MindNode {
  const { body, accent } = stripDecorations(bodyRaw);

  // A whole-label markdown link -> linked node. We still respect an outer shape
  // wrapper around the link, e.g. `((` root `))` is checked first below via
  // isRootLine; here we handle the common bare `[text](href)`.
  const linked = body.match(WHOLE_LINK_RE);
  if (linked) {
    return {
      label: linked[1].trim(),
      href: linked[2].trim(),
      shape: isRootLine ? 'root' : 'square',
      accent,
      children: [],
    };
  }

  const { label, shape } = parseShape(body);

  // The link may sit INSIDE a shape wrapper: `(([text](href)))`. Re-check the
  // unwrapped label for a whole-label link.
  const innerLinked = label.match(WHOLE_LINK_RE);
  if (innerLinked) {
    return {
      label: innerLinked[1].trim(),
      href: innerLinked[2].trim(),
      shape: isRootLine ? 'root' : shape,
      accent,
      children: [],
    };
  }

  return {
    label,
    shape: isRootLine ? 'root' : shape,
    accent,
    children: [],
  };
}

export interface ParseResult {
  root: MindNode;
  /** Cross-connection comments preserved from the source (`%% cross-connection: a --> b`). */
  crossConnections: string[];
}

/**
 * Parse mermaid mindmap text into a single-rooted tree. Throws on malformed
 * input (no `mindmap` header, no nodes, or inconsistent indentation), which
 * fails the build when rendered by the SSG.
 */
export function parseMindmap(source: string): ParseResult {
  const rawLines = source.replace(/\r\n?/g, '\n').split('\n');
  const crossConnections: string[] = [];

  // Collect meaningful lines with their indent width; capture cross-connection
  // comments, drop blanks and other comments.
  interface Line {
    indent: number;
    body: string;
    lineNo: number;
  }
  const lines: Line[] = [];
  let sawHeader = false;
  rawLines.forEach((raw, i) => {
    const m = raw.match(INDENT_RE)!;
    const indent = m[1].replace(/\t/g, '  ').length; // tabs count as 2 cols
    const body = m[2].trim();
    if (body === '') return;
    if (!sawHeader) {
      if (body === 'mindmap' || body.startsWith('mindmap ')) {
        sawHeader = true;
        return;
      }
      // Allow a leading Mermaid frontmatter/config block to be ignored gracefully
      // only if it is a comment; anything else before `mindmap` is an error.
      if (isComment(body)) return;
      throw new Error(
        `MindMap: expected a "mindmap" header before any nodes, but line ${
          i + 1
        } was: ${JSON.stringify(body)}. The chart must start with "mindmap".`,
      );
    }
    if (isComment(body)) {
      const cc = body.replace(/^%%\s*/, '');
      if (/cross-connection/i.test(cc)) crossConnections.push(cc.replace(/^cross-connection:\s*/i, ''));
      return;
    }
    lines.push({ indent, body, lineNo: i + 1 });
  });

  if (!sawHeader) {
    throw new Error('MindMap: no "mindmap" header found. The chart must start with "mindmap".');
  }
  if (lines.length === 0) {
    throw new Error('MindMap: the chart has a "mindmap" header but no nodes.');
  }

  // Build the tree from indentation. The first meaningful line is the root; every
  // subsequent line attaches to the nearest ancestor with a smaller indent.
  const rootLine = lines[0];
  const root = makeNode(rootLine.body, /* isRootLine */ true);
  const stack: Array<{ node: MindNode; indent: number }> = [
    { node: root, indent: rootLine.indent },
  ];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.indent <= rootLine.indent) {
      throw new Error(
        `MindMap: line ${line.lineNo} (${JSON.stringify(
          line.body,
        )}) is at or above the root's indentation. A mindmap has exactly one root; ` +
          `indent every other node beneath it.`,
      );
    }
    // Pop the stack until the top is a strict ancestor (smaller indent).
    while (stack.length > 1 && line.indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].node;
    const node = makeNode(line.body, /* isRootLine */ false);
    parent.children.push(node);
    stack.push({ node, indent: line.indent });
  }

  return { root, crossConnections };
}
