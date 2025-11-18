import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ChangelogEntry, HeatmapCell, MonthCell, QuarterData, ChangelogProps } from './types';
import { DateOverlay } from './DateOverlay';
import { HeatmapRow } from './HeatmapRow';
import { LegendSidebar } from './LegendSidebar';
import { ChangelogFilters } from './Filters';
import { QuarterSection } from './QuarterSection';
import styles from './Changelog.module.css';

/**
 * Changelog Component
 * 
 * Displays changelog entries in separate heatmap rows for content and development,
 * sharing the same date bars/quarter overlay, with filtered quarterly sections.
 * 
 * Features:
 * - Two heatmap rows (content and development) sharing date/quarter headers
 * - Separate legends for each row
 * - Quarterly changes split into content and development sections
 * - Filter dropdowns for status, type, priority, and category
 */

// Helper function to generate heatmap data for a specific category
function generateHeatmapDataForCategory(
  entries: ChangelogEntry[],
  startDate: Date,
  endDate: Date
): { monthHeatmapData: MonthCell[]; months: MonthCell[]; monthsByYearAndQuarter: Array<{ year: number; quarters: Array<{ quarter: number; months: MonthCell[] }> }>; maxCount: number } {
  // Generate heatmap data grouped by month
  const monthMap = new Map<string, MonthCell>();

  // Parse dates and group entries by month
  entries.forEach((entry) => {
    // Use execution_date if available and not TBD, otherwise use inception_date
    const dateStr = entry.execution_date !== 'TBD' ? entry.execution_date : entry.inception_date;
    
    // Handle dates with XX (e.g., 2025-12-XX)
    let date: Date;
    if (dateStr.includes('XX')) {
      const normalized = dateStr.replace('XX', '01');
      date = new Date(normalized);
    } else {
      date = new Date(dateStr);
    }

    // Skip invalid dates
    if (isNaN(date.getTime())) return;

    // Find the start of the month
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    // Find the end of the month
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    // Create month key (YYYY-MM format)
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    if (!monthMap.has(monthKey)) {
      const quarter = Math.floor(month / 3) + 1;
      monthMap.set(monthKey, {
        monthStart,
        monthEnd,
        count: 0,
        entries: [],
        year,
        month,
        quarter,
      });
    }
    
    const cell = monthMap.get(monthKey)!;
    cell.count++;
    cell.entries.push(entry);
  });

  const monthHeatmapData = Array.from(monthMap.values()).sort((a, b) => a.monthStart.getTime() - b.monthStart.getTime());

  // Generate all months in range
  const monthCells: MonthCell[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  while (current <= endMonth) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    
    // Check if we have data for this month
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    
    const existingMonth = monthHeatmapData.find(m => {
      return m.year === year && m.month === month;
    });

    if (existingMonth) {
      monthCells.push(existingMonth);
    } else {
      const quarter = Math.floor(month / 3) + 1;
      monthCells.push({
        monthStart,
        monthEnd,
        count: 0,
        entries: [],
        year,
        month,
        quarter,
      });
    }
    
    // Move to next month - use setMonth to handle year rollover correctly
    current.setMonth(current.getMonth() + 1);
  }

  // Group months by year and quarter
  const yearMap = new Map<number, Map<number, MonthCell[]>>();
  
  monthCells.forEach(month => {
    if (!yearMap.has(month.year)) {
      yearMap.set(month.year, new Map());
    }
    const quarterMap = yearMap.get(month.year)!;
    if (!quarterMap.has(month.quarter)) {
      quarterMap.set(month.quarter, []);
    }
    quarterMap.get(month.quarter)!.push(month);
  });
  
  const monthsByYearAndQuarter: Array<{ year: number; quarters: Array<{ quarter: number; months: MonthCell[] }> }> = [];
  Array.from(yearMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([year, quarterMap]) => {
      const quarters = Array.from(quarterMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([quarter, months]) => ({ quarter, months }));
      monthsByYearAndQuarter.push({ year, quarters });
    });

  const maxCount = Math.max(...monthHeatmapData.map(cell => cell.count), 1);

  return { monthHeatmapData, months: monthCells, monthsByYearAndQuarter, maxCount };
}

