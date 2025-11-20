import React from 'react';
// @ts-ignore - Docusaurus theme module
import Layout from '@theme/Layout';
import { Changelog } from '@site/src/components/Changelog';
import { getAllChangelogEntries } from '@site/src/components/Changelog/changelogUtils';

export default function ChangelogPage() {
  // Get all changelog entries from the generated data file
  // The data file is automatically generated from markdown files in the changelog directory
  const allEntries = getAllChangelogEntries();

  return (
    <Layout 
      title="Changelog" 
      description="Track all changes, plans, and improvements to the blog"
      noFooter={false}
    >
      <div className="container margin-vert--lg">
        <Changelog 
          entries={allEntries}
          getEntryUrl={(slug) => {
            // Handle subdirectory paths (e.g., "content/2025-01-15-..." or "development/2025-01-15-...")
            // The slug already includes the subdirectory path from the file location
            // Changelog files are served as pages via @docusaurus/plugin-content-pages
            return `/changelog/${slug}`;
          }}
        />
      </div>
    </Layout>
  );
}
