import React from 'react';
import type { ChangelogEntry } from '../types';
import styles from './ChangelogFilters.module.css';
// Import badge styles to match card badge appearance
import badgeStyles from '../QuarterSection/QuarterSection.module.css';

export interface ChangelogFiltersProps {
  entries: ChangelogEntry[];
  statusFilter: string;
  typeFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  yearFilter: string;
  quarterFilter: string;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onQuarterChange: (value: string) => void;
}

/**
 * ChangelogFilters Component
 * 
 * Displays filter dropdowns for status, type, priority, and category on desktop.
 * On mobile, displays horizontal scrolling tiles/chips for better touch interaction.
 */
export function ChangelogFilters({
  entries,
  statusFilter,
  typeFilter,
  priorityFilter,
  categoryFilter,
  yearFilter,
  quarterFilter,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
  onCategoryChange,
  onYearChange,
  onQuarterChange,
}: ChangelogFiltersProps) {
  // Custom ordering for statuses: planned, in-progress, completed, cancelled
  const statusOrder: Record<string, number> = {
    planned: 0,
    'in-progress': 1,
    completed: 2,
    cancelled: 3,
  };
  const uniqueStatuses = React.useMemo(() => {
    const statuses = [...new Set(entries.map(e => e.status))];
    return statuses.sort((a, b) => {
      const orderA = statusOrder[a] ?? 999;
      const orderB = statusOrder[b] ?? 999;
      return orderA - orderB;
    });
  }, [entries]);

  const uniqueTypes = React.useMemo(() => [...new Set(entries.map(e => e.type))].sort(), [entries]);

  // Custom ordering for priorities: high, medium, low, critical
  const priorityOrder: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
    critical: 3,
  };
  const uniquePriorities = React.useMemo(() => {
    const priorities = [...new Set(entries.map(e => e.priority))];
    return priorities.sort((a, b) => {
      const orderA = priorityOrder[a] ?? 999;
      const orderB = priorityOrder[b] ?? 999;
      return orderA - orderB;
    });
  }, [entries]);

  // Extract unique years from entries
  const uniqueYears = React.useMemo(() => {
    const years = new Set<number>();
    entries.forEach(entry => {
      const dateStr = entry.execution_date !== 'TBD' ? entry.execution_date : entry.inception_date;
      if (dateStr.includes('XX')) {
        const normalized = dateStr.replace('XX', '01');
        const date = new Date(normalized);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      } else {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  }, [entries]);

  // Extract unique quarters from entries (format: "Q1", "Q2", etc.)
  // Filter by selected year if yearFilter is set
  const uniqueQuarters = React.useMemo(() => {
    const quarters = new Set<number>(); // Store quarter numbers (1-4)
    entries.forEach(entry => {
      const dateStr = entry.execution_date !== 'TBD' ? entry.execution_date : entry.inception_date;
      let date: Date;
      if (dateStr.includes('XX')) {
        const normalized = dateStr.replace('XX', '01');
        date = new Date(normalized);
      } else {
        date = new Date(dateStr);
      }
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const quarterNum = Math.floor(month / 3) + 1;
        
        // If year filter is set, only include quarters from that year
        if (yearFilter === 'all' || year.toString() === yearFilter) {
          quarters.add(quarterNum);
        }
      }
    });
    // Return as "Q1", "Q2", etc., sorted ascending
    return Array.from(quarters).sort((a, b) => a - b).map(q => `Q${q}`);
  }, [entries, yearFilter]);

  const formatLabel = (value: string): string => {
    return value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
  };

  // Helper functions to get badge classes matching card badges
  const getStatusBadgeClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      planned: badgeStyles.badgePlanned,
      'in-progress': badgeStyles.badgeInProgress,
      completed: badgeStyles.badgeCompleted,
      cancelled: badgeStyles.badgeCancelled,
    };
    return statusClasses[status] || badgeStyles.badgeDefault;
  };

  const getTypeBadgeClass = (type: string): string => {
    const typeClasses: Record<string, string> = {
      refactoring: badgeStyles.badgeRefactoring,
      feature: badgeStyles.badgeFeature,
      bugfix: badgeStyles.badgeBugfix,
      documentation: badgeStyles.badgeDocumentation,
      infrastructure: badgeStyles.badgeInfrastructure,
      optimization: badgeStyles.badgeOptimization,
    };
    return typeClasses[type] || badgeStyles.badgeDefault;
  };

  const getPriorityBadgeClass = (priority: string): string => {
    const priorityClasses: Record<string, string> = {
      low: badgeStyles.badgeLow,
      medium: badgeStyles.badgeMedium,
      high: badgeStyles.badgeHigh,
      critical: badgeStyles.badgeCritical,
    };
    return priorityClasses[priority] || badgeStyles.badgeDefault;
  };

  return (
    <div className={styles.filtersContainer}>
      {/* Two-column layout - fixed labels on left, scrollable tiles on right */}
      <div className={styles.filterTilesContainer}>
        <div className={styles.filterRow}>
          <div className={styles.filterLabelColumn}>
            <div className={styles.filterTileLabel}>Status</div>
          </div>
          <div className={styles.filterTilesColumn}>
            <div className={styles.filterTileRow}>
              <button
                className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${statusFilter === 'all' ? styles.filterTileActive : ''}`}
                onClick={() => onStatusChange('all')}
              >
                All
              </button>
              {uniqueStatuses.map(status => (
                <button
                  key={status}
                  className={`${styles.filterTile} ${badgeStyles.badge} ${getStatusBadgeClass(status)} ${statusFilter === status ? styles.filterTileActive : ''}`}
                  onClick={() => onStatusChange(status)}
                >
                  {formatLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterLabelColumn}>
            <div className={styles.filterTileLabel}>Type</div>
          </div>
          <div className={styles.filterTilesColumn}>
            <div className={styles.filterTileRow}>
              <button
                className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${typeFilter === 'all' ? styles.filterTileActive : ''}`}
                onClick={() => onTypeChange('all')}
              >
                All
              </button>
              {uniqueTypes.map(type => (
                <button
                  key={type}
                  className={`${styles.filterTile} ${badgeStyles.badge} ${getTypeBadgeClass(type)} ${typeFilter === type ? styles.filterTileActive : ''}`}
                  onClick={() => onTypeChange(type)}
                >
                  {formatLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterLabelColumn}>
            <div className={styles.filterTileLabel}>Priority</div>
          </div>
          <div className={styles.filterTilesColumn}>
            <div className={styles.filterTileRow}>
              <button
                className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${priorityFilter === 'all' ? styles.filterTileActive : ''}`}
                onClick={() => onPriorityChange('all')}
              >
                All
              </button>
              {uniquePriorities.map(priority => (
                <button
                  key={priority}
                  className={`${styles.filterTile} ${badgeStyles.badge} ${getPriorityBadgeClass(priority)} ${priorityFilter === priority ? styles.filterTileActive : ''}`}
                  onClick={() => onPriorityChange(priority)}
                >
                  {formatLabel(priority)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterLabelColumn}>
            <div className={styles.filterTileLabel}>Category</div>
          </div>
          <div className={styles.filterTilesColumn}>
            <div className={styles.filterTileRow}>
              <button
                className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${categoryFilter === 'all' ? styles.filterTileActive : ''}`}
                onClick={() => onCategoryChange('all')}
              >
                All
              </button>
              <button
                className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${categoryFilter === 'content' ? styles.filterTileActive : ''}`}
                onClick={() => onCategoryChange('content')}
              >
                Content
              </button>
              <button
                className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${categoryFilter === 'development' ? styles.filterTileActive : ''}`}
                onClick={() => onCategoryChange('development')}
              >
                Development
              </button>
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterLabelColumn}>
            <div className={styles.filterTileLabel}>Year</div>
          </div>
          <div className={styles.filterTilesColumn}>
            <div className={styles.filterTileRow}>
              <button
                className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${yearFilter === 'all' ? styles.filterTileActive : ''}`}
                onClick={() => onYearChange('all')}
              >
                All
              </button>
              {uniqueYears.map(year => (
                <button
                  key={year}
                  className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${yearFilter === year.toString() ? styles.filterTileActive : ''}`}
                  onClick={() => onYearChange(year.toString())}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterLabelColumn}>
            <div className={styles.filterTileLabel}>Quarter</div>
          </div>
          <div className={styles.filterTilesColumn}>
            <div className={styles.filterTileRow}>
              <button
                className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${quarterFilter === 'all' ? styles.filterTileActive : ''}`}
                onClick={() => onQuarterChange('all')}
              >
                All
              </button>
              {uniqueQuarters.length > 0 ? (
                uniqueQuarters.map(quarter => (
                  <button
                    key={quarter}
                    className={`${styles.filterTile} ${badgeStyles.badge} ${badgeStyles.badgeDefault} ${quarterFilter === quarter ? styles.filterTileActive : ''}`}
                    onClick={() => onQuarterChange(quarter)}
                  >
                    {quarter}
                  </button>
                ))
              ) : (
                <span className={styles.filterTileLabel} style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                  {yearFilter === 'all' ? 'Select a year first' : 'No quarters found'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

