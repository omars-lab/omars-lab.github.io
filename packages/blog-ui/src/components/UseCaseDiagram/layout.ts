// UseCaseDiagram layout engine: pure, deterministic geometry + two quality gates.
//
// Framework-agnostic (no React, no DOM). Given actors / useCases / links it returns
// fully-placed ovals, actors, and rendered links, throwing on a broken spec (a dangling
// link) or an unreadable layout (too many crossing lines, or an actor whose line fan is
// lopsided). Ported from the earlbear-blog UseCaseDiagram.astro build-time script: the
// side-pull placement, barycenter crossing reduction, the segment-crossing overlap gate,
// and the actor line-angle balance gate are copied largely verbatim (pure arithmetic,
// no browser needed).

import type {ActorKind} from './actors';

export type {ActorKind};

export interface Actor {
  id: string;
  label: string;
  kind?: ActorKind; // default 'external'
}
export interface UseCase {
  id: string;
  label: string;
  /** Optional longer detail, surfaced in the click-to-focus modal. */
  detail?: string;
}
export interface Link {
  from: string; // actor id or use-case id
  to: string; // use-case id
  type?: 'association' | 'include' | 'extend'; // default association
}

export interface PlacedOval {
  uc: UseCase;
  gi: number;
  cx: number;
  cy: number;
}
export interface PlacedActor {
  actor: Actor;
  cx: number;
  cy: number;
  kind: ActorKind;
  side: 'left' | 'right';
}
export interface RenderedLink {
  type: 'association' | 'include' | 'extend';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mx: number;
  my: number;
  len: number;
  fromActor?: string;
}
export interface UseCaseDetail {
  id: string;
  label: string;
  detail: string;
  usedBy: string[];
  includes: string[];
  includedBy: string[];
  extends: string[];
  extendedBy: string[];
}

export interface UseCaseLayout {
  salt: string;
  svgW: number;
  svgH: number;
  boundaryX: number;
  boundaryY: number;
  boundaryW: number;
  boundaryH: number;
  ovals: PlacedOval[];
  actors: PlacedActor[];
  links: RenderedLink[];
  details: UseCaseDetail[];
  interactive: boolean;
  warnings: string[];
  OVAL_W: number;
  OVAL_H: number;
  ACTOR_BOX: number;
}

// ---- Geometry constants ---------------------------------------------------
const OVAL_W = 200;
const OVAL_H = 74;
const COL_GAP = 40;
const ROW_GAP = 56;
const ACTOR_BOX = 72;
const ACTOR_GAP = 48;
const PAD = 28;
const ACTOR_LANE = 150;
const LABEL_H = 26;
const OVERLAP_MIN_CLEAR = 0.75;

function ovalEdge(cx: number, cy: number, tx: number, ty: number) {
  const rx = OVAL_W / 2;
  const ry = OVAL_H / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const denom = Math.hypot(dx / rx, dy / ry) || 1;
  return {x: cx + dx / rx / denom, y: cy + dy / ry / denom};
}

