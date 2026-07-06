import React, {CSSProperties, useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import {
  computeFlowLayout,
  inferShape,
  BOX,
  type FlowNode,
  type FlowEdge,
  type FlowShape,
  type FlowNodeKind,
  type NodeDetail,
} from './layout';

export type {FlowNode, FlowEdge, FlowShape, FlowNodeKind};

/**
 * FlowDiagram : a directed-flow diagram rendered as one inline SVG. The author
 * writes a small `nodes`/`edges` spec (data, not an image), and the component
 * lays it out deterministically at render time in one of five shapes, failing the
 * build on a dangling edge id or a tangled (unreadable) layout.
 *
 * Shapes (usually inferred from the graph, rarely passed):
 *   pipeline  a horizontal row A -> B -> C  (linear handoff)
 *   loop      the row wrapped into a cycle (last node feeds the first)
 *   sequence  a vertical stack, top -> bottom (ordered steps)
 *   branch    a top-down fan-out for forks / decisions
 *   swimlane  labeled horizontal bands, one per owning actor (`lane`)
 *
 * Node kinds tint/mark the box: default, store (a datastore), external (outside
 * the system), edge (a trust-boundary marker). Pass `legend` to show a key for
 * the special kinds actually used. A node with `detail` becomes clickable and
 * opens a focus modal listing what feeds it and what it feeds.
 *
 * Usage in MDX:
 *
 *   <FlowDiagram title="Publish pipeline" legend
 *     desc="Draft flows through review to a live deploy."
 *     nodes={[
 *       {id: 'draft', label: 'Draft'},
 *       {id: 'review', label: 'Review', detail: 'A reader-experience pass.'},
 *       {id: 'deploy', label: 'Deploy', kind: 'external'},
 *     ]}
 *     edges={[
 *       {from: 'draft', to: 'review'},
 *       {from: 'review', to: 'deploy', label: 'approved'},
 *     ]}
 *   />
 */
export interface FlowDiagramProps {
  title: string;
  desc?: string;
  /** Force a shape; omit to let the graph pick (back-edge -> loop, fork -> branch). */
  shape?: FlowShape;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  /** Downgrade the build-time overlap gate to a console warning for this diagram. */
  allowOverlap?: boolean;
  /** Show a key for the special node kinds actually used (edge, store, external). */
  legend?: boolean;
  className?: string;
  style?: CSSProperties;
}

const KIND_MEANING: Record<'edge' | 'store' | 'external', string> = {
  store: 'datastore',
  external: 'outside the system',
  edge: 'trust boundary',
};

const FlowDiagram: React.FC<FlowDiagramProps> = ({
  title,
  desc,
  shape: shapeProp,
  nodes = [],
  edges = [],
  allowOverlap = false,
  legend = false,
  className,
  style,
}) => {
  const shape: FlowShape = shapeProp ?? inferShape(nodes, edges, 'pipeline');
  // computeFlowLayout throws on a broken/tangled spec : that fails the SSG build,
  // which is the intended blocking gate (an unreadable diagram does not ship).
  const layout = computeFlowLayout({
    title,
    desc,
    shape,
    nodes,
    edges,
    allowOverlap,
    legend,
  });

  useEffect(() => {
    for (const w of layout.warnings) console.warn(`[flow-diagram] warning: ${w}`);
  }, [layout.warnings]);

  const {svgW, svgH, salt, lanes, placed, edges: rEdges, details, interactive, legendKinds} =
    layout;
  const titleId = `${salt}-title`;
  const descId = `${salt}-desc`;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<NodeDetail | null>(null);
  const openNode = useCallback(
    (id: string) => {
      const d = details.find((x) => x.id === id);
      if (!d) return;
      setActive(d);
    },
    [details],
  );
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (active && !dlg.open && dlg.showModal) dlg.showModal();
    if (!active && dlg.open) dlg.close();
  }, [active]);

  return (
    <figure
      className={clsx(styles.flow, styles[`shape-${shape}`], className)}
      style={style}
    >
      <div className={styles.scroll}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          role="img"
          aria-labelledby={desc ? `${titleId} ${descId}` : titleId}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={titleId}>{title}</title>
          {desc && <desc id={descId}>{desc}</desc>}

          <defs>
            {placed.map((p) => {
              const c1 = (p.gi % 8) + 1;
              const c2 = ((p.gi + 2) % 8) + 1;
              return (
                <linearGradient
                  key={p.gi}
                  id={`${salt}-g${p.gi}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={`color-mix(in oklab, var(--bopflow-data-${c1}) 22%, var(--bopflow-surface))`}
                  />
                  <stop
                    offset="100%"
                    stopColor={`color-mix(in oklab, var(--bopflow-data-${c2}) 28%, var(--bopflow-surface))`}
                  />
                </linearGradient>
              );
            })}
            <marker
              id={`${salt}-arrow`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 1 L 9 5 L 0 9"
                fill="none"
                stroke="context-stroke"
                strokeWidth="1.5"
              />
            </marker>
          </defs>

          {lanes.length > 0 && (
            <g className={styles.lanes}>
              {lanes.map((lane, i) => (
                <React.Fragment key={i}>
                  <rect
                    className={clsx(styles.laneBand, i % 2 === 1 && styles.laneBandAlt)}
                    x={0}
                    y={lane.top}
                    width={svgW}
                    height={lane.height}
                  />
                  <text
                    className={styles.laneLabel}
                    x={BOX.PAD / 2}
                    y={lane.top + lane.height / 2}
                  >
                    {lane.name}
                  </text>
                </React.Fragment>
              ))}
            </g>
          )}

          <g className={styles.edgesG}>
            {rEdges.map((ed, i) => {
              const path = ed.curve
                ? `M ${ed.x1} ${ed.y1} Q ${ed.mx + (ed.my - ed.y1) * 0.3} ${
                    ed.my + (ed.x1 - ed.mx) * 0.3
                  } ${ed.x2} ${ed.y2}`
                : `M ${ed.x1} ${ed.y1} L ${ed.x2} ${ed.y2}`;
              return (
                <g className={styles.edge} key={i}>
                  <path
                    d={path}
                    fill="none"
                    markerEnd={`url(#${salt}-arrow)`}
                    style={{'--len': ed.len.toFixed(1), '--i': i} as CSSProperties}
                  />
                  {ed.label && (
                    <g>
                      <rect
                        className={styles.edgeChip}
                        x={ed.mx - (ed.label.length * 6.6) / 2 - 5}
                        y={ed.my - 5 - 11}
                        width={ed.label.length * 6.6 + 10}
                        height={16}
                        rx={4}
                      />
                      <text x={ed.mx} y={ed.my - 5} className={styles.edgeLabel}>
                        {ed.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          <g className={styles.nodesG}>
            {placed.map((p) => {
              const kind = p.node.kind ?? 'default';
              const isBtn = interactive && !!p.node.detail;
              const box = (
                <>
                  <rect
                    x={p.cx - BOX.W / 2}
                    y={p.cy - BOX.H / 2}
                    width={BOX.W}
                    height={BOX.H}
                    rx={kind === 'store' ? 4 : 12}
                    fill={`url(#${salt}-g${p.gi})`}
                    className={clsx(styles.box, styles[`box-${kind}`])}
                  />
                  <text x={p.cx} y={p.cy} className={styles.label}>
                    {p.node.label}
                  </text>
                </>
              );
              return isBtn ? (
                <g
                  key={p.node.id}
                  className={clsx(styles.node, styles.nodeInteractive)}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="dialog"
                  style={{'--i': p.gi} as CSSProperties}
                  onClick={() => openNode(p.node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openNode(p.node.id);
                    }
                  }}
                >
                  {box}
                </g>
              ) : (
                <g
                  key={p.node.id}
                  className={styles.node}
                  style={{'--i': p.gi} as CSSProperties}
                >
                  {box}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {desc && <figcaption className={styles.caption}>{desc}</figcaption>}

      {legendKinds.length > 0 && (
        <ul className={styles.legend} aria-label="Node kinds key">
          {legendKinds.map((k) => (
            <li className={styles.legendItem} key={k}>
              <svg className={styles.legendSwatch} viewBox="0 0 28 18" aria-hidden="true">
                <rect
                  x="1"
                  y="1"
                  width="26"
                  height="16"
                  rx={k === 'store' ? 2 : 5}
                  className={clsx(styles.box, styles[`box-${k}`])}
                  fill="var(--bopflow-surface-sunken)"
                />
              </svg>
              <span className={styles.legendLabel}>{KIND_MEANING[k]}</span>
            </li>
          ))}
        </ul>
      )}

      {interactive && (
        <dialog
          ref={dialogRef}
          className={styles.modal}
          aria-labelledby={`${salt}-modal-title`}
          onClose={() => setActive(null)}
          onClick={(e) => {
            if (e.target === dialogRef.current) setActive(null);
          }}
        >
          <div className={styles.modalInner}>
            <button
              type="button"
              className={styles.modalClose}
              aria-label="Close"
              onClick={() => setActive(null)}
            >
              &times;
            </button>
            <p className={styles.modalEyebrow}>{title} step</p>
            <h3 id={`${salt}-modal-title`} className={styles.modalTitle}>
              {active?.label}
            </h3>
            {active?.detail && <p className={styles.modalDetail}>{active.detail}</p>}
            <dl className={styles.modalRels}>
              {active?.from && active.from.length > 0 && (
                <>
                  <dt>From</dt>
                  <dd>
                    {active.from.map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </dd>
                </>
              )}
              {active?.to && active.to.length > 0 && (
                <>
                  <dt>To</dt>
                  <dd>
                    {active.to.map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </dialog>
      )}
    </figure>
  );
};

export default FlowDiagram;
