export interface ChangelogEntry {
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  inception_date: string;
  execution_date: string;
  type: 'refactoring' | 'feature' | 'bugfix' | 'documentation' | 'infrastructure' | 'optimization';
  component?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: 'content' | 'development'; // 'content' for blog posts/docs, 'development' for infrastructure/components
  slug: string;
  // Note: content is not included - it's available in the markdown files themselves
}

export interface HeatmapCell {
  date: Date;
  count: number;
  entries: ChangelogEntry[];
}

export interface MonthCell {
  monthStart: Date; // Start of month
  monthEnd: Date; // End of month
  count: number;
  entries: ChangelogEntry[];
  year: number;
  month: number; // 0-11
  quarter: number; // 1-4
}

export interface QuarterData {
  quarter: string; // e.g., "2025-Q4"
  year: number;
  quarterNum: number;
  entries: ChangelogEntry[];
  startDate: Date;
  endDate: Date;
}

export interface ChangelogProps {
  entries: ChangelogEntry[];
  getEntryUrl?: (slug: string) => string;
}

