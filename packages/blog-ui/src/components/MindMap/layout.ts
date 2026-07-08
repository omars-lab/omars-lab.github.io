// MindMap layout engine : a node tree -> fully-placed geometry.
//
// Pure and deterministic (no React, no DOM, no getBBox, no random), so the exact
// same layout renders in the browser, in SSR, in Jest, and in the standalone SVG
// preview CLI (scripts/render-mindmap.mjs). Given the tree from parser.ts it
// returns placed nodes + connector paths + the svg viewBox, laid out as a tidy
// tree.
//
// Two layouts:
//   ltr    : root at the left, the tree grows rightward, depth -> column. This is
//            the readable default for a mindmap embedded in a reading column.
//   spread : MindNode's look : the root is centered and its top-level branches are
//            split to the left and right, each side growing outward. Matches the
//            original .mindnode QuickLook preview, which is why it exists.
//
// Node width is measured from the label length (no font metrics available at
// layout time, so we approximate: an em-width per character plus padding, capped).
// Vertical placement is the classic "tidy tree" first pass : a leaf takes one row;
// a parent centers on the vertical span of its children.

import type { MindNode, MindShape, MindAccent } from './parser';

export type MindLayout = 'ltr' | 'spread';
export type MindDensity = 'comfortable' | 'compact';

export interface PlacedMindNode {
  label: string;
  href?: string;
  shape: MindShape;
  accent?: MindAccent;
  depth: number;
  /** Index in a stable pre-order walk : used for staggered enter animation. */
  order: number;
  /** Center of the node box. */
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** Which half of a `spread` layout the node lives on (root: 'center'). */
  side: 'left' | 'right' | 'center';
}

export interface MindConnector {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Cubic-bezier path string for a smooth branch. */
  path: string;
  /** Depth of the CHILD end : used to taper stroke width with depth. */
  depth: number;
}

export interface MindMapLayout {
  salt: string;
  layout: MindLayout;
  svgW: number;
  svgH: number;
  nodes: PlacedMindNode[];
  connectors: MindConnector[];
}

// ---- Geometry constants ---------------------------------------------------
const CHAR_W = 7.6; // approx px per character at our font size
const LABEL_PAD_X = 22; // horizontal padding inside a node box
const NODE_MIN_W = 56;
const NODE_MAX_W = 260;
const ROOT_MIN_W = 96;
const PAD = 28; // outer padding around the whole figure

// Density-tunable metrics. computeMindLayout sets these once per call before any
// helper runs; layout is synchronous + single-threaded, so module scope is safe
// and keeps the pure helpers' signatures unchanged. 'compact' tightens spacing so
// large maps (hundreds of nodes) are less sprawling.
const DENSITY: Record<MindDensity, { NODE_H: number; H_GAP: number; V_GAP: number }> = {
  comfortable: { NODE_H: 40, H_GAP: 84, V_GAP: 18 },
  compact: { NODE_H: 30, H_GAP: 52, V_GAP: 9 },
};
let NODE_H = DENSITY.comfortable.NODE_H;
let H_GAP = DENSITY.comfortable.H_GAP;
let V_GAP = DENSITY.comfortable.V_GAP;

function nodeWidth(label: string, isRoot: boolean): number {
  const raw = label.length * CHAR_W + LABEL_PAD_X * 2;
  const min = isRoot ? ROOT_MIN_W : NODE_MIN_W;
  return Math.max(min, Math.min(NODE_MAX_W, Math.round(raw)));
}

// Depth-first count of the leaves under a node (a subtree's vertical weight).
function leafCount(node: MindNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + leafCount(c), 0);
}

interface Placed {
  node: MindNode;
  depth: number;
  side: 'left' | 'right' | 'center';
  cx: number;
  cy: number;
  w: number;
}

// Assign each node a row band [top, bottom) sized to its leaf count, then center
// each node on its band. `dir` is +1 (rightward/ltr) ; sides handle their own x.
function layoutSide(
  root: MindNode,
  children: MindNode[],
  side: 'left' | 'right' | 'center',
  rootCx: number,
  dir: 1 | -1,
  out: Placed[],
  cursor: { y: number },
): { top: number; bottom: number } {
  // Column x for each depth. Depth 1 children sit one H_GAP + halfwidths from root.
  // We compute x lazily per node as we descend, tracking the running right edge.
  function place(node: MindNode, depth: number, parentRightEdge: number): { top: number; bottom: number } {
    const w = nodeWidth(node.label, depth === 0);
    const cx = dir === 1 ? parentRightEdge + H_GAP + w / 2 : parentRightEdge - H_GAP - w / 2;
    const nextEdge = dir === 1 ? cx + w / 2 : cx - w / 2;

    if (node.children.length === 0) {
      const top = cursor.y;
      const cy = top + NODE_H / 2;
      cursor.y = top + NODE_H + V_GAP;
      out.push({ node, depth, side, cx, cy, w });
      return { top, bottom: cursor.y };
    }

    let top = Infinity;
    let bottom = -Infinity;
    for (const child of node.children) {
      const span = place(child, depth + 1, nextEdge);
      top = Math.min(top, span.top);
      bottom = Math.max(bottom, span.bottom);
    }
    const cy = (top + (bottom - V_GAP)) / 2; // center on children's true span
    out.push({ node, depth, side, cx, cy, w });
    return { top, bottom };
  }

  let top = Infinity;
  let bottom = -Infinity;
  const rootHalfW = nodeWidth(root.label, true) / 2;
  const startEdge = dir === 1 ? rootCx + rootHalfW : rootCx - rootHalfW;
  for (const child of children) {
    const span = place(child, 1, startEdge);
    top = Math.min(top, span.top);
    bottom = Math.max(bottom, span.bottom);
  }
  return { top: top === Infinity ? cursor.y : top, bottom: bottom === -Infinity ? cursor.y : bottom };
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'mind';
}

