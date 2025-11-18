#!/usr/bin/env node

/**
 * Script to extract git commits related to changelog entries
 * 
 * Usage:
 *   node scripts/extract-changelog-commits.js [changelog-file]
 * 
 * If no file specified, analyzes all changelog entries
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHANGELOG_DIR = path.join(__dirname, '..', 'changelog');
const REPO_ROOT = path.join(__dirname, '..', '..');

// Changelog entry patterns for matching commits
const CHANGELOG_PATTERNS = {
  'component-refactoring-graph-renderer': {
    keywords: ['graph', 'refactor', 'component', 'renderer'],
    filePatterns: ['src/components/Graph/**/*', '*.storybook/**/*'],
    dateRange: { since: '2024-11-01' }
  },
  'component-creation-graph-renderer': {
    keywords: ['graph', 'create', 'component', 'renderer'],
    filePatterns: ['src/components/Graph/**/*'],
    dateRange: { since: '2024-11-01' }
  },
  'component-refactoring-graph-component': {
    keywords: ['graph', 'refactor', 'component'],
    filePatterns: ['src/components/Graph/**/*'],
    dateRange: { since: '2024-11-01' }
  },
  'component-creation-mermaid-diagrams': {
    keywords: ['mermaid', 'diagram'],
    filePatterns: ['src/components/Mermaid/**/*', '**/*.mermaid', '**/*.mmd'],
    dateRange: { since: '2024-01-01' }
  },
  'mechanic-establishment-link-management': {
    keywords: ['link', 'management', 'mechanic'],
    filePatterns: ['docusaurus.config.js', '**/link*'],
    dateRange: { since: '2024-11-01' }
  },
  'infrastructure-improvement-testing-quality': {
    keywords: ['test', 'testing', 'quality', 'e2e', 'integration'],
    filePatterns: ['test/**/*', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
    dateRange: { since: '2024-11-01' }
  },
  'structure-techniques': {
    keywords: ['technique', 'structure', 'blog structure'],
    filePatterns: ['docs/**/*', 'docusaurus.config.js'],
    dateRange: { since: '2024-11-01' }
  },
  'structure-habits': {
    keywords: ['habit', 'structure'],
    filePatterns: ['docs/**/*'],
    dateRange: { since: '2024-11-01' }
  },
  'structure-changelog-roadmap': {
    keywords: ['changelog', 'roadmap'],
    filePatterns: ['changelog/**/*', 'src/components/Changelog/**/*'],
    dateRange: { since: '2024-11-01' }
  }
};

/**
 * Get git commits matching patterns
 */
function getMatchingCommits(pattern, dateRange = {}) {
  const { keywords = [], filePatterns = [], since } = pattern;
  const sinceDate = dateRange.since || since || '2024-01-01';
  
  const commits = new Set();
  
  // Search by keywords in commit messages
  for (const keyword of keywords) {
    try {
      const cmd = `git log --all --pretty=format:"%H|%ai|%s|%b" --since="${sinceDate}" --grep="${keyword}" -i`;
      const output = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf-8' });
      output.split('\n').forEach(line => {
        if (line.trim()) commits.add(line);
      });
    } catch (e) {
      // No matches found
    }
  }
  
  // Search by file patterns
  for (const filePattern of filePatterns) {
    try {
      // Convert glob pattern to git path pattern
      const gitPattern = filePattern.replace(/\*\*/g, '*');
      const cmd = `git log --all --pretty=format:"%H|%ai|%s|%b" --since="${sinceDate}" -- "${gitPattern}"`;
      const output = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf-8' });
      output.split('\n').forEach(line => {
        if (line.trim()) commits.add(line);
      });
    } catch (e) {
      // No matches found
    }
  }
  
  return Array.from(commits)
    .map(line => {
      const [hash, date, subject, ...bodyParts] = line.split('|');
      return {
        hash: hash?.trim(),
        date: date?.trim(),
        subject: subject?.trim(),
        body: bodyParts?.join('|')?.trim() || ''
      };
    })
    .filter(c => c.hash && c.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Parse changelog file to extract current dates
 */
function parseChangelogFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) return null;
  
  const frontmatter = frontmatterMatch[1];
  const inceptionMatch = frontmatter.match(/inception_date:\s*['"]([^'"]+)['"]/);
  const executionMatch = frontmatter.match(/execution_date:\s*['"]([^'"]+)['"]/);
  const statusMatch = frontmatter.match(/status:\s*['"]([^'"]+)['"]/);
  
  return {
    inception_date: inceptionMatch?.[1] || null,
    execution_date: executionMatch?.[1] || null,
    status: statusMatch?.[1] || null
  };
}

