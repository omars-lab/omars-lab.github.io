#!/usr/bin/env node

/**
 * Generate ideas data from markdown files.
 * Mirrors scripts/generate-changelog-data.js: scans the `ideas/` directory and
 * writes a JSON file consumed by the /vote page. One .md per idea.
 */

const fs = require('fs');
const path = require('path');

const ideasDir = path.join(__dirname, '..', 'ideas');
const outputFile = path.join(__dirname, '..', 'src', 'components', 'Vote', 'ideas-data.json');

/**
 * Parse frontmatter from markdown file content (simple key: value pairs).
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

  frontmatterStr.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return;

    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  });

  return { frontmatter, body };
}

/**
 * Scan the ideas directory for markdown files and build entries.
 */
function getAllIdeas() {
  if (!fs.existsSync(ideasDir)) {
    console.warn(`Ideas directory not found: ${ideasDir}`);
    return [];
  }

  const entries = [];
  const items = fs.readdirSync(ideasDir, { withFileTypes: true });

  for (const item of items) {
    if (!item.isFile() || !item.name.endsWith('.md') || item.name === 'README.md') {
      continue;
    }

    const fileContent = fs.readFileSync(path.join(ideasDir, item.name), 'utf-8');
    const { frontmatter } = parseFrontmatter(fileContent);
    const fileSlug = item.name.replace(/\.md$/, '');

    // Prefer an explicit frontmatter `slug` (clean, e.g. ai-taught-me-how-to-
    // manage); fall back to the date-prefixed filename. The slug is the STABLE
    // identity used to key votes (localStorage + PostHog), so it must not change.
    const slug = frontmatter.slug || fileSlug;

    entries.push({
      slug,
      title: frontmatter.title || slug,
      description: frontmatter.description || '',
      type: frontmatter.type || 'post',
      status: frontmatter.status || 'idea',
      date: frontmatter.date || '',
    });
  }

  // Newest first, matching the changelog convention.
  entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return entries;
}

const entries = getAllIdeas();
const outputDir = path.dirname(outputFile);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(entries, null, 2), 'utf-8');
console.log(`Generated ideas data: ${entries.length} entries written to ${outputFile}`);
