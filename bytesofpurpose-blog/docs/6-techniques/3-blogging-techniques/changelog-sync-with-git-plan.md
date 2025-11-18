# Plan: Sync Changelog Entries with Git Commit History

## Overview

This plan outlines the process for updating changelog entries with dates, activities, and execution updates based on git commit history. This will ensure changelog entries accurately reflect when work was actually done and what was accomplished.

## Goals

1. **Update inception dates**: Use the earliest relevant commit date for each changelog entry
2. **Update execution dates**: Use the latest relevant commit date for completed work
3. **Add execution details**: Extract activities and accomplishments from commit messages
4. **Maintain accuracy**: Ensure changelog entries reflect actual work timeline

## Process Overview

### Phase 1: Preparation

#### 1.1 Identify Changelog Entries
- List all changelog files in `changelog/` directory
- For each entry, identify:
  - Component/feature/mechanic being worked on
  - Keywords that might appear in commit messages
  - Current inception_date and execution_date

#### 1.2 Create Mapping Strategy
- Map changelog entries to git commit patterns:
  - **Component entries**: Look for commits touching component files
  - **Mechanic entries**: Look for commits related to blog mechanisms
  - **Infrastructure entries**: Look for build/config/deployment commits
  - **Structure entries**: Look for commits changing blog structure/navigation
  - **Plan entries**: Look for planning/design commits

#### 1.3 Define Commit Search Patterns

**Component-related commits:**
- File patterns: `src/components/**/*`, `*.tsx`, `*.ts`
- Keywords: component name, "component", "refactor", "create", "enhance"

**Mechanic-related commits:**
- File patterns: `docusaurus.config.js`, `src/pages/**/*`, blog structure files
- Keywords: mechanic name, "mechanism", "workflow", "process"

**Infrastructure-related commits:**
- File patterns: `package.json`, `Makefile`, `*.config.js`, CI/CD files
- Keywords: "infrastructure", "build", "deploy", "ci", "cdk"

**Structure-related commits:**
- File patterns: `docs/**/*`, navigation configs, sidebar configs
- Keywords: "structure", "navigation", "organization", "hierarchy"

**Documentation-related commits:**
- File patterns: `*.md`, `docs/**/*`, `README.md`
- Keywords: "documentation", "docs", "readme", "guide"

## Phase 2: Git History Analysis

### 2.1 Extract Commit History

```bash
# Get all commits with dates and messages
git log --all --pretty=format:"%H|%ai|%s|%b" --since="2024-01-01" > commits.txt

# Or for specific date range
git log --all --pretty=format:"%H|%ai|%s|%b" --since="2024-11-01" --until="2025-01-31" > commits.txt
```

### 2.2 Analyze Commits by File Changes

```bash
# For each changelog entry, find related commits
# Example: Graph component refactoring
git log --all --oneline --since="2024-11-01" -- "src/components/Graph/**/*"
git log --all --oneline --since="2024-11-01" -- "*.storybook/**/*"
git log --all --oneline --since="2024-11-01" --grep="graph" -i
```

### 2.3 Extract Key Information

For each commit, extract:
- **Date**: Commit date (author date or commit date)
- **Message**: Commit subject and body
- **Files changed**: List of files modified
- **Type**: Type of change (feat, fix, refactor, docs, etc.)

## Phase 3: Matching Commits to Changelog Entries

### 3.1 Matching Strategies

#### Strategy A: File-based Matching
- Match commits that modify files related to the changelog entry
- Example: Graph component refactoring → commits touching `src/components/Graph/**/*`

#### Strategy B: Keyword-based Matching
- Match commits with keywords in commit message
- Example: "mermaid" → `2025-XX-XX-component-creation-mermaid-diagrams.md`
- Example: "graph refactor" → `2025-XX-XX-component-refactoring-graph-renderer.md`

#### Strategy C: Date-based Matching
- Match commits within a date range related to the entry
- Use current inception_date as starting point
- Look backwards for earlier related commits

### 3.2 Priority Order

1. **Exact file matches** (highest priority)
2. **Keyword matches in commit message**
3. **Related file matches** (files in same directory/module)
4. **Date proximity** (commits near inception_date)

### 3.3 Handling Multiple Matches

- If multiple commits match, use:
  - **Earliest commit date** for inception_date
  - **Latest commit date** for execution_date (if completed)
  - **All commit messages** for execution details

## Phase 4: Updating Changelog Entries

### 4.1 Update Frontmatter

#### Update inception_date
- Use earliest relevant commit date
- Format: `YYYY-MM-DD`
- If only month known: `YYYY-MM-XX`
- If unknown: keep `YYYY-XX-XX`

#### Update execution_date
- For completed entries: use latest relevant commit date
- For in-progress entries: use latest relevant commit date
- For planned entries: keep `TBD`

#### Update status
- If commits found after execution_date: `in-progress`
- If no commits found: `planned`
- If commits completed: `completed`

