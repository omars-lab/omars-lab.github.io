import React from 'react';
import type { ChangelogEntry } from '../types';
import styles from './ChangelogFilters.module.css';

export interface ChangelogFiltersProps {
  entries: ChangelogEntry[];
  statusFilter: string;
  typeFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

/**
 * ChangelogFilters Component
 * 
 * Displays filter dropdowns for status, type, priority, and category.
 */
export function ChangelogFilters({
  entries,
  statusFilter,
  typeFilter,
  priorityFilter,
  categoryFilter,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
  onCategoryChange,
}: ChangelogFiltersProps) {
  const uniqueStatuses = React.useMemo(() => [...new Set(entries.map(e => e.status))].sort(), [entries]);
  const uniqueTypes = React.useMemo(() => [...new Set(entries.map(e => e.type))].sort(), [entries]);
  const uniquePriorities = React.useMemo(() => [...new Set(entries.map(e => e.priority))].sort(), [entries]);

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterGroup}>
        <label htmlFor="status-filter" className={styles.filterLabel}>Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Statuses</option>
          {uniqueStatuses.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="type-filter" className={styles.filterLabel}>Type:</label>
        <select
          id="type-filter"
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="priority-filter" className={styles.filterLabel}>Priority:</label>
        <select
          id="priority-filter"
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Priorities</option>
          {uniquePriorities.map(priority => (
            <option key={priority} value={priority}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="category-filter" className={styles.filterLabel}>Category:</label>
        <select
          id="category-filter"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Categories</option>
          <option value="content">Content</option>
          <option value="development">Development</option>
        </select>
      </div>
    </div>
  );
}

