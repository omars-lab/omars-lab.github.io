import React from 'react';
import type { MonthCell } from '../types';
import { Highlight } from '@site/src/components/Highlighters';
import styles from './DateOverlay.module.css';

export interface DateOverlayProps {
  monthsByYearAndQuarter: Array<{ year: number; quarters: Array<{ quarter: number; months: MonthCell[] }> }>;
}

/**
 * DateOverlay Component
 * 
 * Displays shared year and quarter labels above the heatmap rows.
 * This overlay is fixed and shared across all heatmap rows.
 */
export function DateOverlay({ monthsByYearAndQuarter }: DateOverlayProps) {
  return (
    <div className={styles.dateOverlay}>
      <div className={styles.dateOverlayContent}>
        <div className={styles.heatmapGrid}>
          {monthsByYearAndQuarter.map(({ year, quarters }) => {
            // Calculate year width accounting for quarter gaps
            // Must match HeatmapRow: CSS gap (2px) applies to gap divs, so:
            // Visual gap = gap div width (4px) + CSS gap before (2px) + CSS gap after (2px) = 8px total
            const quarterWidths = quarters.map(q => q.months.length * 20 + (q.months.length - 1) * 2);
            const totalQuarterWidths = quarterWidths.reduce((sum, w) => sum + w, 0);
            const quarterGaps = quarters.length > 1 ? (quarters.length - 1) * 8 : 0; // 8px total visual gap
            const yearGroupWidth = totalQuarterWidths + quarterGaps;
            
            return (
              <div 
                key={year} 
                data-year={year}
                className={styles.yearGroup}
                style={{ width: `${yearGroupWidth}px` }}
              >
                {/* Year label and line */}
                <div className={styles.yearHeader}>
                  <div 
                    className={styles.yearLine} 
                    style={{ width: `${yearGroupWidth}px` }}
                  />
                  <Highlight label="">{year}</Highlight>
                </div>
                
                {/* Quarter labels and lines */}
                <div className={styles.quarterHeader} style={{ width: `${yearGroupWidth}px` }}>
                  {quarters.map(({ quarter, months: quarterMonths }, quarterIndex) => {
                    const quarterWidth = quarterMonths.length * 20 + (quarterMonths.length - 1) * 2;
                    return (
                      <React.Fragment key={`${year}-Q${quarter}`}>
                        {/* Add gap before quarter if not first */}
                        {/* Note: CSS gap (2px) applies, so this 4px div + 2px CSS gap on each side = 8px total visual gap */}
                        {quarterIndex > 0 && <div style={{ width: '4px', flexShrink: 0 }} />}
                        <div 
                          className={styles.quarterHeaderItem}
                          style={{ width: `${quarterWidth}px` }}
                        >
                          <div className={styles.quarterLine} />
                          <span className={styles.quarterLabel}>Q{quarter}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.dateOverlaySpacer} />
    </div>
  );
}

