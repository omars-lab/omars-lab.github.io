# Fix Broken Docusaurus Links

## Overview
This prompt provides a systematic approach to identify and fix broken links in the Docusaurus documentation site. Follow these steps to ensure all links are properly resolved and the build completes without broken link warnings.

## Step 1: Run Build and Capture Broken Links

```bash
cd /Users/omareid/Workspace/git/projects/omars-lab.github.io
make build
```

**Important**: Copy the complete "Exhaustive list of all broken links found" section from the build output. This is your working list.

## Step 2: Systematic Analysis

### A. Categorize Broken Links
Group broken links by type:

1. **Draft Files** - Files marked `draft: true` that are being linked to
2. **Slug Mismatches** - Links using filenames instead of actual slugs
3. **Path Structure Issues** - Missing subdirectory paths in links
4. **Directory vs File References** - Links pointing to directories instead of specific files
5. **Directory Renaming** - Links pointing to old directory names after reorganization
6. **Content Migration** - Links pointing to old locations after content moves
7. **Edge Cases** - Files that exist in build output but links don't resolve

### B. Verify File Existence
For each broken link, check if the target file exists in the build output:
```bash
ls -la build/docs/[path-to-file].html
```

## Step 3: Fix Broken Links by Category

### Category 1: Draft Files (Most Common)
**Problem**: Files marked `draft: true` are excluded from builds
**Solution**: Remove `draft: true` from files that are being linked to

```bash
# Find files with draft: true that are being linked to
grep -r "draft: true" docs/ --include="*.md" --include="*.mdx"
```

**Fix**: Change `draft: true` to `draft: false` in the frontmatter of linked files.

### Category 2: Slug Mismatches
**Problem**: Links use filenames instead of actual slugs defined in frontmatter
**Solution**: Update links to match actual slugs

```bash
# Check actual slugs in files
grep -r "^slug:" docs/ --include="*.md" --include="*.mdx"
```

**Common Examples**:
- `bitwise-operations` → `bitwise-ops`
- `terminal-links` → `mechanic-terminal-links`
- `scripting-mechanics` → `scripting-techniques`

### Category 3: Path Structure Issues
**Problem**: Links missing subdirectory paths
**Solution**: Add missing path segments

**Common Examples**:
- `/docs/mechanics/docusaurus-components/mx-docx-embedd-*` 
- Should be: `/docs/mechanics/docusaurus-components/embedding-components/mx-docx-embedd-*`

### Category 4: Directory vs File References
**Problem**: Links pointing to directories instead of specific files
**Solution**: Point to specific README files or main section pages

**Examples**:
- `/docs/learning/coding-challenges/problem-solving-techniques`
- Should be: `/docs/learning/coding-challenges/problem-solving-techniques/problem-solving-techniques`

### Category 5: Directory Renaming (NEW)
**Problem**: Links pointing to old directory names after reorganization
**Solution**: Update all links to use new directory names

**Common Examples**:
- `/docs/mechanics/` → `/docs/techniques/`
- `/docs/development/` → `/docs/developing/`
- `/docs/research/` → `/docs/developing/b-research/`

**Fix Process**:
1. Identify the directory rename pattern
2. Use find/replace to update all instances
3. Verify the new directory structure exists

### Category 6: Content Migration (NEW)
**Problem**: Links pointing to old locations after content moves
**Solution**: Update links to reflect new content locations

**Common Examples**:
- `/docs/learning/coding-challenges/` → `/docs/interviewing/coding-challenges/`
- `/docs/mechanics/docusaurus-components/` → `/docs/techniques/blogging-techniques/`
- `/docs/mechanics/react-components/` → `/docs/techniques/blogging-techniques/embedding-react-components/`

**Fix Process**:
1. Map old paths to new paths
2. Update links systematically
3. Verify new paths exist in build output

### Category 7: README Slug Mismatches (NEW)
**Problem**: Links use directory names instead of actual slugs defined in frontmatter
**Solution**: Check actual slugs and update links to match

**Common Examples**:
- Directory: `/docs/2-techniques/` but slug: `mechanics` → Link should be `/docs/techniques/mechanics`
- Directory: `/docs/4-developing/` but slug: `development` → Link should be `/docs/developing/development`
- Directory: `/docs/5-interviewing/` but slug: `interviewing` → Link should be `/docs/interviewing/interviewing`

**Fix Process**:
1. Check actual slugs in frontmatter: `grep -r "^slug:" docs/`
2. Verify build output paths: `find build/docs -name "*.html"`
3. Update links to match actual generated file paths
4. Test with build to confirm resolution

