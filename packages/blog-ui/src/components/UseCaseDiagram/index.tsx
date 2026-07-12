import React, {CSSProperties, useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import {ActorGlyph} from './actors';
import {
  computeUseCaseLayout,
  type Actor,
  type UseCase,
  type Link,
  type ActorKind,
  type UseCaseDetail,
} from './layout';

export type {Actor, UseCase, Link, ActorKind};

/**
 * UseCaseDiagram: a UML use-case diagram rendered as one inline SVG. Actors sit outside
 * the system boundary, use cases are ovals inside, associations are solid lines, and
 * <<include>> / <<extend>> are dashed arrows between use cases.
 *
 * Layout is deterministic and readability is ENFORCED at build time: actors split by side
 * (internal/system pull left, external pull right) so lines fan to the nearest edge, use
 * cases order by a barycenter crossing-reducer, and two gates fail the build if the result
 * is unreadable (too many crossing lines, or an actor whose line fan is lopsided). A node
 * with detail (or any relationship) becomes clickable and opens a focus modal.
 *
 * Usage in MDX:
 *
 *   <UseCaseDiagram
 *     title="Blog"
 *     desc="Who uses the blog and what they do."
 *     actors={[
 *       {id: 'author', label: 'Author', kind: 'internal'},
 *       {id: 'reader', label: 'Reader'},
 *       {id: 'cron', label: 'Scheduler', kind: 'system'},
 *     ]}
 *     useCases={[
 *       {id: 'write', label: 'Write a post'},
 *       {id: 'read', label: 'Read a post'},
 *       {id: 'publish', label: 'Publish', detail: 'Build and deploy.'},
 *     ]}
 *     links={[
 *       {from: 'author', to: 'write'},
 *       {from: 'author', to: 'publish'},
 *       {from: 'reader', to: 'read'},
 *       {from: 'cron', to: 'publish'},
 *       {from: 'publish', to: 'write', type: 'include'},
 *     ]}
 *   />
 */
export interface UseCaseDiagramProps {
  title: string;
  desc?: string;
  actors: Actor[];
  useCases: UseCase[];
  links: Link[];
  /** Downgrade the build-time overlap + balance gates to console warnings. */
  allowOverlap?: boolean;
  className?: string;
  style?: CSSProperties;
}

const REL_ROWS: Array<{key: keyof UseCaseDetail; label: string}> = [
  {key: 'usedBy', label: 'Used by'},
  {key: 'includes', label: 'Includes'},
  {key: 'includedBy', label: 'Included by'},
  {key: 'extends', label: 'Extends'},
  {key: 'extendedBy', label: 'Extended by'},
];

const UseCaseDiagram: React.FC<UseCaseDiagramProps> = ({
  title,
  desc,
  actors,
  useCases,
  links,
  allowOverlap = false,
  className,
  style,
}) => {
  // Throws (fails the SSG build) on a dangling link or an unreadable layout.
  const layout = computeUseCaseLayout({title, desc, actors, useCases, links, allowOverlap});

  useEffect(() => {
    for (const w of layout.warnings) console.warn(`[usecase-diagram] warning: ${w}`);
  }, [layout.warnings]);

  const {
    salt,
    svgW,
    svgH,
    boundaryX,
    boundaryY,
    boundaryW,
    boundaryH,
    ovals,
    actors: placedActors,
    links: rLinks,
    details,
    interactive,
    OVAL_W,
    OVAL_H,
    ACTOR_BOX,
  } = layout;
  const titleId = `${salt}-title`;
  const descId = `${salt}-desc`;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<UseCaseDetail | null>(null);
  const openUc = useCallback(
    (id: string) => {
      const d = details.find((x) => x.id === id);
      if (d) setActive(d);
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
    <figure className={clsx(styles.ucd, className)} style={style}>
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
            {ovals.map((o) => {
              const c1 = (o.gi % 8) + 1;
              const c2 = ((o.gi + 3) % 8) + 1;
              return (
                <linearGradient key={o.gi} id={`${salt}-g${o.gi}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={`color-mix(in oklab, var(--bopucd-data-${c1}) 22%, var(--bopucd-surface))`}
                  />
                  <stop
                    offset="100%"
                    stopColor={`color-mix(in oklab, var(--bopucd-data-${c2}) 30%, var(--bopucd-surface))`}
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
              <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="context-stroke" strokeWidth="1.5" />
            </marker>
          </defs>

          <g className={styles.boundary}>
            <rect x={boundaryX} y={boundaryY} width={boundaryW} height={boundaryH} rx="14" />
            <text x={boundaryX + 18} y={boundaryY + 24} className={styles.boundaryLabel}>
              {title}
            </text>
          </g>

          <g className={styles.linksG}>
            {rLinks.map((l, i) => (
              <g key={i} className={clsx(styles.link, styles[`link-${l.type}`])}>
                {/* Wide, invisible hit-area so the thin link is easy to hover:
                    an SVG stroke only receives pointer events on its visible
                    width. This transparent line sits under the visible one and
                    captures the hover for the whole link group. */}
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  className={styles.linkHit}
                  aria-hidden="true"
                />
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  className={styles.linkLine}
                  markerEnd={l.type === 'association' ? undefined : `url(#${salt}-arrow)`}
                  style={{'--len': l.len.toFixed(1), '--i': i} as CSSProperties}
                />
                {l.type !== 'association' && (
                  <text x={l.mx} y={l.my - 4} className={styles.stereotype}>
                    {l.type === 'include' ? '«include»' : '«extend»'}
                  </text>
                )}
              </g>
            ))}
          </g>

          <g className={styles.usecases}>
            {ovals.map((o) => {
              const isBtn = interactive;
              const oval = (
                <>
                  <ellipse
                    cx={o.cx}
                    cy={o.cy}
                    rx={OVAL_W / 2}
                    ry={OVAL_H / 2}
                    fill={`url(#${salt}-g${o.gi})`}
                  />
                  <text x={o.cx} y={o.cy} className={styles.ucLabel}>
                    {o.uc.label}
                  </text>
                </>
              );
              return isBtn ? (
                <g
                  key={o.uc.id}
                  className={clsx(styles.oval, styles.ovalInteractive)}
                  style={{'--i': o.gi} as CSSProperties}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="dialog"
                  onClick={() => openUc(o.uc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openUc(o.uc.id);
                    }
                  }}
                >
                  {oval}
                </g>
              ) : (
                <g key={o.uc.id} className={styles.oval} style={{'--i': o.gi} as CSSProperties}>
                  {oval}
                </g>
              );
            })}
          </g>

          <g className={styles.actorsG}>
            {placedActors.map((p) => {
              const gx = p.cx - ACTOR_BOX / 2;
              const gy = p.cy - ACTOR_BOX / 2;
              return (
                <g key={p.actor.id} className={clsx(styles.actor, styles[`actor-${p.kind}`])}>
                  <g transform={`translate(${gx} ${gy})`}>
                    <ActorGlyph kind={p.kind} box={ACTOR_BOX} />
                  </g>
                  <text x={p.cx} y={p.cy + ACTOR_BOX / 2 + 16} className={styles.actorLabel}>
                    {p.actor.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {desc && <figcaption className={styles.caption}>{desc}</figcaption>}

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
            <p className={styles.modalEyebrow}>{title} use case</p>
            <h3 id={`${salt}-modal-title`} className={styles.modalTitle}>
              {active?.label}
            </h3>
            {active?.detail && <p className={styles.modalDetail}>{active.detail}</p>}
            <dl className={styles.modalRels}>
              {active &&
                REL_ROWS.map(({key, label}) => {
                  const items = active[key] as string[];
                  if (!items || items.length === 0) return null;
                  return (
                    <React.Fragment key={key}>
                      <dt>{label}</dt>
                      <dd>
                        {items.map((s, i) => (
                          <span key={i}>{s}</span>
                        ))}
                      </dd>
                    </React.Fragment>
                  );
                })}
            </dl>
          </div>
        </dialog>
      )}
    </figure>
  );
};

export default UseCaseDiagram;
