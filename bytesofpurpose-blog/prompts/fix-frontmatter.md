# Fix Frontmatter

## Overview
Your job is to ensure each of the blog and documentation files have the appropriate front matter. This prompt provides a systematic approach to identify and fix all files missing frontmatter sections across the entire repository.

**IMPORTANT**: This prompt covers ALL markdown files in the repository, not just docs. Use the comprehensive detection commands to find every file that needs frontmatter.

## Step 1: Identify Files Missing Frontmatter

### A. Find All Files Missing Frontmatter
Use this command to systematically identify all files that need frontmatter:

```bash
cd /Users/omareid/Workspace/git/projects/omars-lab.github.io
find bytesofpurpose-blog -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Missing frontmatter: $file"; 
  fi; 
done
```

**CRITICAL**: This command searches the ENTIRE repository. Ignore node_modules files in the output - focus only on content files in:
- `bytesofpurpose-blog/blog/`
- `bytesofpurpose-blog/docs/`
- `bytesofpurpose-blog/designs/`
- `bytesofpurpose-blog/src/`
- `bytesofpurpose-blog/prompts/`

### B. Categorize Files by Directory
Group the missing frontmatter files by directory for systematic processing:

```bash
# Blog files
find bytesofpurpose-blog/blog -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Blog: $file"; 
  fi; 
done

# Docs files
find bytesofpurpose-blog/docs -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Docs: $file"; 
  fi; 
done

# Designs files
find bytesofpurpose-blog/designs -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Designs: $file"; 
  fi; 
done

# Source files (partials, components)
find bytesofpurpose-blog/src -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Source: $file"; 
  fi; 
done

# Prompt files
find bytesofpurpose-blog/prompts -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Prompts: $file"; 
  fi; 
done
```

### C. Count Missing Files
Get a count of how many files need frontmatter:

```bash
find bytesofpurpose-blog -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "$file"; 
  fi; 
done | wc -l
```

## Step 2: Blog Front Matter

Find the `.md/.mdx` files in `bytesofpurpose-blog/blog`. Ensure each of the files starts with a frontmatter section similar to the following:

---
slug: '<unique-id-short-code>'
title: '<Frontend Title>'
description: '<1 sentance description>'
authors: [oeid]
tags: [...]
date: '<date>'
---

### Frontmatter Attributes

* `slug` should be a unique id that no other blog posts share. Note that the slug will be part of the URL and should be sensible.
* `title` should be the primary title we show at the begining of the blog post
* for the `description`, attempt to identify the core question that the blog post addresses and use it as the description. If its simpler to summarize without describing in a question format, then use the simple description.
* Do not attempt to edit the content of the blog post itself. If the content is rough, feel free to add a `draft: true` attribute to the front matter.
* For learning topics and project notes in `/docs`, default to `draft: true` unless the content is publication-ready
* For blog posts in `/blog`, default to `draft: false` unless content needs significant work
* If you do mark a post as a draft when crafting the front matter, ensure there is a section at the bottom of the blog post summarizing the enhancements that should be made to the post prior to publishing it / removing it from draft mode. Ensure the suggestions are structured as markdown todos: `- [ ]` with the date of the suggestion appended to the end of each todo, example: `>2025-01-01`
* `tags` should be a list of seo friendly terms explorers can use to find this blog post when using search engines. Example: `[development, process, workflow, ideation, roadmap]`
* `date` should be the date in which this blog post is concieved. If there are todos in this blog post with dates, attempt to use the earliest date within the post as the conception date. The date should be in the following format: `2022-04-19T10:00` where the date and time without seconds are kept. If there are no dates present, use the time now as the date in the format specified.

## Docs Front Matter

Follow the same instructions as the Blog Front Matter, but instead of looking in `bytesofpurpose-blog/blog`, look in `bytesofpurpose-blog/docs`.

## Step 3: Systematic Processing Approach

### A. Create Processing Plan
Before starting, create a todo list to track progress:

```bash
# Get complete list of files needing frontmatter
find bytesofpurpose-blog -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Missing frontmatter: $file"; 
  fi; 
done > missing_frontmatter_files.txt

# Count total files
echo "Total files needing frontmatter: $(wc -l < missing_frontmatter_files.txt)"
```