## Step 4: Verification Process

### A. Rebuild and Check
```bash
make build
```

### B. Verify Build Output
Check that target files exist in build output:
```bash
ls -la build/docs/[expected-path].html
```

### C. Test Link Resolution
If files exist but links still show as broken, try:
1. **Clear build cache**: `rm -rf .docusaurus/ build/`
2. **Different link formats**: Try with/without trailing slashes
3. **Check route generation**: Look at `.docusaurus/routes.js`

## Step 5: Common Fix Patterns

### Pattern 1: Remove Draft Status
```yaml
# Before
---
slug: my-page
title: My Page
draft: true
---

# After
---
slug: my-page
title: My Page
draft: false
---
```

### Pattern 2: Fix Slug References
```markdown
# Before
[My Link](/docs/section/filename)

# After (check actual slug first)
[My Link](/docs/section/actual-slug)
```

### Pattern 3: Add Missing Paths
```markdown
# Before
[Component](/docs/mechanics/docusaurus-components/mx-docx-embedd-code-cells)

# After
[Component](/docs/mechanics/docusaurus-components/embedding-components/mx-docx-embedd-code-cells)
```

### Pattern 4: Point to Specific Files
```markdown
# Before
[Section](/docs/section/subsection)

# After
[Section](/docs/section/subsection/subsection)
```

### Pattern 5: Directory Renaming (NEW)
```markdown
# Before
[Mechanics](/docs/mechanics)
[Development](/docs/development)
[Research](/docs/research)

# After
[Techniques](/docs/techniques)
[Developing](/docs/developing)
[Research](/docs/developing/b-research)
```

### Pattern 6: Content Migration (NEW)
```markdown
# Before
[Coding Challenges](/docs/learning/coding-challenges)
[React Components](/docs/mechanics/react-components)
[Embedding Components](/docs/mechanics/docusaurus-components/embedding-components)

# After
[Coding Challenges](/docs/interviewing/coding-challenges)
[React Components](/docs/techniques/blogging-techniques/embedding-react-components)
[Embedding Components](/docs/techniques/blogging-techniques/embedding-external-components)
```

### Pattern 7: README Slug Mismatches (NEW)
```markdown
# Before (using directory names)
[Techniques](/docs/techniques)
[Development](/docs/developing)
[Interviewing](/docs/interviewing)
[Research](/docs/research)

# After (using actual slugs from frontmatter)
[Techniques](/docs/techniques/mechanics)
[Development](/docs/developing/development)
[Interviewing](/docs/interviewing/interviewing)
[Research](/docs/developing/b-research/research)
```

## Step 6: Troubleshooting Edge Cases

### Files Exist But Links Don't Resolve
If files exist in build output but links still show as broken:

1. **Check URL structure**: Verify the link format matches Docusaurus expectations
2. **Clear cache**: Remove `.docusaurus/` and `build/` directories
3. **Test in development**: Run `npm run start` and test links manually
4. **Check routes**: Examine `.docusaurus/routes.js` for actual route definitions

### Persistent Issues
For links that consistently fail to resolve despite files existing:

1. **Alternative formats**: Try relative paths instead of absolute paths
2. **Configuration check**: Review `docusaurus.config.js` for routing issues
3. **Manual testing**: Test links in browser to verify they actually work
4. **Document as known issue**: If links work but Docusaurus reports them as broken

## Step 7: Prevention Strategies

### A. Consistent Naming
- Use consistent slug naming conventions
- Avoid special characters in slugs
- Keep slugs short and descriptive

### B. Draft Management
- Be intentional about which files are marked as drafts
- Regularly review draft status of linked files
- Consider using `draft: false` for files that are referenced

### C. Link Testing
- Test links in both development and production builds
- Include link checking in regular maintenance
- Document link structure changes

### D. Directory Structure Changes (NEW)
- **Before renaming directories**: Update all links first
- **Document migration paths**: Keep a mapping of old → new paths
- **Use systematic find/replace**: Update all instances at once
- **Verify after changes**: Run build to check for broken links

### E. Content Migration Planning (NEW)
- **Plan content moves**: Map out where content will move before moving it
- **Update links systematically**: Don't move content without updating links
- **Test incrementally**: Fix links in batches and test after each batch
- **Document changes**: Keep track of what was moved where

### F. README Slug Management (NEW)
- **Check actual slugs**: Always verify frontmatter slugs vs directory names
- **Match build output**: Links must point to actual generated file paths
- **Use systematic verification**: `grep` for slugs, `find` for build output
- **Test thoroughly**: Verify links work in both development and production builds

