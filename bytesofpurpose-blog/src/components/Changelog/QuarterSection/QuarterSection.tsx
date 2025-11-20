import React from 'react';
import type { QuarterData, ChangelogEntry } from '../types';
import { EntryTimeline } from '../EntryTimeline';
import styles from './QuarterSection.module.css';

export interface QuarterSectionProps {
  title: string;
  quartersData: QuarterData[];
  selectedQuarter: string | null;
  getEntryUrl: (slug: string) => string;
  getStatusBadge: (status: string) => string;
  getTypeBadge: (type: string) => string;
  getPriorityBadge: (priority: string) => string;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

const statusOrder = ['completed', 'in-progress', 'planned', 'cancelled'];

/**
 * QuarterSection Component
 * 
 * Displays quarterly changelog entries in a horizontal scrolling layout on desktop,
 * and vertically stacked on mobile. Entries are grouped by status within each quarter.
 */
export function QuarterSection({
  title,
  quartersData,
  selectedQuarter,
  getEntryUrl,
  getStatusBadge,
  getTypeBadge,
  getPriorityBadge,
  scrollRef,
}: QuarterSectionProps) {
  return (
    <div className={styles.categoryQuarterSection}>
      <h2 className={styles.categoryQuarterTitle}>{title}</h2>
      <div className={styles.quartersScrollContainer} ref={scrollRef}>
        {quartersData.map((quarter) => (
          <div
            key={quarter.quarter}
            id={`quarter-${quarter.quarter}`}
            className={`${styles.quarterColumn} ${selectedQuarter === quarter.quarter ? styles.quarterSelected : ''}`}
          >
            <div className={styles.quarterHeader}>
              <h3 className={styles.quarterTitle}>{quarter.quarter}</h3>
              <span className={styles.quarterCount}>
                {quarter.entries.length} {quarter.entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <div className={styles.quarterEntries}>
              {statusOrder.map((status) => {
                const entriesForStatus = quarter.entries.filter(e => e.status === status);
                if (entriesForStatus.length === 0) return null;

                return (
                  <div key={status} className={styles.quarterStatusGroup}>
                    <h4 className={styles.quarterStatusTitle}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </h4>
                    <div className={styles.quarterCards}>
                      {entriesForStatus.map((entry) => (
                        <div key={entry.slug} className={styles.entryCard}>
                          <div className={styles.entryHeader}>
                            <h3 className={styles.entryTitle}>
                              <a href={getEntryUrl(entry.slug)}>{entry.title}</a>
                            </h3>
                            <div className={styles.badges}>
                              <span className={`${styles.badge} ${getStatusBadge(entry.status)}`}>
                                {entry.status}
                              </span>
                              <span className={`${styles.badge} ${getTypeBadge(entry.type)}`}>
                                {entry.type}
                              </span>
                              <span className={`${styles.badge} ${getPriorityBadge(entry.priority)}`}>
                                {entry.priority}
                              </span>
                            </div>
                          </div>
                          <p className={styles.entryDescription}>{entry.description}</p>
                          <div className={styles.entryMeta}>
                            {entry.component && (
                              <span className={styles.metaItem}>
                                <strong>Component:</strong> {entry.component}
                              </span>
                            )}
                            <EntryTimeline
                              inceptionDate={entry.inception_date}
                              executionDate={entry.execution_date}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

