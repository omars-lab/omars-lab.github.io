#!/usr/bin/env node

/**
 * Generate changelog data from markdown files
 * This script scans the changelog directory and creates a JSON file with all entries
 */

const fs = require('fs');
const path = require('path');

const changelogDir = path.join(__dirname, '..', 'changelog');
const outputFile = path.join(__dirname, '..', 'src', 'components', 'Changelog', 'changelog-data.json');

/**
 * Parse frontmatter from markdown file content
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  
  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};
  
  // Parse YAML-like frontmatter (simple key: value pairs)
  frontmatterStr.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    frontmatter[key] = value;
  });
  
  return { frontmatter, body };
}

/**
 * Extract slug from filename (remove .md extension)
 */
function getSlugFromFilename(filename) {
  return filename.replace(/\.md$/, '');
}

/**
 * Recursively scan directory for markdown files
 */
function scanDirectory(dir, relativePath = '') {
  const entries = [];
  
  if (!fs.existsSync(dir)) {
    return entries;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativeItemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
    
    if (item.isDirectory()) {
      // Recursively scan subdirectories
      entries.push(...scanDirectory(fullPath, relativeItemPath));
    } else if (item.isFile() && item.name === 'CLAUDE-CHANGELOG.md') {
      // Special-cased: a single growing file of dated batches of completed Claude
      // tasks. Split it into one entry per "## YYYY-MM-DD — Title" batch rather than
      // treating the whole file as one entry. See parseClaudeChangelog().
      entries.push(...parseClaudeChangelog(fs.readFileSync(fullPath, 'utf-8')));
    } else if (item.isFile() && item.name.endsWith('.md') && item.name !== 'README.md') {
      // Process markdown file
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const { frontmatter } = parseFrontmatter(fileContent);
      
      // Determine category from directory structure
      // content/ -> 'content', development/ -> 'development', root -> 'development' (default)
      let category = 'development'; // Default for backward compatibility
      if (relativePath.includes('content')) {
        category = 'content';
      } else if (relativePath.includes('development') || relativePath.includes('infrastructure')) {
        category = 'development';
      } else if (relativePath === '') {
        // Root level - determine from type or filename prefix
        const filenamePrefix = item.name.split('-')[2] || ''; // e.g., "content-post" from "2025-XX-XX-content-post-..."
        if (filenamePrefix.startsWith('content')) {
          category = 'content';
        } else {
          category = 'development';
        }
      }
      
      // Use relative path for slug to preserve subdirectory structure
      const slug = relativeItemPath.replace(/\.md$/, '');
      
      // Extract required fields from frontmatter only
      // Content is not needed - it's available in the markdown files themselves
      const entry = {
        title: frontmatter.title || slug,
        description: frontmatter.description || '',
        status: frontmatter.status || 'planned',
        inception_date: frontmatter.inception_date || '',
        execution_date: frontmatter.execution_date || 'TBD',
        type: frontmatter.type || 'feature',
        component: frontmatter.component || undefined,
        priority: frontmatter.priority || 'medium',
        category: frontmatter.category || category, // Allow override in frontmatter
        slug: slug,
      };
      
      entries.push(entry);
    }
  }
  
  return entries;
}

/**
 * Parse CLAUDE-CHANGELOG.md into one entry per dated batch.
 *
 * Batch heading:  ## YYYY-MM-DD — Title   (em-dash or hyphen accepted)
 * Optional meta:  <!-- meta: type=feature category=development priority=high component=X -->
 * Body until the next "## " becomes the entry's description fallback isn't needed —
 * the one-line summary right after meta is used as the description.
 */
function parseClaudeChangelog(content) {
  const entries = [];
  // Drop the leading HTML comment block (format docs) if present.
  const withoutLeadingComment = content.replace(/^<!--[\s\S]*?-->\s*/, '');
  // Split on level-2 headings, keeping the heading with its section.
  const sections = withoutLeadingComment.split(/\n(?=## )/);

  for (const section of sections) {
    const headingMatch = section.match(/^##\s+(\d{4}-\d{2}-\d{2})\s*[—-]\s*(.+?)\s*$/m);
    if (!headingMatch) continue;
    const date = headingMatch[1];
    const title = headingMatch[2].trim();

    // Optional meta comment
    const meta = {};
    const metaMatch = section.match(/<!--\s*meta:\s*([^>]*?)-->/);
    if (metaMatch) {
      metaMatch[1].trim().split(/\s+/).forEach((pair) => {
        const eq = pair.indexOf('=');
        if (eq > 0) meta[pair.slice(0, eq)] = pair.slice(eq + 1);
      });
    }

    // First non-empty, non-heading, non-comment line = description.
    let description = '';
    for (const line of section.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('##') || t.startsWith('<!--') || t.startsWith('-')) continue;
      description = t;
      break;
    }

    entries.push({
      title: `Claude Tasks — ${title}`,
      description,
      status: 'completed',
      inception_date: date,
      execution_date: date,
      type: meta.type || 'chore',
      component: meta.component || 'Claude',
      priority: meta.priority || 'medium',
      category: meta.category || 'development',
      slug: `claude-tasks/${date}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    });
  }
  return entries;
}

/**
 * Scan changelog directory and extract all entries (recursively)
 */
function getAllChangelogEntries() {
  if (!fs.existsSync(changelogDir)) {
    console.warn(`Changelog directory not found: ${changelogDir}`);
    return [];
  }
  
  return scanDirectory(changelogDir);
}

// Generate and write the data file
const entries = getAllChangelogEntries();
const outputDir = path.dirname(outputFile);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(entries, null, 2), 'utf-8');
console.log(`Generated changelog data: ${entries.length} entries written to ${outputFile}`);

