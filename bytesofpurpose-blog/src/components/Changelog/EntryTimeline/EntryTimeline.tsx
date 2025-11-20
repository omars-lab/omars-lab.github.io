import React from 'react';
import styles from './EntryTimeline.module.css';

export interface EntryTimelineProps {
  inceptionDate: string;
  executionDate: string;
}

/**
 * EntryTimeline Component
 * 
 * Displays a mini timeline with a horizontal bar, dots positioned on the bar,
 * and dates displayed underneath the dots.
 */
export function EntryTimeline({ inceptionDate, executionDate }: EntryTimelineProps) {
  const formatDate = (dateStr: string): string => {
    if (dateStr === 'TBD' || dateStr.includes('XX')) {
      return dateStr.replace('XX', '??');
    }
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = (start: string, end: string): string => {
    const isTBD = end === 'TBD' || end.includes('XX');
    
    try {
      const startDate = new Date(start);
      
      if (isNaN(startDate.getTime())) {
        return 'TBD';
      }
      
      // If execution is TBD, calculate days from inception to today
      if (isTBD) {
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} thus far`;
      }
      
      // If execution date exists, calculate duration between dates
      const endDate = new Date(end);
      
      if (isNaN(endDate.getTime())) {
        return 'TBD';
      }
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Same day';
      } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const remainingMonths = Math.floor((diffDays % 365) / 30);
        if (remainingMonths === 0) {
          return `${years} ${years === 1 ? 'year' : 'years'}`;
        }
        return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
      }
    } catch {
      return 'TBD';
    }
  };

  const isExecutionTBD = executionDate === 'TBD' || executionDate.includes('XX');
  const inceptionFormatted = formatDate(inceptionDate);
  const executionFormatted = isExecutionTBD ? 'TBD' : formatDate(executionDate);
  const duration = calculateDuration(inceptionDate, executionDate);

  return (
    <div className={styles.timeline}>
      {/* Timeline bar */}
      <div className={styles.timelineBar}>
        {/* Inception dot on bar */}
        <div className={styles.timelineDotContainer}>
          <div className={`${styles.timelineDot} ${styles.timelineDotInception}`} />
        </div>
        
        {/* Duration label on bar (centered) */}
        <div className={styles.timelineDuration}>
          <span className={styles.durationLabel}>{duration}</span>
        </div>
        
        {/* Execution dot on bar - always shown */}
        <div className={styles.timelineDotContainer}>
          <div className={`${styles.timelineDot} ${styles.timelineDotExecution} ${isExecutionTBD ? styles.timelineDotTBD : ''}`} />
        </div>
      </div>
      
      {/* Dates below dots */}
      <div className={styles.timelineDates}>
        <div className={styles.timelineDateItem}>
          <span className={styles.timelineLabel}>Inception</span>
          <span className={styles.timelineDate}>{inceptionFormatted}</span>
        </div>
        
        <div className={styles.timelineDateItem}>
          <span className={styles.timelineLabel}>Execution</span>
          <span className={styles.timelineDate}>{executionFormatted}</span>
        </div>
      </div>
    </div>
  );
}