/**
 * Find pattern for changelog file
 */
function findPatternForFile(filename) {
  // Extract key from filename (e.g., "component-refactoring-graph-renderer")
  const key = filename
    .replace(/^\d{4}-[\dX]{2}-[\dX]{2}-/, '')
    .replace(/\.md$/, '');
  
  return CHANGELOG_PATTERNS[key] || null;
}

/**
 * Analyze a single changelog file
 */
function analyzeChangelogFile(filename) {
  const filePath = path.join(CHANGELOG_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }
  
  const pattern = findPatternForFile(filename);
  const currentDates = parseChangelogFile(filePath);
  
  if (!pattern) {
    console.warn(`No pattern found for: ${filename}`);
    return {
      filename,
      pattern: null,
      currentDates,
      commits: []
    };
  }
  
  const commits = getMatchingCommits(pattern, pattern.dateRange);
  
  // Find earliest and latest dates
  const dates = commits.map(c => c.date.split(' ')[0]).filter(Boolean);
  const earliestDate = dates.length > 0 ? dates[0] : null;
  const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;
  
  return {
    filename,
    pattern,
    currentDates,
    commits,
    suggestedDates: {
      inception_date: earliestDate || currentDates?.inception_date,
      execution_date: latestDate || currentDates?.execution_date
    }
  };
}

/**
 * Main function
 */
function main() {
  const targetFile = process.argv[2];
  
  if (targetFile) {
    // Analyze single file
    const result = analyzeChangelogFile(targetFile);
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    }
  } else {
    // Analyze all changelog files
    const files = fs.readdirSync(CHANGELOG_DIR)
      .filter(f => f.endsWith('.md') && f !== 'README.md' && f !== 'SYNC_WITH_GIT_PLAN.md');
    
    console.log(`Analyzing ${files.length} changelog files...\n`);
    
    const results = files.map(filename => analyzeChangelogFile(filename));
    
    // Print summary
    results.forEach(result => {
      if (!result) return;
      
      console.log(`\n${result.filename}:`);
      console.log(`  Current inception_date: ${result.currentDates?.inception_date || 'N/A'}`);
      console.log(`  Current execution_date: ${result.currentDates?.execution_date || 'N/A'}`);
      console.log(`  Current status: ${result.currentDates?.status || 'N/A'}`);
      console.log(`  Found commits: ${result.commits.length}`);
      
      if (result.commits.length > 0) {
        console.log(`  Suggested inception_date: ${result.suggestedDates.inception_date}`);
        console.log(`  Suggested execution_date: ${result.suggestedDates.execution_date}`);
        console.log(`  Earliest commit: ${result.commits[0]?.date} - ${result.commits[0]?.subject}`);
        console.log(`  Latest commit: ${result.commits[result.commits.length - 1]?.date} - ${result.commits[result.commits.length - 1]?.subject}`);
      }
    });
    
    // Print detailed commit list for files with matches
    console.log('\n\n=== DETAILED COMMIT ANALYSIS ===\n');
    results.forEach(result => {
      if (!result || result.commits.length === 0) return;
      
      console.log(`\n${result.filename} (${result.commits.length} commits):`);
      result.commits.forEach(commit => {
        console.log(`  ${commit.date.split(' ')[0]} ${commit.hash.substring(0, 8)} - ${commit.subject}`);
      });
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeChangelogFile, getMatchingCommits };