function segmentsCross(a: RenderedLink, b: RenderedLink): boolean {
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

export interface UseCaseInput {
  title: string;
  desc?: string;
  actors: Actor[];
  useCases: UseCase[];
  links: Link[];
  allowOverlap: boolean;
}

export function computeUseCaseLayout(input: UseCaseInput): UseCaseLayout {
  const {title, desc, actors, useCases, links, allowOverlap} = input;
  const salt = title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 8) || 'ucd';
  const warnings: string[] = [];

  // ---- Content-quality gates ----
  const ids = new Set([...actors.map((a) => a.id), ...useCases.map((u) => u.id)]);
  const dangling = links.filter((l) => !ids.has(l.from) || !ids.has(l.to));
  if (dangling.length) {
    const bad = dangling
      .map(
        (l) =>
          `${!ids.has(l.from) ? `"${l.from}"` : l.from} -> ${
            !ids.has(l.to) ? `"${l.to}"` : l.to
          }`,
      )
      .join(', ');
    throw new Error(
      `UseCaseDiagram "${title}": link references an id that doesn't exist: ${bad}. ` +
        `Check the from/to against your actors and useCases.`,
    );
  }
  if (!allowOverlap) {
    if (!desc || !desc.trim()) {
      warnings.push(
        `"${title}" has no desc: add desc= so screen readers get an accessible description.`,
      );
    }
    const touched = new Set(links.flatMap((l) => [l.from, l.to]));
    for (const a of actors) {
      if (!touched.has(a.id))
        warnings.push(`"${title}" actor "${a.id}" (${a.label}) has no associations (floating).`);
    }
    for (const u of useCases) {
      if (!touched.has(u.id))
        warnings.push(`"${title}" use case "${u.id}" (${u.label}) has no links (floating).`);
      if (u.label.length > 26)
        warnings.push(`"${title}" use-case label "${u.label}" is long and may clip its oval.`);
    }
  }

  // ---- Split actors by side ----
  const leftActors = actors.filter((a) => (a.kind ?? 'external') !== 'external');
  const rightActors = actors.filter((a) => (a.kind ?? 'external') === 'external');
  const leftLane = leftActors.length ? ACTOR_LANE : 0;
  const rightLane = rightActors.length ? ACTOR_LANE : 0;

  const leftActorIds = new Set(leftActors.map((a) => a.id));
  const rightActorIds = new Set(rightActors.map((a) => a.id));
  const ucLeftTouch = new Map<string, number>();
  const ucRightTouch = new Map<string, number>();
  for (const uc of useCases) {
    ucLeftTouch.set(uc.id, 0);
    ucRightTouch.set(uc.id, 0);
  }
  for (const link of links) {
    if (!ucLeftTouch.has(link.to)) continue;
    if (leftActorIds.has(link.from))
      ucLeftTouch.set(link.to, (ucLeftTouch.get(link.to) ?? 0) + 1);
    else if (rightActorIds.has(link.from))
      ucRightTouch.set(link.to, (ucRightTouch.get(link.to) ?? 0) + 1);
  }
  const pullsRight = (id: string) => (ucRightTouch.get(id) ?? 0) > (ucLeftTouch.get(id) ?? 0);

  const rightUCsRaw = rightActors.length ? useCases.filter((u) => pullsRight(u.id)) : [];
  const twoCol = rightUCsRaw.length > 0;
  let leftUCs = twoCol ? useCases.filter((u) => !pullsRight(u.id)) : useCases;
  let rightUCs: UseCase[] = rightUCsRaw;

  // ---- Barycenter ordering within each column ----
  const actorOrder = new Map<string, number>();
  actors.forEach((a, i) => actorOrder.set(a.id, i));
  function barycenter(uc: {id: string}): number {
    const ys: number[] = [];
    for (const link of links)
      if (link.to === uc.id && actorOrder.has(link.from)) ys.push(actorOrder.get(link.from)!);
    return ys.length ? ys.reduce((s, y) => s + y, 0) / ys.length : Number.MAX_SAFE_INTEGER;
  }
  const byBarycenter = (a: {id: string}, b: {id: string}) => barycenter(a) - barycenter(b);
  leftUCs = [...leftUCs].sort(byBarycenter);
  rightUCs = [...rightUCs].sort(byBarycenter);
  const singleCol = [...useCases].sort(byBarycenter);
  const perCol = twoCol ? Math.max(leftUCs.length, rightUCs.length) : useCases.length;

  const boundaryW = PAD * 2 + (twoCol ? OVAL_W * 2 + ROW_GAP : OVAL_W);
  const boundaryH = PAD * 2 + perCol * OVAL_H + (perCol - 1) * COL_GAP + 30;

  const ucPos = new Map<string, {cx: number; cy: number}>();
  const boundaryX = leftLane;
  const boundaryY = 10;
  function placeColumn(col: UseCase[], colIndex: number) {
    col.forEach((uc, row) => {
      const cx = boundaryX + PAD + OVAL_W / 2 + colIndex * (OVAL_W + ROW_GAP);
      const cy = boundaryY + 30 + PAD + OVAL_H / 2 + row * (OVAL_H + COL_GAP);
      ucPos.set(uc.id, {cx, cy});
    });
  }
  if (twoCol) {
    placeColumn(leftUCs, 0);
    placeColumn(rightUCs, 1);
  } else {
    placeColumn(singleCol, 0);
  }

  // ---- Place actors at the barycenter of their use cases ----
  const actorPosMap = new Map<
    string,
    {cx: number; cy: number; kind: ActorKind; side: 'left' | 'right'}
  >();
  function actorBarycenterY(id: string): number {
    const ys: number[] = [];
    for (const link of links)
      if (link.from === id && ucPos.has(link.to)) ys.push(ucPos.get(link.to)!.cy);
    return ys.length ? ys.reduce((s, y) => s + y, 0) / ys.length : boundaryY + boundaryH / 2;
  }
  function placeLane(lane: Actor[], side: 'left' | 'right', laneX: number) {
    const cx = laneX + ACTOR_LANE / 2;
    const desired = lane
      .map((a) => ({a, y: actorBarycenterY(a.id)}))
      .sort((p, q) => p.y - q.y);
    const MIN_GAP = ACTOR_BOX + ACTOR_GAP;
    const top = boundaryY + ACTOR_BOX / 2;
    const bottom = boundaryY + boundaryH - ACTOR_BOX / 2 - LABEL_H;
    let prev = -Infinity;
    for (const d of desired) {
      const y = Math.max(d.y, prev + MIN_GAP);
      prev = y;
      actorPosMap.set(d.a.id, {cx, cy: y, kind: d.a.kind ?? 'external', side});
    }
    const overshoot = prev - bottom;
    if (overshoot > 0) {
      for (const d of desired) {
        const p = actorPosMap.get(d.a.id)!;
        p.cy = Math.max(top, p.cy - overshoot);
      }
    }
  }
  placeLane(leftActors, 'left', 0);
  placeLane(rightActors, 'right', boundaryX + boundaryW);

  const svgW = boundaryX + boundaryW + rightLane + 20;
  const svgH = boundaryY + boundaryH + LABEL_H + 20;

  // ---- Link geometry ----
  function anchor(id: string) {
    const a = actorPosMap.get(id);
    if (a) return {x: a.cx, y: a.cy, isActor: true, side: a.side};
    const u = ucPos.get(id);
    if (u) return {x: u.cx, y: u.cy, isActor: false as const, side: undefined};
    return null;
  }
  const rendered: RenderedLink[] = [];
  for (const link of links) {
    const from = anchor(link.from);
    const to = anchor(link.to);
    if (!from || !to) continue;
    const type = link.type ?? 'association';
    let sx = from.x;
    let sy = from.y;
    if (from.isActor) {
      const edge = ACTOR_BOX / 2 - 6;
      sx = from.side === 'right' ? from.x - edge : from.x + edge;
    } else {
      const e = ovalEdge(from.x, from.y, to.x, to.y);
      sx = e.x;
      sy = e.y;
    }
    const e2 = ovalEdge(to.x, to.y, sx, sy);
    const len = Math.hypot(e2.x - sx, e2.y - sy);
    rendered.push({
      type,
      x1: sx,
      y1: sy,
      x2: e2.x,
      y2: e2.y,
      mx: (sx + e2.x) / 2,
      my: (sy + e2.y) / 2,
      len,
      fromActor: from.isActor ? link.from : undefined,
    });
  }

  // ---- Overlap gate ----
  const crossed = new Set<number>();
  for (let i = 0; i < rendered.length; i++) {
    for (let j = i + 1; j < rendered.length; j++) {
      if (segmentsCross(rendered[i], rendered[j])) {
        crossed.add(i);
        crossed.add(j);
      }
    }
  }
  const clearFraction = rendered.length === 0 ? 1 : 1 - crossed.size / rendered.length;
  if (clearFraction < OVERLAP_MIN_CLEAR) {
    const msg =
      `UseCaseDiagram "${title}": only ${Math.round(clearFraction * 100)}% of association ` +
      `lines are crossing-free (need >=${OVERLAP_MIN_CLEAR * 100}%). Put each use case near ` +
      `the actors that use it (internal/system pull left, external pull right), split a busy ` +
      `diagram, or remove incidental links.`;
    if (allowOverlap) warnings.push(`(allowOverlap set) ${msg}`);
    else throw new Error(`${msg} To ship anyway, pass allowOverlap.`);
  }

  // ---- Actor line-angle balance gate ----
  for (const actor of actors) {
    const lines = rendered.filter((l) => l.fromActor === actor.id);
    if (lines.length < 2) continue;
    let up = 0;
    let down = 0;
    let horiz = 0;
    for (const l of lines) {
      const dy = l.y2 - l.y1;
      if (dy < -1) up++;
      else if (dy > 1) down++;
      if (Math.abs(l.y2 - l.y1) <= Math.abs(l.x2 - l.x1)) horiz++;
    }
    const imbalance = Math.abs(up - down);
    const mostlyHorizontal = horiz / lines.length >= 0.5;
    if (imbalance > 1 || !mostlyHorizontal) {
      const msg =
        `UseCaseDiagram "${title}": actor "${actor.label}" has an unbalanced line fan ` +
        `(${up} up, ${down} down, ${horiz}/${lines.length} near-horizontal). Actors should ` +
        `sit at the vertical center of the use cases they touch. Reorder the use cases, give ` +
        `the diagram more vertical room, or split it.`;
      if (allowOverlap) warnings.push(`(allowOverlap set) ${msg}`);
      else throw new Error(`${msg} To ship anyway, pass allowOverlap.`);
    }
  }

  // ---- Modal / relationship data ----
  const actorLabel = new Map(actors.map((a) => [a.id, a.label]));
  const ucLabel = new Map(useCases.map((u) => [u.id, u.label]));
  const details: UseCaseDetail[] = useCases.map((uc) => {
    const usedBy = links
      .filter(
        (l) => (l.type ?? 'association') === 'association' && l.to === uc.id && actorLabel.has(l.from),
      )
      .map((l) => actorLabel.get(l.from)!);
    const includes = links
      .filter((l) => l.type === 'include' && l.from === uc.id)
      .map((l) => ucLabel.get(l.to)!)
      .filter(Boolean);
    const includedBy = links
      .filter((l) => l.type === 'include' && l.to === uc.id)
      .map((l) => ucLabel.get(l.from)!)
      .filter(Boolean);
    const extendsArr = links
      .filter((l) => l.type === 'extend' && l.from === uc.id)
      .map((l) => ucLabel.get(l.to)!)
      .filter(Boolean);
    const extendedBy = links
      .filter((l) => l.type === 'extend' && l.to === uc.id)
      .map((l) => ucLabel.get(l.from)!)
      .filter(Boolean);
    return {
      id: uc.id,
      label: uc.label,
      detail: uc.detail ?? '',
      usedBy,
      includes,
      includedBy,
      extends: extendsArr,
      extendedBy,
    };
  });
  const interactive = details.some(
    (d) =>
      d.detail ||
      d.usedBy.length ||
      d.includes.length ||
      d.includedBy.length ||
      d.extends.length ||
      d.extendedBy.length,
  );

  const ovals: PlacedOval[] = useCases.map((uc, i) => {
    const p = ucPos.get(uc.id)!;
    return {uc, gi: i, cx: p.cx, cy: p.cy};
  });
  const placedActors: PlacedActor[] = actors.map((a) => {
    const p = actorPosMap.get(a.id)!;
    return {actor: a, cx: p.cx, cy: p.cy, kind: p.kind, side: p.side};
  });

  return {
    salt,
    svgW,
    svgH,
    boundaryX,
    boundaryY,
    boundaryW,
    boundaryH,
    ovals,
    actors: placedActors,
    links: rendered,
    details,
    interactive,
    warnings,
    OVAL_W,
    OVAL_H,
    ACTOR_BOX,
  };
}
