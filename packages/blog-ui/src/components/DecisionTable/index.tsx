import React, {CSSProperties, ReactNode, useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Tooltip from '../Tooltip';
import styles from './styles.module.css';

/**
 * DecisionTable: the catalog of a design's decisions (D1, D2, … Dn) as an anchored,
 * status-badged table. Distinct from <ComparisonMatrix> (which is criteria x OPTIONS,
 * "which option wins"); this is the numbered list of DECISIONS with their status, so a
 * post's constant "see D3" cross-references become real deep-links.
 *
 * THE POINT — per-decision anchors + visited-row highlight. Each row gets id="d1", "d2",
 * … so prose can write [D3](#d3); the row highlights when its anchor is the current URL
 * hash (CSS :target, zero JS), and a tiny enhancement scrolls it to center + flashes on
 * re-click (respecting prefers-reduced-motion).
 *
 * STATUS. Each decision has a status (decided | leaning | open | tbd) → a colored badge.
 * Hovering/tapping the badge shows a tooltip: the fixed gloss for that status VALUE ("leaning:
 * a preferred option exists but is not locked") plus the decision's own `statusNote` if given
 * ("waiting on live traffic data"). Uses <Tooltip> so it works on tap for touch, not hover-only.
 *
 * DETAIL. A decision with `detail` renders its ID cell as a button opening a focus modal with
 * the full rationale (reuses the ComparisonMatrix modal pattern). Zero modal JS ships unless at
 * least one decision has a detail.
 *
 * A build-time gate throws on a duplicate id or an unknown status.
 *
 * Usage in MDX:
 *
 *   <DecisionTable
 *     title="Key Decisions"
 *     desc="The decisions that most determine whether the agent is trustworthy."
 *     decisions={[
 *       {id: 'D1', decision: 'Execution / serving model', status: 'decided',
 *        choice: 'Shopify-native → self-hosted',
 *        statusNote: 'Locked after the Q3 review.',
 *        detail: <>Longer rationale, shown in a click-to-focus modal.</>},
 *       {id: 'D2', decision: 'Measurement rigor', status: 'leaning', choice: 'Bayesian/sequential'},
 *     ]}
 *   />
 */
export type DecisionStatus = 'decided' | 'leaning' | 'open' | 'tbd';

export interface Decision {
  /** Stable id, e.g. "D1". Lowercased to the row anchor (#d1). Must be unique. */
  id: string;
  /** The decision itself, in one line (the question being resolved). */
  decision: ReactNode;
  status: DecisionStatus;
  /** The resolution, when there is one. Renders a Choice column if ANY decision has it. */
  choice?: ReactNode;
  /** Why THIS decision carries THIS status. Appended to the status-badge tooltip. */
  statusNote?: ReactNode;
  /** Full rationale. When present, the ID cell opens a focus modal. */
  detail?: ReactNode;
}

export interface DecisionTableProps {
  title: string;
  desc?: string;
  decisions: Decision[];
  className?: string;
  style?: CSSProperties;
}

/** The fixed vocabulary gloss for each status value (shown in the badge tooltip). */
const STATUS_GLOSS: Record<DecisionStatus, string> = {
  decided: 'decided: locked; the choice will not change without a new decision.',
  leaning: 'leaning: a preferred option exists but is not locked yet.',
  open: 'open: genuinely undecided; no leaning yet.',
  tbd: 'tbd: not yet examined; a placeholder to be filled in.',
};
const KNOWN_STATUS = new Set<string>(Object.keys(STATUS_GLOSS));

function assertValid(props: DecisionTableProps): string[] {
  const {title, desc, decisions} = props;
  const seen = new Set<string>();
  for (const d of decisions) {
    const key = d.id.toLowerCase();
    if (seen.has(key)) {
      throw new Error(
        `DecisionTable "${title}": duplicate decision id "${d.id}". Each id must be unique ` +
          `(it becomes the row anchor #${key}).`,
      );
    }
    seen.add(key);
    if (!KNOWN_STATUS.has(d.status)) {
      throw new Error(
        `DecisionTable "${title}": decision "${d.id}" has unknown status "${d.status}". ` +
          `Use one of: ${[...KNOWN_STATUS].join(', ')}.`,
      );
    }
  }
  const warnings: string[] = [];
  if (!desc || !desc.trim()) {
    warnings.push(
      `"${title}" has no desc: add desc= so screen readers get an accessible summary of ` +
        `what these decisions are about.`,
    );
  }
  return warnings;
}

interface ActiveDecision {
  id: string;
  decision: ReactNode;
  detail: ReactNode;
}

const DecisionTable: React.FC<DecisionTableProps> = (props) => {
  const {title, desc, decisions, className, style} = props;
  // Throws (fails the build) on a duplicate id or unknown status.
  const warnings = assertValid(props);
  useEffect(() => {
    for (const w of warnings) console.warn(`[decision-table] warning: ${w}`);
  }, [warnings]);

  const anchor = (id: string) => id.toLowerCase();
  const showChoice = decisions.some((d) => d.choice !== undefined && d.choice !== null);
  const interactive = decisions.some((d) => d.detail !== undefined && d.detail !== null);

  // ---- :target enhancement: scroll the linked row to center, flash on (re)click. ----
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [flashId, setFlashId] = useState<string | null>(null);
  const gotoHash = useCallback(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (!hash) return;
    const row = rowRefs.current[hash];
    if (!row) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollIntoView({block: 'center', behavior: reduce ? 'auto' : 'smooth'});
    // Re-trigger a brief flash even when the hash is unchanged (a repeat click on the same link).
    setFlashId(null);
    // eslint-disable-next-line no-void
    void row.offsetWidth; // force reflow so the class re-adds and the animation replays
    setFlashId(hash);
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    gotoHash(); // honor a deep-link on mount
    window.addEventListener('hashchange', gotoHash);
    return () => window.removeEventListener('hashchange', gotoHash);
  }, [gotoHash]);

  // ---- detail modal (only when a decision carries detail) ----
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<ActiveDecision | null>(null);
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (active && !dlg.open && dlg.showModal) dlg.showModal();
    if (!active && dlg.open) dlg.close();
  }, [active]);

  const statusTip = (d: Decision): ReactNode => {
    const gloss = STATUS_GLOSS[d.status];
    if (d.statusNote) {
      return (
        <>
          {gloss}
          <br />
          <strong>Here:</strong> {d.statusNote}
        </>
      );
    }
    return gloss;
  };

  return (
    <figure className={clsx(styles.wrap, className)} style={style}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          {desc && <caption className={styles.caption}>{desc}</caption>}
          <thead>
            <tr>
              <th scope="col" className={styles.colId}>
                {title}
              </th>
              <th scope="col">Decision</th>
              <th scope="col" className={styles.colStatus}>
                Status
              </th>
              {showChoice && <th scope="col">Choice</th>}
            </tr>
          </thead>
          <tbody>
            {decisions.map((d) => {
              const a = anchor(d.id);
              const hasDetail = d.detail !== undefined && d.detail !== null;
              return (
                <tr
                  key={a}
                  id={a}
                  ref={(el) => {
                    rowRefs.current[a] = el;
                  }}
                  className={clsx(styles.row, flashId === a && styles.flash)}
                >
                  <th scope="row" className={styles.id}>
                    {hasDetail ? (
                      <button
                        type="button"
                        className={styles.idButton}
                        aria-haspopup="dialog"
                        aria-label={`${d.id}: why this decision`}
                        onClick={() =>
                          setActive({id: d.id, decision: d.decision, detail: d.detail})
                        }
                      >
                        {d.id}
                        <span className={styles.whyDot} aria-hidden="true" />
                      </button>
                    ) : (
                      <a href={`#${a}`} className={styles.idLink}>
                        {d.id}
                      </a>
                    )}
                  </th>
                  <td className={styles.decision}>{d.decision}</td>
                  <td className={styles.statusCell}>
                    <Tooltip content={statusTip(d)}>
                      <span className={clsx(styles.badge, styles[`badge-${d.status}`])}>
                        {d.status}
                      </span>
                    </Tooltip>
                  </td>
                  {showChoice && <td className={styles.choice}>{d.choice ?? ''}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {interactive && (
        <dialog
          ref={dialogRef}
          className={styles.modal}
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
            <p className={styles.modalEyebrow}>{active?.id}</p>
            <h3 className={styles.modalTitle}>{active?.decision}</h3>
            {active?.detail && <div className={styles.modalNote}>{active.detail}</div>}
          </div>
        </dialog>
      )}
    </figure>
  );
};

export default DecisionTable;
