import React from 'react';
import type { MonthCell, HeatmapCell } from '../types';
import styles from './HeatmapRow.module.css';

export interface HeatmapRowProps {
  category: 'content' | 'development';
  monthsByYearAndQuarter: Array<{ year: number; quarters: Array<{ quarter: number; months: MonthCell[] }> }>;
  maxCount: number;
  selectedQuarter: string | null;
  getMonthData: (category: 'content' | 'development', year: number, month: number) => MonthCell | null;
  getIntensityClass: (count: number, maxCount: number, category: 'content' | 'development') => string;
  onCellHover: (cell: HeatmapCell | null, position: { x: number; y: number } | null, category: 'content' | 'development' | null) => void;
  onCellClick: (quarterKey: string) => void;
}

/**
 * HeatmapRow Component
 * 
 * Displays a single row of heatmap squares.
 * Each row represents a category (content or development).
 * Title and legend are handled separately by LegendSidebar component.
 */
export function HeatmapRow({
  category,
  monthsByYearAndQuarter,
  maxCount,
  selectedQuarter,
  getMonthData,
  getIntensityClass,
  onCellHover,
  onCellClick,
}: HeatmapRowProps) {
  return (
    <div className={styles.heatmapRow}>
      <div className={styles.heatmapRowContent}>
        <div className={styles.heatmapGrid}>
          {monthsByYearAndQuarter.map(({ year, quarters }) => {
            // Calculate year width accounting for quarter gaps
            // CSS gap (2px) applies to quarterGap divs too, so:
            // Visual gap = quarterGap width (4px) + CSS gap before (2px) + CSS gap after (2px) = 8px total
            const quarterWidths = quarters.map(q => q.months.length * 20 + (q.months.length - 1) * 2);
            const totalQuarterWidths = quarterWidths.reduce((sum, w) => sum + w, 0);
            const quarterGaps = quarters.length > 1 ? (quarters.length - 1) * 8 : 0; // 8px total visual gap
            const yearGroupWidth = totalQuarterWidths + quarterGaps;
            
            return (
              <div 
                key={year} 
                className={styles.yearGroup}
                style={{ width: `${yearGroupWidth}px` }}
              >
                {/* Months row */}
                <div className={styles.monthsRow}>
                  {quarters.map(({ quarter, months: quarterMonths }, quarterIndex) => (
                    <React.Fragment key={`${year}-Q${quarter}`}>
                      {/* Add gap before quarter if not first */}
                      {quarterIndex > 0 && <div className={styles.quarterGap} />}
                      {quarterMonths.map((month, monthIndex) => {
                        const monthData = getMonthData(category, year, month.month);
                        const count = monthData?.count || 0;
                        const today = new Date();
                        const isCurrentMonth = month.monthStart <= today && month.monthEnd >= today;
                        const quarterKey = `${year}-Q${quarter}`;
                        const isSelected = selectedQuarter === quarterKey && count > 0;
                        
                        return (
                          <div
                            key={`${year}-${month.month}-${monthIndex}`}
                            className={`${styles.heatmapMonthCell} ${getIntensityClass(count, maxCount, category)} ${isCurrentMonth ? styles.currentMonth : ''} ${isSelected ? styles.selected : ''}`}
                            onMouseEnter={(e) => {
                              if (count > 0 && monthData) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                onCellHover(
                                  {
                                    date: monthData.monthStart,
                                    count: monthData.count,
                                    entries: monthData.entries,
                                  } as HeatmapCell,
                                  {
                                    x: rect.left + rect.width / 2,
                                    y: rect.top - 10,
                                  },
                                  category
                                );
                              }
                            }}
                            onMouseLeave={() => {
                              onCellHover(null, null, null);
                            }}
                            onClick={() => {
                              if (count > 0) {
                                onCellClick(quarterKey);
                              }
                            }}
                            title={count > 0 ? `${count} ${count === 1 ? 'entry' : 'entries'} in ${month.monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : month.monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

