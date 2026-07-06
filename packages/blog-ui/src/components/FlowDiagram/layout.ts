// FlowDiagram layout engine : pure, deterministic geometry + quality gates.
//
// This module is framework-agnostic (no React, no DOM): given a nodes/edges spec
// it returns fully-placed boxes, rendered edges, and lane bands, throwing on a
// spec that is broken (a dangling edge) or unreadable (a tangled layout). The
// component in index.tsx renders the returned geometry as SVG.
//
// Ported from the earlbear-blog FlowDiagram.astro build-time script : the layout
// math (branch longest-path levelling, swimlane forward-edge ranking, rimPoint
// edge geometry, the segment-crossing overlap gate) is copied largely verbatim
// because it is pure arithmetic that needs no browser (no getBBox, no random).

export type FlowNodeKind = 'default' | 'store' | 'external' | 'edge';

export interface FlowNode {
  id: string;
  label: string;
  kind?: FlowNodeKind;
  /** Which actor/system owns this step. Only used by shape="swimlane", where each
   *  distinct lane becomes a labeled horizontal band. */
  lane?: string;
  /** Optional longer detail, surfaced in the click-to-focus modal. */
  detail?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export type FlowShape = 'pipeline' | 'loop' | 'sequence' | 'branch' | 'swimlane';

export interface Lane {
  name: string;
  top: number;
  height: number;
}

export interface PlacedNode {
  node: FlowNode;
  /** gradient index (0-based; the component maps it to a data-palette color) */
  gi: number;
  cx: number;
  cy: number;
}

export interface RenderedEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mx: number;
  my: number;
  len: number;
  label?: string;
  curve: boolean;
}

export interface NodeDetail {
  id: string;
  label: string;
  detail: string;
  to: string[];
  from: string[];
}

export interface FlowLayout {
  shape: FlowShape;
  salt: string;
  svgW: number;
  svgH: number;
  lanes: Lane[];
  placed: PlacedNode[];
  edges: RenderedEdge[];
  /** Per-node relationship data for the click-to-focus modal. */
  details: NodeDetail[];
  /** True if any node has `detail` : the diagram becomes interactive. */
  interactive: boolean;
  /** The special node kinds actually present, in legend order (edge, store, external). */
  legendKinds: Array<'edge' | 'store' | 'external'>;
  /** Non-fatal quality issues to surface via console.warn (a11y, disconnected, long labels). */
  warnings: string[];
}

// ---- Geometry constants ---------------------------------------------------
const BOX_W = 168;
const BOX_H = 68;
const GAP = 72; // gap between boxes along the flow
const PAD = 32; // outer padding
const LANE_LABEL_W = 128; // left gutter for lane labels (swimlane only)
const OVERLAP_MIN_CLEAR = 0.75;

/** Infer the shape from the graph so authors rarely need to pass one:
 *   - a back-edge to an earlier node → a cycle → `loop`
 *   - a node with 2+ outgoing edges → a fork → `branch`
 *   - otherwise the given base shape stands (pipeline, or sequence for a stack). */
export function inferShape(
  nodes: FlowNode[],
  edges: FlowEdge[],
  base: FlowShape = 'pipeline',
): FlowShape {
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const hasBackEdge = edges.some((e) => (index.get(e.to) ?? 0) <= (index.get(e.from) ?? 0));
  const outDegree = new Map<string, number>();
  for (const e of edges) outDegree.set(e.from, (outDegree.get(e.from) ?? 0) + 1);
  const hasFork = [...outDegree.values()].some((d) => d >= 2);
  if (hasBackEdge) return 'loop';
  if (hasFork) return 'branch';
  return base;
}

