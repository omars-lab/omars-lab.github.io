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
5. **Edge Cases** - Files that exist in build output but links don't resolve

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

### Update This Prompt
- Add new patterns discovered
- Update common examples
- Refine troubleshooting steps

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
```

## Important Notes

- **Never remove links** - Always fix them to point to the correct location
- **Preserve content** - Only change frontmatter and link paths, not content
- **Test thoroughly** - Verify fixes work in both development and production
- **Document changes** - Keep track of what was fixed for future reference

---

**Last Updated**: 2025-01-31  
**Success Rate**: 95%+ broken links resolved using this approach