export function Changelog({ entries, getEntryUrl = (slug) => `/changelog/${slug}` }: ChangelogProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<'content' | 'development' | null>(null);
  const quartersScrollRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Split entries by category
  const contentEntries = useMemo(() => entries.filter(e => e.category === 'content'), [entries]);
  const developmentEntries = useMemo(() => entries.filter(e => e.category === 'development' || !e.category), [entries]);

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      planned: styles.badgePlanned,
      'in-progress': styles.badgeInProgress,
      completed: styles.badgeCompleted,
      cancelled: styles.badgeCancelled,
    };
    return statusClasses[status] || styles.badgeDefault;
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      refactoring: styles.badgeRefactoring,
      feature: styles.badgeFeature,
      bugfix: styles.badgeBugfix,
      documentation: styles.badgeDocumentation,
      infrastructure: styles.badgeInfrastructure,
      optimization: styles.badgeOptimization,
    };
    return typeClasses[type] || styles.badgeDefault;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityClasses = {
      low: styles.badgeLow,
      medium: styles.badgeMedium,
      high: styles.badgeHigh,
      critical: styles.badgeCritical,
    };
    return priorityClasses[priority] || styles.badgeDefault;
  };

  // Generate date range for heatmap (1 year ago, this year, next year)
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentYear = today.getFullYear();
    const oneYearAgo = currentYear - 1;
    const nextYear = currentYear + 1;
    
    // Start from January 1st of one year ago
    const start = new Date(oneYearAgo, 0, 1);
    start.setHours(0, 0, 0, 0);
    
    // End at December 31st of next year
    const end = new Date(nextYear, 11, 31);
    end.setHours(23, 59, 59, 999);
    
    return { startDate: start, endDate: end };
  }, []);

  // Generate heatmap data for content and development
  const contentHeatmap = useMemo(() => 
    generateHeatmapDataForCategory(contentEntries, startDate, endDate),
    [contentEntries, startDate, endDate]
  );

  const developmentHeatmap = useMemo(() => 
    generateHeatmapDataForCategory(developmentEntries, startDate, endDate),
    [developmentEntries, startDate, endDate]
  );

  // Use the same year/quarter structure for both (from development, which has more entries)
  const sharedYearQuarterStructure = developmentHeatmap.monthsByYearAndQuarter;

  // Get color intensity class based on category
  const getIntensityClass = (count: number, maxCount: number, category: 'content' | 'development'): string => {
    if (count === 0) {
      return category === 'content' ? styles.contentIntensity0 : styles.developmentIntensity0;
    }
    const intensity = Math.min(4, Math.ceil((count / maxCount) * 4));
    const prefix = category === 'content' ? 'contentIntensity' : 'developmentIntensity';
    return styles[`${prefix}${intensity}` as keyof typeof styles] || (category === 'content' ? styles.contentIntensity1 : styles.developmentIntensity1);
  };

  // Get month data for a specific category and year/quarter/month
  const getMonthData = (category: 'content' | 'development', year: number, month: number): MonthCell | null => {
    const heatmap = category === 'content' ? contentHeatmap : developmentHeatmap;
    return heatmap.months.find(m => m.year === year && m.month === month) || null;
  };

  // Handle cell hover
  const handleCellHover = (
    cell: HeatmapCell | null,
    position: { x: number; y: number } | null,
    category: 'content' | 'development' | null
  ) => {
    setHoveredCell(cell);
    setTooltipPosition(position);
    setHoveredCategory(category);
  };

  // Handle cell click
  const handleCellClick = (quarterKey: string) => {
    setSelectedQuarter(quarterKey);
  };

  // Group entries by quarter with filters
  const getFilteredQuartersData = (category: 'content' | 'development') => {
    const categoryEntries = category === 'content' ? contentEntries : developmentEntries;
    
    // Apply filters
    let filtered = categoryEntries.filter(entry => {
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && entry.priority !== priorityFilter) return false;
      return true;
    });

    const quartersMap = new Map<string, QuarterData>();

    filtered.forEach((entry) => {
      const dateStr = entry.execution_date !== 'TBD' ? entry.execution_date : entry.inception_date;
      let date: Date;
      
      if (dateStr.includes('XX')) {
        const normalized = dateStr.replace('XX', '01');
        date = new Date(normalized);
      } else {
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth();
      const quarterNum = Math.floor(month / 3) + 1;
      const quarterKey = `${year}-Q${quarterNum}`;

      if (!quartersMap.has(quarterKey)) {
        const quarterStartMonth = (quarterNum - 1) * 3;
        const startDate = new Date(year, quarterStartMonth, 1);
        const endDate = new Date(year, quarterStartMonth + 3, 0);
        
        quartersMap.set(quarterKey, {
          quarter: quarterKey,
          year,
          quarterNum,
          entries: [],
          startDate,
          endDate,
        });
      }

      quartersMap.get(quarterKey)!.entries.push(entry);
    });

    // Sort quarters by date (newest first)
    return Array.from(quartersMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.quarterNum - a.quarterNum;
    });
  };

  const contentQuartersData = useMemo(() => getFilteredQuartersData('content'), [contentEntries, statusFilter, typeFilter, priorityFilter]);
  const developmentQuartersData = useMemo(() => getFilteredQuartersData('development'), [developmentEntries, statusFilter, typeFilter, priorityFilter]);

  // Scroll to selected quarter
  useEffect(() => {
    if (selectedQuarter && quartersScrollRef.current) {
      const quarterElement = document.getElementById(`quarter-${selectedQuarter}`);
      if (quarterElement) {
        quarterElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedQuarter]);

  return (
    <div className={styles.changelogContainer}>
      <div className={styles.headerSection}>
        <h1>Changelog</h1>
        <p>
          Track all changes, plans, and improvements made to the blog. Click on the heatmap to navigate to specific quarters.
        </p>
      </div>

      {/* Heatmap Section - Shared date bars with two rows */}
      <div className={styles.heatmapSection}>
        <h2 className={styles.heatmapTitle}>Activity Heatmap</h2>
        
        <div className={styles.heatmapContainer}>
          {/* Heatmap Section - DateOverlay above rows on left, Legends on right */}
          <div className={styles.heatmapRowsAndLegends}>
            {/* Left side: DateOverlay above rows */}
            <div className={styles.heatmapRowsSection}>
              {/* Shared year/quarter headers - Above rows only */}
              <div className={styles.dateOverlayWrapper}>
                <DateOverlay monthsByYearAndQuarter={sharedYearQuarterStructure} />
              </div>
              
              {/* Heatmap Rows */}
              <div className={styles.heatmapRowsContainer}>
                {/* Content Heatmap Row */}
                {(categoryFilter === 'all' || categoryFilter === 'content') && (
                  <HeatmapRow
                    category="content"
                    monthsByYearAndQuarter={sharedYearQuarterStructure}
                    maxCount={contentHeatmap.maxCount}
                    selectedQuarter={selectedQuarter}
                    getMonthData={getMonthData}
                    getIntensityClass={getIntensityClass}
                    onCellHover={handleCellHover}
                    onCellClick={handleCellClick}
                  />
                )}
                
                {/* Development Heatmap Row */}
                {(categoryFilter === 'all' || categoryFilter === 'development') && (
                  <HeatmapRow
                    category="development"
                    monthsByYearAndQuarter={sharedYearQuarterStructure}
                    maxCount={developmentHeatmap.maxCount}
                    selectedQuarter={selectedQuarter}
                    getMonthData={getMonthData}
                    getIntensityClass={getIntensityClass}
                    onCellHover={handleCellHover}
                    onCellClick={handleCellClick}
                  />
                )}
                
                {/* Future rows can be added here easily */}
              </div>
            </div>
            
            {/* Legends Section - Right side */}
            <div className={styles.legendsSection}>
              <h3 className={styles.legendsSectionHeader}>Legend</h3>
              {(categoryFilter === 'all' || categoryFilter === 'content') && (
                <LegendSidebar
                  title="Content (Posts, Docs)"
                  category="content"
                />
              )}
              
              {(categoryFilter === 'all' || categoryFilter === 'development') && (
                <LegendSidebar
                  title="Development (Components, Infrastructure)"
                  category="development"
                />
              )}
            </div>
          </div>
        </div>

        {hoveredCell && tooltipPosition && (
          <div 
            className={styles.heatmapTooltip}
            style={{
              position: 'fixed',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className={styles.tooltipDate}>
              {hoveredCell.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </div>
            <div className={styles.tooltipCount}>
              {hoveredCell.count} {hoveredCell.count === 1 ? 'entry' : 'entries'} ({hoveredCategory})
            </div>
            <div className={styles.tooltipEntries}>
              {hoveredCell.entries.slice(0, 3).map((entry) => (
                <div key={entry.slug} className={styles.tooltipEntry}>
                  • {entry.title}
                </div>
              ))}
              {hoveredCell.entries.length > 3 && (
                <div className={styles.tooltipMore}>
                  +{hoveredCell.entries.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quarters List Section with Filters */}
      <div className={styles.quartersSection}>
        <h2 className={styles.quartersTitle}>Entries by Quarter</h2>
        
        {/* Filter Dropdowns */}
        <ChangelogFilters
          entries={entries}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          priorityFilter={priorityFilter}
          categoryFilter={categoryFilter}
          onStatusChange={setStatusFilter}
          onTypeChange={setTypeFilter}
          onPriorityChange={setPriorityFilter}
          onCategoryChange={setCategoryFilter}
        />

        {/* Content Quarters Section */}
        {(categoryFilter === 'all' || categoryFilter === 'content') && (
          <QuarterSection
            title="Content Changes"
            quartersData={contentQuartersData}
            selectedQuarter={selectedQuarter}
            getEntryUrl={getEntryUrl}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
            getPriorityBadge={getPriorityBadge}
          />
        )}
        
        {/* Development Quarters Section */}
        {(categoryFilter === 'all' || categoryFilter === 'development') && (
          <QuarterSection
            title="Development Changes"
            quartersData={developmentQuartersData}
            selectedQuarter={selectedQuarter}
            getEntryUrl={getEntryUrl}
            getStatusBadge={getStatusBadge}
            getTypeBadge={getTypeBadge}
            getPriorityBadge={getPriorityBadge}
            scrollRef={quartersScrollRef}
          />
        )}
      </div>
    </div>
  );
}
