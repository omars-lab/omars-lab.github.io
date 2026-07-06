import React, {CSSProperties, ReactNode, useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * ComparisonMatrix: a criteria x options comparison for decision posts. Options are
 * columns, criteria are rows, each cell is a rating (a yes/no/partial mark or a short
 * value). The chosen option's column is highlighted and badged so the decision is
 * scannable at a glance. Pairs with <Accordion> (which carries the narrative); the
 * matrix carries the head-to-head.
 *
 * Rendered as a real HTML table (proper <th scope>) so a screen reader announces
 * "Consistency, Option B: partial". The table scrolls inside its own wrapper on mobile
 * rather than pushing the page sideways. A build-time gate throws if a cell references an
 * option id that does not exist.
 *
 * JUSTIFY A RATING: a cell can be a plain rating string OR an object carrying a `note`
 * (why that rating was given) and optional `footnotes`. A cell with a note renders its
 * mark as a clickable button that opens a focus modal with the justification, so the "how
 * do they score" table can also answer "why this score" on demand, without cluttering the
 * grid. Zero client JS ships unless at least one cell has a note.
 *
 * Distinct from OptionGrid/DecisionNote (design-system specimens that show explored design
 * directions with a chosen ring + WHY); ComparisonMatrix is the head-to-head feature table.
 *
 * Usage in MDX:
 *
 *   <ComparisonMatrix
 *     title="Storage options"
 *     desc="Comparing three stores against our needs."
 *     options={[
 *       {id: 'a', label: 'Postgres'},
 *       {id: 'b', label: 'SQLite', chosen: true},
 *       {id: 'c', label: 'Redis'},
 *     ]}
 *     criteria={[
 *       {label: 'Zero-ops', cells: {
 *         a: 'no',
 *         b: {rating: 'yes', note: <>A single file. No server, no daemon, no ops.</>,
 *             footnotes: [{id: 'a', content: <>See the SQLite docs on serverless operation.</>}]},
 *         c: 'partial',
 *       }},
 *       {label: 'Cost', cells: {a: '$$', b: 'free', c: '$'}},
 *     ]}
 *   />
 */
export type Rating = 'yes' | 'no' | 'partial' | string;

export interface CellFootnote {
  id: string;
  content: ReactNode;
}

export interface CellSpec {
  /** 'yes'|'no'|'partial' render as marks; any other string renders as literal text. */
  rating: Rating;
  /** Why this rating was given. When present, the cell's mark becomes clickable and this
   *  opens in a focus modal. Any React content (prose, a list, a <sup> footnote ref). */
  note?: ReactNode;
  /** Optional footnotes rendered as a definition list under the note in the modal. */
  footnotes?: CellFootnote[];
}

/** A cell is either a plain rating string or a rich spec with a justification. */
export type Cell = Rating | CellSpec;

export interface MatrixOption {
  id: string;
  label: string;
  /** Mark the winning option: its column is highlighted and badged. */
  chosen?: boolean;
}

export interface MatrixCriterion {
  label: string;
  /** One cell per option, keyed by option id. */
  cells: Record<string, Cell>;
}

export interface ComparisonMatrixProps {
  title: string;
  desc?: string;
  options: MatrixOption[];
  criteria: MatrixCriterion[];
  /** Show a small key explaining the marks (● yes / ○ no / ◐ partial), plus a note that a
   *  mark with a "why" dot is clickable when any cell carries a justification. Off by
   *  default; rendered straight from the mark map so it can never drift from the cells. */
  legend?: boolean;
  className?: string;
  style?: CSSProperties;
}

const MARK: Record<string, {glyph: string; label: string; cls: string}> = {
  yes: {glyph: '●', label: 'yes', cls: 'yes'}, // ●
  no: {glyph: '○', label: 'no', cls: 'no'}, // ○
  partial: {glyph: '◐', label: 'partial', cls: 'partial'}, // ◐
};

function isSpec(c: Cell | undefined): c is CellSpec {
  return typeof c === 'object' && c !== null && 'rating' in c;
}
function cellRating(c: Cell | undefined): Rating | undefined {
  if (c === undefined) return undefined;
  return isSpec(c) ? c.rating : c;
}
function cellNote(c: Cell | undefined): ReactNode | undefined {
  return isSpec(c) ? c.note : undefined;
}
function cellFootnotes(c: Cell | undefined): CellFootnote[] {
  return isSpec(c) && c.footnotes ? c.footnotes : [];
}

function assertValid(props: ComparisonMatrixProps): string[] {
  const {title, desc, options, criteria} = props;
  const ids = new Set(options.map((o) => o.id));
  for (const c of criteria) {
    for (const key of Object.keys(c.cells)) {
      if (!ids.has(key)) {
        throw new Error(
          `ComparisonMatrix "${title}": criterion "${c.label}" has a cell for "${key}", ` +
            `which is not an option id. Check the cell keys against your options.`,
        );
      }
    }
  }
  const warnings: string[] = [];
  if (!desc || !desc.trim()) {
    warnings.push(
      `"${title}" has no desc: add desc= so screen readers get an accessible summary ` +
        `of what is being compared.`,
    );
  }
  return warnings;
}

interface ActiveCell {
  criterion: string;
  option: string;
  rating: Rating | undefined;
  note: ReactNode;
  footnotes: CellFootnote[];
}

const ComparisonMatrix: React.FC<ComparisonMatrixProps> = (props) => {
  const {title, desc, options, criteria, legend = false, className, style} = props;
  // Throws (fails the build) on a cell keyed to a nonexistent option.
  const warnings = assertValid(props);
  useEffect(() => {
    for (const w of warnings) console.warn(`[comparison-matrix] warning: ${w}`);
  }, [warnings]);

  const optionLabel = new Map(options.map((o) => [o.id, o.label]));
  // The matrix is interactive only if at least one cell carries a note.
  const interactive = criteria.some((c) =>
    options.some((o) => cellNote(c.cells[o.id]) !== undefined),
  );

  // Which marks actually appear, so the legend only keys the ones in use (in mark order).
  const usedMarks = (() => {
    const present = new Set<string>();
    for (const c of criteria)
      for (const o of options) {
        const r = cellRating(c.cells[o.id]);
        if (r && MARK[r]) present.add(r);
      }
    return (['yes', 'no', 'partial'] as const).filter((k) => present.has(k));
  })();
  const showLegend = legend && usedMarks.length > 0;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<ActiveCell | null>(null);
  const openCell = useCallback(
    (criterionLabel: string, optionId: string, cell: Cell | undefined) => {
      setActive({
        criterion: criterionLabel,
        option: optionLabel.get(optionId) ?? optionId,
        rating: cellRating(cell),
        note: cellNote(cell),
        footnotes: cellFootnotes(cell),
      });
    },
    [optionLabel],
  );
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (active && !dlg.open && dlg.showModal) dlg.showModal();
    if (!active && dlg.open) dlg.close();
  }, [active]);

  const renderMark = (rating: Rating | undefined): ReactNode => {
    const mark = rating ? MARK[rating] : undefined;
    if (mark) {
      return (
        <span className={clsx(styles.mark, styles[`mark-${mark.cls}`])}>
          <span aria-hidden="true">{mark.glyph}</span>
          <span className={styles.sr}>{mark.label}</span>
        </span>
      );
    }
    return <span className={styles.value}>{rating ?? ''}</span>;
  };

  const activeRatingMark = active ? MARK[active.rating ?? ''] : undefined;

  return (
    <figure className={clsx(styles.matrix, className)} style={style}>
      <div className={styles.scroll}>
        <table>
          {desc && <caption className={styles.caption}>{desc}</caption>}
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>
                {title}
              </th>
              {options.map((o) => (
                <th
                  key={o.id}
                  scope="col"
                  className={clsx(styles.option, o.chosen && styles.optionChosen)}
                >
                  {o.chosen && <span className={styles.chosenBadge}>chosen</span>}
                  <span className={styles.optionLabel}>{o.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, ri) => (
              <tr key={ri}>
                <th scope="row" className={styles.criterion}>
                  {c.label}
                </th>
                {options.map((o) => {
                  const cell = c.cells[o.id];
                  const rating = cellRating(cell);
                  const hasNote = cellNote(cell) !== undefined;
                  return (
                    <td
                      key={o.id}
                      className={clsx(styles.cell, o.chosen && styles.cellChosen)}
                    >
                      {hasNote ? (
                        <button
                          type="button"
                          className={styles.cellButton}
                          aria-haspopup="dialog"
                          aria-label={`${c.label}, ${optionLabel.get(o.id)}: ${
                            rating ?? ''
                          }. Why?`}
                          onClick={() => openCell(c.label, o.id, cell)}
                        >
                          {renderMark(rating)}
                          <span className={styles.whyDot} aria-hidden="true" />
                        </button>
                      ) : (
                        renderMark(rating)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLegend && (
        <dl className={styles.legend} aria-label="What the marks mean">
          {usedMarks.map((k) => {
            const m = MARK[k];
            return (
              <div className={styles.legendRow} key={k}>
                <dt className={clsx(styles.mark, styles[`mark-${m.cls}`])} aria-hidden="true">
                  {m.glyph}
                </dt>
                <dd className={styles.legendText}>{m.label}</dd>
              </div>
            );
          })}
          {interactive && (
            <div className={styles.legendRow}>
              <dt className={styles.legendWhy} aria-hidden="true">
                <span className={styles.whyDot} />
              </dt>
              <dd className={styles.legendText}>a mark with this dot is clickable for the reasoning</dd>
            </div>
          )}
        </dl>
      )}

      {interactive && (
        <dialog
          ref={dialogRef}
          className={styles.modal}
          aria-labelledby={`${styles.modalTitle}-h`}
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
            <p className={styles.modalEyebrow}>
              {active?.criterion} · {active?.option}
            </p>
            <h3 className={styles.modalTitle}>
              {activeRatingMark ? (
                <span className={clsx(styles.mark, styles[`mark-${activeRatingMark.cls}`])}>
                  <span aria-hidden="true">{activeRatingMark.glyph}</span>
                </span>
              ) : null}
              <span>{activeRatingMark ? activeRatingMark.label : active?.rating}</span>
            </h3>
            {active?.note && <div className={styles.modalNote}>{active.note}</div>}
            {active && active.footnotes.length > 0 && (
              <dl className={styles.modalFootnotes}>
                {active.footnotes.map((f) => (
                  <React.Fragment key={f.id}>
                    <dt>{f.id}</dt>
                    <dd>{f.content}</dd>
                  </React.Fragment>
                ))}
              </dl>
            )}
          </div>
        </dialog>
      )}
    </figure>
  );
};

export default ComparisonMatrix;
