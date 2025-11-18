import React, { useState, useMemo } from 'react';
// @ts-ignore - Docusaurus theme module
import Layout from '@theme/Layout';
import { Changelog } from '@site/src/components/Changelog';
import { getAllChangelogEntries } from '@site/src/components/Changelog/changelogUtils';

export default function ChangelogPage() {
  // Get all changelog entries from the generated data file
  // The data file is automatically generated from markdown files in the changelog directory
  const allEntries = getAllChangelogEntries();
  
  // Filter by category (content vs development)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'content' | 'development'>('all');
  
  const entries = useMemo(() => {
    if (selectedCategory === 'all') {
      return allEntries;
    }
    return allEntries.filter(entry => entry.category === selectedCategory);
  }, [allEntries, selectedCategory]);

  return (
    <Layout 
      title="Changelog" 
      description="Track all changes, plans, and improvements to the blog"
      noFooter={false}
    >
      <div className="container margin-vert--lg">
        {/* Category Filter */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label htmlFor="category-filter" style={{ fontWeight: 'bold' }}>Filter by:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as 'all' | 'content' | 'development')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: '1px solid var(--ifm-color-emphasis-300)',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Changes</option>
            <option value="content">Content (Posts, Docs)</option>
            <option value="development">Development (Components, Infrastructure)</option>
          </select>
        </div>
        
        <Changelog 
          entries={entries}
          getEntryUrl={(slug) => {
            // Handle subdirectory paths (e.g., "content/2025-01-15-..." or "development/2025-01-15-...")
            // The slug already includes the subdirectory path from the file location
            return `/changelog/${slug}`;
          }}
        />
      </div>
    </Layout>
  );
}