/**
 * Compute the full mindmap layout. Deterministic. Never throws on a well-formed
 * tree (the parser is the gate for malformed input); an empty tree yields a lone
 * root node.
 */
export function computeMindLayout(
  root: MindNode,
  title: string,
  layout: MindLayout = 'ltr',
  density: MindDensity = 'comfortable',
): MindMapLayout {
  // Set the density-tunable metrics for this run (see DENSITY above).
  const d = DENSITY[density] ?? DENSITY.comfortable;
  NODE_H = d.NODE_H;
  H_GAP = d.H_GAP;
  V_GAP = d.V_GAP;

  const salt = slug(title);
  const placed: Placed[] = [];

  // Root center is provisional; we normalize coordinates at the end.
  const rootCx = 0;

  if (layout === 'spread' && root.children.length > 1) {
    // Split top-level branches left/right, alternating by leaf-weight to balance.
    const branches = [...root.children];
    const withWeight = branches.map((b) => ({ b, w: leafCount(b) }));
    const right: MindNode[] = [];
    const left: MindNode[] = [];
    let rw = 0;
    let lw = 0;
    // Greedy balance: assign each branch (largest first) to the lighter side.
    for (const { b, w } of [...withWeight].sort((a, z) => z.w - a.w)) {
      if (rw <= lw) {
        right.push(b);
        rw += w;
      } else {
        left.push(b);
        lw += w;
      }
    }
    // Preserve source order within each side.
    const rightOrdered = branches.filter((b) => right.includes(b));
    const leftOrdered = branches.filter((b) => left.includes(b));

    const rCursor = { y: PAD };
    const rSpan = layoutSide(root, rightOrdered, 'right', rootCx, 1, placed, rCursor);
    const lCursor = { y: PAD };
    const lSpan = layoutSide(root, leftOrdered, 'left', rootCx, -1, placed, lCursor);

    const rootCy = ((rSpan.top + rSpan.bottom + lSpan.top + lSpan.bottom) / 2 - V_GAP) / 2 + PAD / 2;
    placed.push({ node: root, depth: 0, side: 'center', cx: rootCx, cy: rootCy, w: nodeWidth(root.label, true) });
  } else {
    const cursor = { y: PAD };
    const span = layoutSide(root, root.children, 'right', rootCx, 1, placed, cursor);
    const rootCy = root.children.length ? (span.top + span.bottom - V_GAP) / 2 : PAD + NODE_H / 2;
    placed.push({ node: root, depth: 0, side: 'center', cx: rootCx, cy: rootCy, w: nodeWidth(root.label, true) });
  }

  // Normalize coordinates so the whole figure sits at PAD,PAD with no negatives.
  const minX = Math.min(...placed.map((p) => p.cx - p.w / 2));
  const minY = Math.min(...placed.map((p) => p.cy - NODE_H / 2));
  const dx = PAD - minX;
  const dy = PAD - minY;
  for (const p of placed) {
    p.cx += dx;
    p.cy += dy;
  }

  const maxX = Math.max(...placed.map((p) => p.cx + p.w / 2));
  const maxY = Math.max(...placed.map((p) => p.cy + NODE_H / 2));
  const svgW = Math.round(maxX + PAD);
  const svgH = Math.round(maxY + PAD);

  // Stable pre-order for animation ordering + connectors (parent -> child).
  const order = new Map<MindNode, number>();
  let counter = 0;
  (function walk(n: MindNode) {
    order.set(n, counter++);
    for (const c of n.children) walk(c);
  })(root);

  const placedByNode = new Map<MindNode, Placed>();
  for (const p of placed) placedByNode.set(p.node, p);

  const nodes: PlacedMindNode[] = placed
    .map((p) => ({
      label: p.node.label,
      href: p.node.href,
      shape: p.node.shape,
      accent: p.node.accent,
      depth: p.depth,
      order: order.get(p.node) ?? 0,
      cx: p.cx,
      cy: p.cy,
      w: p.w,
      h: NODE_H,
      side: p.side,
    }))
    .sort((a, b) => a.order - b.order);

  const connectors: MindConnector[] = [];
  (function link(n: MindNode) {
    const pp = placedByNode.get(n)!;
    for (const c of n.children) {
      const cp = placedByNode.get(c)!;
      const goingRight = cp.cx >= pp.cx;
      const from = { x: pp.cx + (goingRight ? pp.w / 2 : -pp.w / 2), y: pp.cy };
      const to = { x: cp.cx + (goingRight ? -cp.w / 2 : cp.w / 2), y: cp.cy };
      const midX = (from.x + to.x) / 2;
      const path = `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${midX.toFixed(1)} ${from.y.toFixed(
        1,
      )}, ${midX.toFixed(1)} ${to.y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
      connectors.push({ from, to, path, depth: cp.depth });
      link(c);
    }
  })(root);

  return { salt, layout, svgW, svgH, nodes, connectors };
}

// Stable reference metrics (the comfortable defaults); density scales these at
// layout time. Exposed for consumers that want the base node height / padding.
export const MIND = { NODE_H: DENSITY.comfortable.NODE_H, PAD };
