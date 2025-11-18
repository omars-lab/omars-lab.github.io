import React from 'react';
// @ts-ignore - Docusaurus theme module
import Layout from '@theme/Layout';
// @ts-ignore - Docusaurus module
import Link from '@docusaurus/Link';
// @ts-ignore - CSS module
import styles from './changelog.module.css';

interface ChangelogEntry {
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  inception_date: string;
  execution_date: string;
  type: 'refactoring' | 'feature' | 'bugfix' | 'documentation' | 'infrastructure';
  component?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  content: string;
  slug: string;
}

export default function ChangelogPage() {
  // Get all changelog entries from the filesystem
  // For now, we'll manually list them. In the future, this could be automated
  const entries: ChangelogEntry[] = [
    {
      title: 'Graph Component Refactoring Summary',
      description: 'Summary of completed Graph component refactoring work',
      status: 'completed',
      inception_date: '2025-11-17',
      execution_date: '2025-11-17',
      type: 'refactoring',
      component: 'Graph',
      priority: 'high',
      content: '',
      slug: '2025-11-17-graph-component-refactoring-summary',
    },
    {
      title: 'Graph Component Architecture Documentation',
      description: 'Documentation of the Graph component system architecture',
      status: 'completed',
      inception_date: '2025-11-17',
      execution_date: '2025-11-17',
      type: 'documentation',
      component: 'Graph',
      priority: 'medium',
      content: '',
      slug: '2025-11-17-graph-component-architecture',
    },
    {
      title: 'GraphRenderer Component Refactoring Plan',
      description: 'Comprehensive plan to refactor the 3382-line GraphRenderer.tsx into smaller, composable components and utilities',
      status: 'planned',
      inception_date: '2025-11-17',
      execution_date: 'TBD',
      type: 'refactoring',
      component: 'GraphRenderer',
      priority: 'high',
      content: '',
      slug: '2025-12-XX-graph-renderer-refactoring-plan',
    },
  ];

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

  const groupedEntries = entries.reduce((acc, entry) => {
    const status = entry.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(entry);
    return acc;
  }, {} as Record<string, ChangelogEntry[]>);

  // Sort entries within each status group by date (newest last)
  Object.keys(groupedEntries).forEach((status) => {
    groupedEntries[status].sort((a, b) => {
      // Extract date from slug (format: YYYY-MM-DD or YYYY-MM-XX)
      const slugA = a.slug || '';
      const slugB = b.slug || '';
      const dateA = slugA.length >= 10 ? slugA.substring(0, 10) : '0000-00-00';
      const dateB = slugB.length >= 10 ? slugB.substring(0, 10) : '0000-00-00';
      // Compare dates, with XX treated as 00 for sorting
      const normalizedA = String(dateA).replace('XX', '00');
      const normalizedB = String(dateB).replace('XX', '00');
      return normalizedA.localeCompare(normalizedB);
    });
  });

  const statusOrder = ['completed', 'in-progress', 'planned', 'cancelled'];

  return (
    <Layout 
      title="Changelog" 
      description="Track all changes, plans, and improvements to the blog"
      noFooter={false}
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--12">
            <h1>Changelog</h1>
            <p>
              Track all changes, plans, and improvements made to the blog. Each entry includes
              metadata about the change type, status, priority, and dates.
            </p>

            {statusOrder.map((status) => {
              const entriesForStatus = groupedEntries[status] || [];
              if (entriesForStatus.length === 0) return null;

              return (
                <div key={status} className={styles.statusSection}>
                  <h2 className={styles.statusTitle}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </h2>
                  <div className={styles.entriesGrid}>
                    {entriesForStatus.map((entry) => (
                      <div key={entry.slug} className={styles.entryCard}>
                        <div className={styles.entryHeader}>
                          <h3 className={styles.entryTitle}>
                            <Link to={`/changelog/${entry.slug}`}>{entry.title}</Link>
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
                          <span className={styles.metaItem}>
                            <strong>Inception:</strong> {entry.inception_date}
                          </span>
                          <span className={styles.metaItem}>
                            <strong>Execution:</strong>{' '}
                            {entry.execution_date === 'TBD' ? (
                              <em>TBD</em>
                            ) : (
                              entry.execution_date
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}