## Step 8: Success Criteria

### Complete Success
- ✅ Build completes with exit code 0
- ✅ No broken link warnings in build output
- ✅ All target files exist in build output
- ✅ Links work when tested manually

### Acceptable Results
- ✅ Build completes successfully
- ⚠️ Few edge cases remain (files exist but links don't resolve)
- ✅ 95%+ of broken links resolved

## Step 9: Documentation

### Record Changes
- Document which files had `draft: true` removed
- Record slug changes made
- Note any path structure updates
- **Document directory renames** and content migrations
- **Map old → new paths** for future reference

### Update This Prompt
- Add new patterns discovered
- Update common examples
- Refine troubleshooting steps
- **Add new categories** for directory renames and content migration
- **Update prevention strategies** with new insights

## Quick Reference Commands

```bash
# Run build and capture broken links
make build

# Find draft files
grep -r "draft: true" docs/ --include="*.md" --include="*.mdx"

# Check actual slugs
grep -r "^slug:" docs/ --include="*.md" --include="*.mdx"

# Clear build cache
rm -rf .docusaurus/ build/

# Check if files exist in build
ls -la build/docs/[path].html

# Find all instances of old directory names (for directory renames)
grep -r "/docs/mechanics/" docs/ --include="*.md" --include="*.mdx"
grep -r "/docs/development/" docs/ --include="*.md" --include="*.mdx"
grep -r "/docs/research/" docs/ --include="*.md" --include="*.mdx"

# Find all instances of old content paths (for content migration)
grep -r "/docs/learning/coding-challenges/" docs/ --include="*.md" --include="*.mdx"
grep -r "/docs/mechanics/docusaurus-components/" docs/ --include="*.md" --include="*.mdx"
grep -r "/docs/mechanics/react-components/" docs/ --include="*.md" --include="*.mdx"

# Check actual slugs in frontmatter (for README slug mismatches)
grep -r "^slug:" docs/ --include="*.md" --include="*.mdx"

# Find actual generated files in build output
find build/docs -name "*.html" | grep -E "(mechanics|development|interviewing|research)\.html$"
```

## Important Notes

- **Never remove links** - Always fix them to point to the correct location
- **Preserve content** - Only change frontmatter and link paths, not content
- **Test thoroughly** - Verify fixes work in both development and production
- **Document changes** - Keep track of what was fixed for future reference
- **Plan directory changes** - Update links before renaming directories or moving content
- **Use systematic approach** - Fix links in categories and test after each batch

## Recent Updates (2025-01-31)

### New Categories Added:
- **Directory Renaming** - Handling links after directory structure changes
- **Content Migration** - Updating links when content moves between sections
- **README Slug Mismatches** - Links using directory names instead of actual slugs

### New Patterns Identified:
- `/docs/mechanics/` → `/docs/techniques/` (directory rename)
- `/docs/development/` → `/docs/developing/` (directory rename)
- `/docs/research/` → `/docs/developing/b-research/` (content migration)
- `/docs/learning/coding-challenges/` → `/docs/interviewing/coding-challenges/` (content migration)
- `/docs/techniques` → `/docs/techniques/mechanics` (README slug mismatch)
- `/docs/developing` → `/docs/developing/development` (README slug mismatch)

### Enhanced Prevention Strategies:
- Plan content moves before executing them
- Update links systematically using find/replace
- Test incrementally after each batch of fixes
- Document migration paths for future reference
- **Always verify actual slugs vs directory names**
- **Match links to actual build output paths**

### 🎉 Complete Success Achieved (2025-01-31):
- **Zero broken links** - Build now completes with no broken link warnings
- **100% resolution rate** - All previously broken links have been fixed
- **Clean build output** - Only minor warnings about blog post truncation markers remain
- **Systematic approach validated** - The methodology in this prompt successfully resolved all issues

### Key Success Factors:
1. **Systematic categorization** - Grouping broken links by type made fixes more efficient
2. **Build output verification** - Always checking actual generated files vs expected paths
3. **Slug vs directory name distinction** - Critical insight that resolved the final batch of issues
4. **Iterative testing** - Running builds after each fix batch to confirm progress
5. **Comprehensive coverage** - Addressing all categories of broken links systematically

---

**Last Updated**: 2025-01-31
**Success Rate**: 100% broken links resolved using this approach
**Current Status**: ✅ Zero broken links - Complete success achieved
**New Categories**: Directory Renaming, Content Migration, README Slug Mismatches
**Key Discovery**: Links must match actual build output paths, not logical directory paths