### 4.2 Update Execution Results Section

Add commit-based execution details:

```markdown
## Execution Results / Attempts

### ✅ Work Completed (2025-11-10 to 2025-11-17)

**Commits:**
- `abc123` (2025-11-10): Initial refactoring setup
  - Created utility files (GraphDataUtils, GraphNodeUtils, etc.)
  - Set up component structure
- `def456` (2025-11-13): Component extraction
  - Extracted GraphMenuBar component
  - Extracted GraphInfoPanel component
- `ghi789` (2025-11-17): Storybook integration
  - Added Storybook stories for all components
  - Documented component architecture

**Files Changed:**
- `src/components/Graph/GraphMenuBar.tsx` (created)
- `src/components/Graph/GraphInfoPanel.tsx` (created)
- `.storybook/main.ts` (updated)
- `src/components/Graph/GraphMenuBar.stories.tsx` (created)

**Summary:**
Successfully refactored Graph component from single 3200+ line file into modular architecture with focused components, hooks, and utilities.
```

### 4.3 Format for Execution Updates

**Template:**
```markdown
### Status: {status}

**Work Period:** {earliest_date} to {latest_date}

**Commits:** {count} commits

**Key Accomplishments:**
- {achievement 1}
- {achievement 2}
- {achievement 3}

**Files Created:**
- {file1}
- {file2}

**Files Modified:**
- {file1}
- {file2}

**Notable Changes:**
{summary of changes}
```

## Phase 5: Implementation Steps

### Step 1: Script Created ✅

Script `scripts/extract-changelog-commits.js` has been created to extract commits related to changelog entries.

**Usage:**
```bash
# From bytesofpurpose-blog directory
cd bytesofpurpose-blog

# Analyze all changelog files
node scripts/extract-changelog-commits.js

# Analyze specific file
node scripts/extract-changelog-commits.js 2025-XX-XX-component-refactoring-graph-renderer.md
```

**Features:**
- Matches commits by keywords in commit messages
- Matches commits by file patterns
- Suggests updated inception_date and execution_date
- Lists all matching commits with dates and subjects

**Note:** The script may include false positives. Manual review is required to filter out unrelated commits.

### Step 1.1: Refine Patterns (In Progress)

The script uses patterns defined in `CHANGELOG_PATTERNS`. These patterns need refinement to reduce false positives:

```javascript
// Pseudo-code structure
const changelogEntries = [
  {
    file: '2025-XX-XX-component-refactoring-graph-renderer.md',
    keywords: ['graph', 'refactor', 'component'],
    filePatterns: ['src/components/Graph/**/*'],
    currentInceptionDate: '2025-11-10'
  },
  // ... more entries
];

for (const entry of changelogEntries) {
  const commits = findMatchingCommits(entry);
  updateChangelogEntry(entry.file, commits);
}
```

### Step 2: Manual Review Process

1. **Run script** to extract commits for each changelog entry
   ```bash
   cd bytesofpurpose-blog
   node scripts/extract-changelog-commits.js
   ```

2. **Review matches** to ensure accuracy
   - Filter out false positives (e.g., "Refactored interviewing" is not graph-related)
   - Verify commits actually relate to the changelog entry
   - Check file changes: `git show <commit-hash> --stat`

3. **Manually verify** that commits are actually related
   - Read commit messages carefully
   - Check files changed in each commit
   - Verify dates make sense in context

4. **Update changelog entries** with verified information
   - Update frontmatter dates
   - Add execution details to Execution Results section
   - Update status if work is completed

5. **Regenerate changelog data**: `node scripts/generate-changelog-data.js`

### Step 3: Update Changelog Entries

For each changelog entry:

1. **Read current entry**
2. **Identify matching commits** (using script + manual review)
3. **Extract dates** (earliest and latest)
4. **Extract activities** from commit messages
5. **Update frontmatter** (inception_date, execution_date, status)
6. **Update Execution Results section** with commit details
7. **Save file**

### Step 4: Verification

1. **Check date consistency**: Ensure dates make sense
2. **Verify status**: Update status based on commit activity
3. **Review execution details**: Ensure they accurately reflect work done
4. **Test changelog generation**: Ensure no errors

## Phase 6: Automation Opportunities

### 6.1 Automated Script

Create a script that:
- Reads all changelog files
- Matches commits to entries
- Suggests updates (with manual approval)
- Updates files automatically (with backup)

### 6.2 Git Hooks

Consider adding git hooks to:
- Suggest updating changelog when committing related files
- Remind to update execution_date when work completes

### 6.3 CI/CD Integration

- Run script in CI to detect stale changelog entries
- Flag entries that haven't been updated despite commits

## Phase 7: Specific Changelog Entries to Update

### High Priority (Most Activity Expected)

