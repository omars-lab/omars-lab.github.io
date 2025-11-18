import React from 'react';
import styles from './Legend.module.css';

export interface LegendProps {
  category: 'content' | 'development';
}

/**
 * Legend Component
 * 
 * Displays the intensity scale legend for a heatmap row.
 * Shows "Less" → intensity squares → "More" → current month indicator
 */
export function Legend({ category }: LegendProps) {
  const today = new Date();
  
  return (
    <div className={styles.legend}>
      <span className={styles.legendLabel}>Less</span>
      <div className={styles.legendCells}>
        {[0, 1, 2, 3, 4].map((level) => {
          const intensityClass = category === 'content' 
            ? styles[`contentIntensity${level}` as keyof typeof styles]
            : styles[`developmentIntensity${level}` as keyof typeof styles];
          return (
            <div
              key={level}
              className={`${styles.legendCell} ${intensityClass || styles.intensity0}`}
            />
          );
        })}
      </div>
      <span className={styles.legendLabel}>More</span>
      <div className={styles.currentMonthIndicator}>
        <div className={styles.currentMonthCell} />
        <span className={styles.currentMonthLabel}>
          {today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