### B. Processing Order (Systematic)
1. **Process `/blog` files first** (these are publication-ready)
2. **Process `/designs` files** (design documentation)
3. **Process `/docs` files with existing proper frontmatter** (add missing `date`)
4. **Process `/docs` files with non-conforming frontmatter**
5. **Process `/docs` files with no frontmatter** (group by directory for efficiency)
6. **Process `/src` files** (partials, components)
7. **Process `/prompts` files** (documentation and guides)

### C. Directory-by-Directory Processing
For `/docs` files, process systematically by directory:

```bash
# Process each docs subdirectory
for dir in bytesofpurpose-blog/docs/*/; do
  echo "Processing directory: $dir"
  find "$dir" -name "*.md" -o -name "*.mdx" | while read file; do 
    if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
      echo "  Missing frontmatter: $file"; 
    fi; 
  done
done
```

### D. Verification After Each Batch
After processing each directory or batch of files:

```bash
# Verify no files were missed
find bytesofpurpose-blog -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Still missing frontmatter: $file"; 
  fi; 
done

# Test build
make build
```

## Non Conforming Front Matter

* Note, some files may have been important from another system with the intent to turn them into a blog post. So they might have a front matter section, but it might not be in the proper format. 

Example: ```
---
id: learning-about-linear-algebra
type: idea
yields: 
	- software
	- notebook
---
```

Another example:
```
---
epic: https://sacred-patterns.atlassian.net/browse/THREAD-27
summary: 'Learning/Learn: OAuth'
task: https://sacred-patterns.atlassian.net/browse/THREAD-30
xcallback: vscode://file/Users/omareid/Workspace/git/blueprints/initiatives/learning-oauth.md:1
---
```

Complex example with multiple sections:
```
---
category: tool
content:
  md5: 85990bc1b5f834db960f1203323bbcb6
glue: https://glue/blueprints/#id.tool.mdcat
jira:
  epic: https://sacred-patterns.atlassian.net/browse/THREAD-36
  task: https://sacred-patterns.atlassian.net/browse/THREAD-44
priorities:
  - I need to cat markdowns with links
summary: Catting Markdown Links
tag: '#id.tool.mdcat'
trello:
  card: https://trello.com/c/q1PtRO1N
  done: false
  id: 63c8c885f92ad70404a558ce
  list: 63c43d5498733701c29d3a12
---
```

* See if you can repurpose as much of this front matter as possible:
    * `id` → `slug` (clean up formatting)
    * `summary` → `title` 
    * `yields` → additional `tags`
    * `category` → additional `tags`
    * `content` → extract `description` from content
    * `priorities` → move to "Priorities" section in content
    * Extract dates from `jira`, `trello`, or content for `date`
    * Remove all non-standard attributes (jira, trello, glue, content, etc.)
    * If there are multiple non-conforming frontmatter sections, consolidate them into a single proper frontmatter

## Step 4: Common Frontmatter Patterns

### A. Blog Files (Publication Ready)
```yaml
---
slug: 'unique-blog-slug'
title: 'Blog Post Title'
description: 'One sentence description of the blog post content'
authors: [oeid]
tags: [blog, topic1, topic2, topic3]
date: '2025-01-31T10:00'
draft: false
---
```

### B. Documentation Files (Work in Progress)
```yaml
---
slug: 'documentation-slug'
title: 'Documentation Title'
description: 'Description of the documentation content'
authors: [oeid]
tags: [documentation, topic1, topic2]
date: '2025-01-31T10:00'
draft: true
---
```

### C. Design Files
```yaml
---
slug: 'design-slug'
title: 'Design Title'
description: 'Description of the design document'
authors: [oeid]
tags: [design, architecture, planning]
date: '2025-01-31T10:00'
draft: false
---
```

### D. Source Files (Partials, Components)
```yaml
---
slug: 'source-slug'
title: 'Source Component Title'
description: 'Description of the source component or partial'
authors: [oeid]
tags: [source, component, partial]
date: '2025-01-31T10:00'
draft: true
---
```

### E. Prompt Files (Documentation, Guides)
```yaml
---
slug: 'prompt-slug'
title: 'Prompt Title'
description: 'Description of the prompt or guide'
authors: [oeid]
tags: [prompt, guide, documentation]
date: '2025-01-31T10:00'
draft: true
---
```

## Step 5: Success Criteria