1. **`2025-XX-XX-component-refactoring-graph-renderer.md`** ✅ Script Ready
   - Current inception_date: `2025-11-10`
   - Search: `src/components/Graph/**/*`, `*.storybook/**/*`
   - Keywords: "graph", "refactor", "component", "renderer"
   - Expected dates: 2025-11-08 onwards (based on git log)
   - **Known commits from git log:**
     - `2025-11-08`: "Adding menu bar to graph component"
     - `2025-11-08`: "Making graph component reactive"
     - `2025-11-08`: "Updating authors and adding graph component"
     - `2025-11-10`: "Checkpointing graph renderer"
     - `2025-11-10`: "Adding integ and e2e tests for graph component"
     - `2025-11-12`: "Big blog structure overhaul + finalizaiton of graph component"
     - `2025-11-16`: "Revamping graph component, modularizing it, etc. Also added storybook tab"
     - `2025-11-17`: "Revamp component setup, story book stories, graph render on mobile, etc"
   - **Action**: Update inception_date to `2025-11-08` (earliest graph-related commit)
   - **Action**: Update execution_date to `2025-11-17` (latest graph-related commit)
   - **Action**: Update status to `in-progress` or `completed` based on current state

2. **`2025-11-13-component-creation-graph-renderer.md`**
   - Search: `src/components/Graph/**/*`
   - Keywords: "graph", "create", "component"
   - Expected dates: 2025-11-13

3. **`2025-11-17-component-refactoring-graph-component.md`**
   - Search: `src/components/Graph/**/*`
   - Keywords: "graph", "refactor"
   - Expected dates: 2025-11-17

4. **`2025-XX-XX-component-creation-mermaid-diagrams.md`**
   - Search: `src/components/Mermaid/**/*`, `*.mermaid`, `*.mmd`
   - Keywords: "mermaid", "diagram"
   - Expected dates: Check for any mermaid-related commits

5. **`2025-XX-XX-mechanic-establishment-link-management.md`**
   - Search: `docusaurus.config.js`, link-related files
   - Keywords: "link", "management", "mechanic"
   - Note: Has `@done(2025-11-17 09:35 AM)` - verify this date

### Medium Priority

6. **`2025-XX-XX-infrastructure-improvement-*.md`** (all infrastructure entries)
   - Search: `package.json`, `Makefile`, `*.config.js`, CI/CD files
   - Keywords: infrastructure type (testing, performance, etc.)

7. **`2025-XX-XX-structure-*.md`** (all structure entries)
   - Search: `docs/**/*`, navigation configs
   - Keywords: structure type (techniques, habits, etc.)

### Lower Priority (Planned/Not Started)

8. **`2025-XX-XX-content-post-*.md`** (content entries)
   - May have fewer commits (mostly planning)
   - Search: `blog/**/*`, `docs/**/*`

9. **`2025-XX-XX-plan-*.md`** (plan entries)
   - Mostly planning documents
   - May have few or no commits

## Phase 8: Execution Checklist

### Preparation
- [ ] Create `scripts/extract-changelog-commits.js`
- [ ] Define commit search patterns for each entry type
- [ ] Create mapping between changelog entries and git patterns
- [ ] Set up date range for commit search (e.g., since 2024-11-01)

### Analysis
- [ ] Extract all commits in date range
- [ ] For each changelog entry, find matching commits
- [ ] Review matches for accuracy
- [ ] Identify earliest and latest commit dates

### Updates
- [ ] Update inception_date for entries with earlier commits found
- [ ] Update execution_date for completed/in-progress entries
- [ ] Update status based on commit activity
- [ ] Add execution details to Execution Results sections
- [ ] Format commit information consistently

### Verification
- [ ] Review all updated entries for accuracy
- [ ] Ensure dates are consistent and logical
- [ ] Verify execution details reflect actual work
- [ ] Regenerate changelog data
- [ ] Test changelog page displays correctly

## Phase 9: Maintenance

### Ongoing Process

1. **After each significant commit:**
   - Check if changelog entry needs updating
   - Update execution_date if work completed
   - Add commit details to Execution Results

2. **Weekly review:**
   - Check for stale entries (planned but no commits)
   - Update in-progress entries with latest commits
   - Mark completed entries as completed

3. **Monthly review:**
   - Run full sync process
   - Verify all entries are up-to-date
   - Archive or update old entries

## Notes

- **Be conservative**: Only update dates/status if commits clearly relate to the changelog entry
- **Manual review**: Always review automated matches before updating
- **Preserve history**: Keep original inception_date if unsure
- **Document decisions**: Note why dates were changed in commit messages
- **Backup first**: Create backup of changelog directory before bulk updates

## Tools Needed

1. **Git commands**: `git log`, `git show`, `git diff`
2. **Script**: Node.js script to parse commits and update changelog files
3. **Parser**: Markdown parser to update frontmatter and content
4. **Validation**: Script to validate updated changelog entries

## Success Criteria

- All changelog entries have accurate inception dates
- Completed entries have accurate execution dates
- Execution Results sections contain relevant commit details
- Changelog accurately reflects git history
- No broken changelog entries after updates

