import React from 'react';
import { Legend } from '../Legend';
import styles from './LegendSidebar.module.css';

export interface LegendSidebarProps {
  title: string;
  category: 'content' | 'development';
}

/**
 * LegendSidebar Component
 * 
 * Displays the title and legend for a heatmap row.
 * This is a separate component from the heatmap row itself.
 */
export function LegendSidebar({ title, category }: LegendSidebarProps) {
  return (
    <div className={styles.legendSidebar}>
      <h3 className={styles.legendTitle}>{title}</h3>
      <Legend category={category} />
    </div>
  );
}

