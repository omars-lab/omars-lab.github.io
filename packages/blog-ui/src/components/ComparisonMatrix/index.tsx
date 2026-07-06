import React, {CSSProperties, ReactNode} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

/**
 * ComparisonMatrix : a criteria x options comparison for decision posts. Options are
 * columns, criteria are rows, each cell is a rating (a yes/no/partial mark or a short
 * value). The chosen option's column is highlighted and badged so the decision is
 * scannable at a glance. Pairs with <Accordion> (which carries the narrative); the
 * matrix carries the head-to-head.
 *
 * Rendered as a real HTML table (proper <th scope>) so a screen reader announces
 * "Consistency, Option B: partial". Zero JS; the table scrolls inside its own wrapper
 * on mobile rather than pushing the page sideways. A build-time gate throws if a cell
 * references an option id that does not exist.
 *
 * Distinct from OptionGrid/DecisionNote (design-system specimens that show explored
 * design directions with a chosen ring + WHY); ComparisonMatrix is the head-to-head
 * feature table for a decision post.
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
 *       {label: 'Zero-ops', cells: {a: 'no', b: 'yes', c: 'partial'}},
 *       {label: 'Relational', cells: {a: 'yes', b: 'yes', c: 'no'}},
 *       {label: 'Cost', cells: {a: '$$', b: 'free', c: '$'}},
 *     ]}
 *   />
 */
export type Rating = 'yes' | 'no' | 'partial' | string;

export interface MatrixOption {
  id: string;
  label: string;
  /** Mark the winning option: its column is highlighted and badged. */
  chosen?: boolean;
}

export interface MatrixCriterion {
  label: string;
  /** One cell per option, keyed by option id. 'yes'|'no'|'partial' render as marks;
   *  any other string renders as literal text. */
  cells: Record<string, Rating>;
}

export interface ComparisonMatrixProps {
  title: string;
  desc?: string;
  options: MatrixOption[];
  criteria: MatrixCriterion[];
  className?: string;
  style?: CSSProperties;
}

const MARK: Record<string, {glyph: string; label: string; cls: string}> = {
  yes: {glyph: '●', label: 'yes', cls: 'yes'}, // ●
  no: {glyph: '○', label: 'no', cls: 'no'}, // ○
  partial: {glyph: '◐', label: 'partial', cls: 'partial'}, // ◐
};

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

const ComparisonMatrix: React.FC<ComparisonMatrixProps> = (props) => {
  const {title, desc, options, criteria, className, style} = props;
  // Throws (fails the build) on a cell keyed to a nonexistent option.
  const warnings = assertValid(props);
  React.useEffect(() => {
    for (const w of warnings) console.warn(`[comparison-matrix] warning: ${w}`);
  }, [warnings]);

  const renderCell = (v: Rating | undefined): ReactNode => {
    const mark = v ? MARK[v] : undefined;
    if (mark) {
      return (
        <span className={clsx(styles.mark, styles[`mark-${mark.cls}`])} title={mark.label}>
          <span aria-hidden="true">{mark.glyph}</span>
          <span className={styles.sr}>{mark.label}</span>
        </span>
      );
    }
    return <span className={styles.value}>{v ?? ''}</span>;
  };

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
                {options.map((o) => (
                  <td
                    key={o.id}
                    className={clsx(styles.cell, o.chosen && styles.cellChosen)}
                  >
                    {renderCell(c.cells[o.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

export default ComparisonMatrix;