### Complete Success
- ✅ All `.md` and `.mdx` files have frontmatter sections
- ✅ All frontmatter follows the standard format
- ✅ All files have appropriate `draft` status
- ✅ Build completes successfully
- ✅ No broken links or compilation errors

### Verification Commands
```bash
# Final verification - should return 0 files
find bytesofpurpose-blog -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Still missing frontmatter: $file"; 
  fi; 
done

# Test build
make build
```

## Important!
* **Don't delete any files!**
* **Don't remove any content** that is outside the starting frontmatter section!
* **Don't create any new documents** / edit existing markdown files!
* **Edit files one at a time!**
* **Use systematic approach** - process by directory to avoid missing files
* **Verify after each batch** - run build tests to ensure no errors
* **Track progress** - use todo lists to monitor completion

## File Type Considerations

### Files to Ignore
- **Node modules**: Ignore all files in `node_modules/` directories
- **Build artifacts**: Ignore files in `build/` directories
- **Generated files**: Ignore auto-generated documentation

### Files to Process
- **Content files**: All `.md` and `.mdx` files in content directories
- **Source files**: Component files in `src/` directory
- **Prompt files**: Documentation and guide files in `prompts/` directory

### Edge Cases
- **Empty files**: Add basic frontmatter even for minimal content
- **Very short files**: Extract title from filename if content is minimal
- **Files with only links**: Create descriptive titles and tags based on link content
- **Planning files**: Use `draft: true` for all planning and work-in-progress content

## Recent Experience & Lessons Learned (2025-01-31)

### 🎉 COMPLETE SUCCESS: All 47 Missing Frontmatter Files Fixed
Using the systematic approach above, we successfully identified and fixed ALL 47 files missing frontmatter:

#### Files Found and Fixed by Directory:
- **`8-habits/still-importing/`**: 22 files (Planning_To_* files) ✅
- **`9-definitions/`**: 4 files (terminology-* files) ✅
- **`2-techniques/`**: 5 files (analysis, scripting, security, organization, documentation techniques) ✅
- **`4-developing/`**: 13 files (roadmaps, initiatives, projects, experiments) ✅
- **`6-workspace/`**: 1 file (automation) ✅
- **`3-learning/`**: 1 file (frontend topics) ✅
- **`8-habits/`**: 1 file (habits-ideation) ✅

#### Key Discoveries:
1. **Systematic Detection Works**: The `find` command with `head -n 10` and `grep -q "^---$"` reliably identifies files missing frontmatter
2. **Directory Grouping is Efficient**: Processing files by directory prevents missing any files
3. **Draft Status Decisions**: Most `/docs` files should be `draft: true` since they contain work-in-progress content
4. **Date Extraction**: Look for dates in content (e.g., `>2022-04-19`) before using current date
5. **Tag Generation**: Create relevant, SEO-friendly tags based on content analysis
6. **Comprehensive Coverage**: The detection command finds ALL files across the entire repository

#### Common Patterns Applied:
- **Blog files**: `draft: false` (publication-ready)
- **Documentation files**: `draft: true` (work-in-progress)
- **Design files**: `draft: false` (design documentation)
- **Terminology files**: `draft: true` (definitions in progress)
- **Technique files**: `draft: true` (implementation notes)
- **Source files**: `draft: true` (components and partials)
- **Prompt files**: `draft: true` (documentation and guides)

### Build Verification Success:
- ✅ All added frontmatter follows proper YAML syntax
- ✅ Build completes successfully with no errors
- ✅ No broken links introduced
- ✅ All files now properly recognized by Docusaurus
- ✅ Zero files missing frontmatter in docs directory

### Final Verification Commands:
```bash
# Verify all docs files have frontmatter (should return empty)
find bytesofpurpose-blog/docs -name "*.md" -o -name "*.mdx" | while read file; do 
  if [ -f "$file" ] && ! head -n 10 "$file" | grep -q "^---$"; then 
    echo "Still missing frontmatter: $file"; 
  fi; 
done

# Test build
make build
```

---

**Last Updated**: 2025-01-31
**Files Processed**: 47 of 47 missing frontmatter files completed (100%)
**Success Rate**: 100% - All files work correctly
**Methodology**: Systematic detection and directory-by-directory processing
**Status**: ✅ MISSION ACCOMPLISHED - All files now have proper frontmatter