function rimPoint(cx: number, cy: number, tx: number, ty: number) {
  // Intersection of the box border with the line toward (tx, ty).
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = BOX_W / 2;
  const hh = BOX_H / 2;
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function segmentsCross(a: RenderedEdge, b: RenderedEdge): boolean {
  const o = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) =>
    Math.sign((qy - py) * (rx - qx) - (qx - px) * (ry - qy));
  const near = (p: number, q: number) => Math.abs(p - q) < 0.5;
  const shareEndpoint =
    (near(a.x1, b.x1) && near(a.y1, b.y1)) ||
    (near(a.x1, b.x2) && near(a.y1, b.y2)) ||
    (near(a.x2, b.x1) && near(a.y2, b.y1)) ||
    (near(a.x2, b.x2) && near(a.y2, b.y2));
  if (shareEndpoint) return false;
  const o1 = o(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
  const o2 = o(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);
  const o3 = o(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
  const o4 = o(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);
  return o1 !== o2 && o3 !== o4;
}

export interface LayoutInput {
  title: string;
  desc?: string;
  shape: FlowShape;
  nodes: FlowNode[];
  edges: FlowEdge[];
  allowOverlap: boolean;
  legend: boolean;
}

/**
 * Compute the full layout for a flow spec. Throws on a dangling edge id or a
 * tangled layout (unless allowOverlap); collects softer issues into `warnings`
 * for the caller to console.warn.
 */
export function computeFlowLayout(input: LayoutInput): FlowLayout {
  const { title, desc, shape, nodes, edges, allowOverlap, legend } = input;
  const salt = title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'flow';
  const horizontal = shape === 'pipeline' || shape === 'loop';
  const warnings: string[] = [];

  // ---- Content-quality gates (before geometry, so a bad spec fails fast) ----
  const ids = new Set(nodes.map((n) => n.id));
  const dangling = edges.filter((e) => !ids.has(e.from) || !ids.has(e.to));
  if (dangling.length) {
    const bad = dangling
      .map(
        (e) =>
          `${!ids.has(e.from) ? `"${e.from}"` : e.from} -> ${
            !ids.has(e.to) ? `"${e.to}"` : e.to
          }`,
      )
      .join(', ');
    throw new Error(
      `FlowDiagram "${title}": edge references a node id that doesn't exist: ${bad}. ` +
        `Check the from/to ids against your nodes list.`,
    );
  }
  if (!allowOverlap) {
    if (!desc || !desc.trim()) {
      warnings.push(
        `"${title}" has no desc : add desc= so screen readers get an accessible ` +
          `description (rendered as the SVG <desc>).`,
      );
    }
    if (nodes.length > 1) {
      const touched = new Set(edges.flatMap((e) => [e.from, e.to]));
      for (const n of nodes) {
        if (!touched.has(n.id)) {
          warnings.push(
            `"${title}" node "${n.id}" (${n.label}) has no edges : it renders ` +
              `floating. Connect it or remove it.`,
          );
        }
      }
    }
    for (const n of nodes) {
      if (n.label.length > 22) {
        warnings.push(
          `"${title}" label "${n.label}" is long and may clip its box : shorten it ` +
            `or move detail into the node's \`detail\`.`,
        );
      }
    }
  }

  // ---- Placement -----------------------------------------------------------
  const lanes: Lane[] = [];
  const pos = new Map<string, { cx: number; cy: number }>();

  if (shape === 'swimlane') {
    const laneNames: string[] = [];
    for (const n of nodes) {
      const ln = n.lane ?? '(unassigned)'; // fallback lane name for nodes with no `lane`
      if (!laneNames.includes(ln)) laneNames.push(ln);
    }
    const order = new Map(nodes.map((n, i) => [n.id, i]));
    const forward = edges.filter((e) => (order.get(e.to) ?? 0) > (order.get(e.from) ?? 0));
    const rank = new Map<string, number>();
    for (const n of nodes) rank.set(n.id, 0);
    let changed = true;
    let guard = 0;
    while (changed && guard++ <= nodes.length) {
      changed = false;
      for (const e of forward) {
        const cf = rank.get(e.from) ?? 0;
        const ct = rank.get(e.to) ?? 0;
        if (ct < cf + 1) {
          rank.set(e.to, cf + 1);
          changed = true;
        }
      }
    }
    const usedRanks = [...new Set([...rank.values()])].sort((a, b) => a - b);
    const compress = new Map(usedRanks.map((r, i) => [r, i]));
    const col = new Map([...rank].map(([id, r]) => [id, compress.get(r) ?? 0]));
    const laneH = BOX_H + PAD;
    laneNames.forEach((name, r) => {
      lanes.push({ name, top: PAD + r * laneH, height: laneH });
    });
    const laneRow = new Map(laneNames.map((n, r) => [n, r]));
    for (const n of nodes) {
      const r = laneRow.get(n.lane ?? '(unassigned)') ?? 0;
      const c = col.get(n.id) ?? 0;
      pos.set(n.id, {
        cx: LANE_LABEL_W + PAD + BOX_W / 2 + c * (BOX_W + GAP),
        cy: PAD + r * laneH + laneH / 2,
      });
    }
  } else if (shape === 'loop') {
    const n = nodes.length;
    const rx = Math.max(BOX_W, (n * (BOX_W + GAP)) / (2 * Math.PI));
    const ry = Math.max(BOX_H * 1.6, (n * (BOX_H + GAP)) / (2 * Math.PI));
    const cxC = PAD + rx + BOX_W / 2;
    const cyC = PAD + ry + BOX_H / 2;
    nodes.forEach((node, i) => {
      const a = -Math.PI / 2 + (i / n) * 2 * Math.PI;
      pos.set(node.id, { cx: cxC + Math.cos(a) * rx, cy: cyC + Math.sin(a) * ry });
    });
  } else if (shape === 'branch') {
    const level = new Map<string, number>();
    for (const n of nodes) level.set(n.id, 0);
    let changed = true;
    let guard = 0;
    while (changed && guard++ < nodes.length + 2) {
      changed = false;
      for (const e of edges) {
        const lf = level.get(e.from) ?? 0;
        const lt = level.get(e.to) ?? 0;
        if (lt < lf + 1) {
          level.set(e.to, lf + 1);
          changed = true;
        }
      }
    }
    const byLevel = new Map<number, string[]>();
    for (const n of nodes) {
      const l = level.get(n.id) ?? 0;
      if (!byLevel.has(l)) byLevel.set(l, []);
      byLevel.get(l)!.push(n.id);
    }
    const widest = Math.max(...[...byLevel.values()].map((v) => v.length));
    const rowW = widest * BOX_W + (widest - 1) * GAP;
    for (const [l, levelIds] of byLevel) {
      const levelW = levelIds.length * BOX_W + (levelIds.length - 1) * GAP;
      const startX = PAD + (rowW - levelW) / 2;
      levelIds.forEach((id, i) => {
        pos.set(id, {
          cx: startX + BOX_W / 2 + i * (BOX_W + GAP),
          cy: PAD + BOX_H / 2 + l * (BOX_H + GAP),
        });
      });
    }
  } else {
    nodes.forEach((node, i) => {
      const cx = horizontal ? PAD + BOX_W / 2 + i * (BOX_W + GAP) : PAD + BOX_W / 2;
      const cy = horizontal ? PAD + BOX_H / 2 : PAD + BOX_H / 2 + i * (BOX_H + GAP);
      pos.set(node.id, { cx, cy });
    });
  }

  const cxs = [...pos.values()].map((p) => p.cx);
  const cys = [...pos.values()].map((p) => p.cy);
  const svgW =
    shape === 'loop' || shape === 'branch' || shape === 'swimlane'
      ? Math.max(...cxs) + BOX_W / 2 + PAD
      : horizontal
        ? PAD * 2 + nodes.length * BOX_W + (nodes.length - 1) * GAP
        : PAD * 2 + BOX_W;
  const svgH =
    shape === 'swimlane'
      ? PAD + lanes.reduce((h, l) => h + l.height, 0) + PAD
      : shape === 'loop' || shape === 'branch'
        ? Math.max(...cys) + BOX_H / 2 + PAD
        : horizontal
          ? PAD * 2 + BOX_H
          : PAD * 2 + nodes.length * BOX_H + (nodes.length - 1) * GAP;

  // ---- Edge geometry -------------------------------------------------------
  const rendered: RenderedEdge[] = [];
  for (const edge of edges) {
    const a = pos.get(edge.from);
    const b = pos.get(edge.to);
    if (!a || !b) continue;
    const s = rimPoint(a.cx, a.cy, b.cx, b.cy);
    const e = rimPoint(b.cx, b.cy, a.cx, a.cy);
    const len = Math.hypot(e.x - s.x, e.y - s.y);
    rendered.push({
      x1: s.x,
      y1: s.y,
      x2: e.x,
      y2: e.y,
      mx: (s.x + e.x) / 2,
      my: (s.y + e.y) / 2,
      len,
      label: edge.label,
      curve: shape === 'loop',
    });
  }

  // ---- Overlap gate (build-time, blocking) ---------------------------------
  if (shape !== 'loop') {
    const crossed = new Set<number>();
    for (let i = 0; i < rendered.length; i++) {
      for (let j = i + 1; j < rendered.length; j++) {
        if (segmentsCross(rendered[i], rendered[j])) {
          crossed.add(i);
          crossed.add(j);
        }
      }
    }
    const clear = rendered.length === 0 ? 1 : 1 - crossed.size / rendered.length;
    if (clear < OVERLAP_MIN_CLEAR) {
      const msg =
        `FlowDiagram "${title}": only ${Math.round(clear * 100)}% of edges are ` +
        `crossing-free (need >=${OVERLAP_MIN_CLEAR * 100}%). Reorder nodes so the ` +
        `flow reads left-to-right (or top-to-bottom) without backtracking, or split ` +
        `the diagram.`;
      if (allowOverlap) warnings.push(`(allowOverlap set) ${msg}`);
      else throw new Error(`${msg} To ship anyway, pass allowOverlap.`);
    }
  }

  // ---- Modal / relationship data ------------------------------------------
  const nodeLabel = new Map(nodes.map((n) => [n.id, n.label]));
  const details: NodeDetail[] = nodes.map((n) => {
    const to = edges
      .filter((e) => e.from === n.id)
      .map((e) => nodeLabel.get(e.to)!)
      .filter(Boolean);
    const from = edges
      .filter((e) => e.to === n.id)
      .map((e) => nodeLabel.get(e.from)!)
      .filter(Boolean);
    return { id: n.id, label: n.label, detail: n.detail ?? '', to, from };
  });
  const interactive = details.some((d) => d.detail);

  const legendKinds = legend
    ? (['edge', 'store', 'external'] as const).filter((k) => nodes.some((n) => n.kind === k))
    : [];

  const placed: PlacedNode[] = nodes.map((node, i) => {
    const p = pos.get(node.id)!;
    return { node, gi: i, cx: p.cx, cy: p.cy };
  });

  return {
    shape,
    salt,
    svgW,
    svgH,
    lanes,
    placed,
    edges: rendered,
    details,
    interactive,
    legendKinds: [...legendKinds],
    warnings,
  };
}

export const BOX = { W: BOX_W, H: BOX_H, PAD };
