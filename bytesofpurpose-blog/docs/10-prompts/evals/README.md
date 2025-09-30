---
slug: blog-post-evaluation-system
title: "Blog Post Evaluation System"
description: "A comprehensive system for evaluating individual blog posts and determining if they are ready to be moved from draft state to published."
authors: [oeid]
tags: [blog-evaluation, quality-gates, content-assessment, publishing-criteria, evaluation-rubrics]
date: 2025-01-15T10:00
draft: false
---

# Blog Post Evaluation Rubrics

Each file in this directory serves as a **specific evaluation rubric** for a corresponding blog post. This is a 1-1 mapping system where each rubric contains focused questions that the blog post should address.

## How It Works

- **One file = One blog post evaluation**
- **Focused questions** that the specific blog post should answer
- **Quality gate** to determine if the post is ready to publish
- **Concise rubrics** without generic evaluation criteria

## Directory Structure

```
docs/10-prompts/evals/
├── README.md                           # This file - system overview
├── all-posts/                          # Universal evaluation criteria
│   ├── general-blog-evaluation.md      # General blog evaluation (45 points)
│   └── evaluating-content-quality.md   # Content quality evaluation (20 points)
├── specific-posts/                     # Blog-specific evaluation criteria
│   ├── evaluating-[post-slug].md      # Specific blog post rubrics
│   └── ...                            # Additional specific rubrics
└── _category_.json                     # Docusaurus category file
```

## File Types

### Universal Evaluation Files (all-posts/)
- **`all-posts/general-blog-evaluation.md`** - Applies to ALL blog posts
- **Purpose**: Content quality, value proposition, professional positioning
- **Scoring**: 45 points total
- **Usage**: Use alongside specific rubrics for comprehensive evaluation
- **Tags**: `evaluation, general, content-quality, professional-positioning, universal-rubric`

- **`all-posts/evaluating-content-quality.md`** - Applies to ALL blog posts
- **Purpose**: Wordiness, focus, truthfulness, and content grounding
- **Scoring**: 20 points total
- **Usage**: Use alongside general and specific rubrics for comprehensive evaluation
- **Tags**: `evaluation, general, content-quality, wordiness, focus, truthfulness, content-grounding, universal-rubric`

### Specific Evaluation Files (specific-posts/)
- **`specific-posts/evaluating-[post-slug].md`** - Applies to ONE specific blog post
- **Purpose**: Focused questions tailored to that blog post's content
- **Scoring**: Varies by rubric (typically 8-12 criteria)
- **Usage**: Use with general evaluation for complete assessment
- **Tags**: `rubric, [post-specific-tag], [content-focus], evaluation`

## Tag Enforcement Rules

### Universal Evaluation Tags
**Required tags for universal evaluation files:**
- `evaluation` - Identifies as evaluation content
- `general` - Indicates universal applicability
- `content-quality` - Focus on content quality assessment
- `professional-positioning` - Focus on professional positioning
- `universal-rubric` - Indicates applies to all blog posts

### Specific Evaluation Tags
**Required tags for specific evaluation files:**
- `rubric` - Identifies as evaluation rubric
- `[post-specific-tag]` - Tag matching the blog post being evaluated
- `[content-focus]` - Tag indicating the content focus area
- `evaluation` - Identifies as evaluation content

**Examples:**
- `evaluating-my-approach.md` → `rubric, my-approach, problem-solving, methodology, evaluation`
- `evaluating-my-contributions.md` → `rubric, my-contributions, timeline, star-summaries, professional-impact, evaluation`
- `evaluating-docs-vs-blogs.md` → `rubric, docs-vs-blogs, content-strategy, evaluation`

## Naming Convention

Blog-specific evaluation prompts should follow this naming pattern:

**`evaluating-[post-slug].md`**

Examples:
- `evaluating-my-approach.md` → evaluates `my-approach.md`
- `evaluating-docs-vs-blogs.md` → evaluates `docs-vs-blogs.md`
- `evaluating-zapier-values.md` → evaluates `understanding-zapier-values.md`

This ensures clear 1-1 mapping between blog posts and their evaluation rubrics.

## Evaluation System

### Universal Evaluation
| Evaluation Type | File | Purpose |
|-----------------|------|---------|
| **General Blog Quality** | `all-posts/general-blog-evaluation.md` | Content quality, value proposition, professional positioning (45 points) |
| **Content Quality** | `all-posts/evaluating-content-quality.md` | Wordiness, focus, truthfulness, content grounding (20 points) |

### Specific Blog Post Rubrics

| Blog Post | Rubric File | Status |
|-----------|-------------|--------|
| `docs-vs-blogs.md` | `specific-posts/evaluating-docs-vs-blogs.md` | ✅ Ready |
| `DFS-vs-BFS.md` | `specific-posts/evaluating-dfs-vs-bfs.md` | ✅ Ready |
| `preparing-for-interviews.md` | `specific-posts/evaluating-preparing-for-interviews.md` | ✅ Ready |
| `understanding-cultural-values.md` | `specific-posts/evaluating-cultural-values.md` | ✅ Ready |
| `understanding-zapier-values.md` | `specific-posts/evaluating-zapier-values.md` | ✅ Ready |
| `my-approach.md` | `specific-posts/evaluating-my-approach.md` | ✅ Ready |
| `my-contributions.md` | `specific-posts/evaluating-my-contributions.md` | ✅ Ready |

## Tag Validation and Enforcement

### Universal Evaluation Tag Requirements
**All universal evaluation files MUST include these tags:**
- ✅ `evaluation` - Identifies as evaluation content
- ✅ `general` - Indicates universal applicability  
- ✅ `content-quality` - Focus on content quality assessment
- ✅ `professional-positioning` - Focus on professional positioning
- ✅ `universal-rubric` - Indicates applies to all blog posts

### Specific Evaluation Tag Requirements
**All specific evaluation files MUST include these tags:**
- ✅ `rubric` - Identifies as evaluation rubric
- ✅ `[post-specific-tag]` - Tag matching the blog post being evaluated
- ✅ `[content-focus]` - Tag indicating the content focus area
- ✅ `evaluation` - Identifies as evaluation content

### Tag Validation Process
1. **Check universal files** have all 5 required universal tags
2. **Check specific files** have all 4 required specific tags
3. **Verify post-specific tags** match the blog post being evaluated
4. **Ensure content-focus tags** accurately describe the evaluation focus
5. **Update tags** if they don't meet requirements

## Usage

### For All Blog Posts
1. **Use `all-posts/general-blog-evaluation.md`** for content quality and professional positioning (45 points)
2. **Use `all-posts/evaluating-content-quality.md`** for wordiness, focus, truthfulness, and content grounding (20 points)
3. **Check off criteria** as you verify content
4. **Calculate score** and apply quality thresholds

### For Specific Blog Posts
1. **Select the specific rubric** for your blog post (e.g., `specific-posts/evaluating-my-approach.md` for `my-approach.md`)
2. **Use `all-posts/general-blog-evaluation.md`** for general quality assessment (45 points)
3. **Use `all-posts/evaluating-content-quality.md`** for content quality assessment (20 points)
4. **Combine scores** for comprehensive evaluation
5. **Determine readiness** based on total score

## Quality Thresholds

### Combined Scoring (General + Content Quality + Specific)
- **🟢 Ready to Publish**: 80%+ criteria met across all rubrics
- **🟡 Needs Minor Revision**: 60-79% criteria met across all rubrics
- **🔴 Needs Major Revision**: Below 60% criteria met across all rubrics

### Individual Rubric Thresholds
- **General Blog Evaluation**: 36+ points (80% of 45 points)
- **Content Quality Evaluation**: 16+ points (80% of 20 points)
- **Specific Blog Evaluation**: Varies by rubric (typically 80%+ criteria met)

---

<details>
<summary>🤖 AI Metadata (Click to expand)</summary>

```yaml
# AI METADATA - DO NOT REMOVE OR MODIFY
# AI_UPDATE_INSTRUCTIONS:
# This README serves as the central guide for the blog post evaluation system.
# AI agents should use this file to understand how to properly handle this directory.
#
# 1. SCAN_SOURCES: Monitor /blog/ directory for new blog posts
# 2. EXTRACT_DATA: Extract blog post filenames, titles, and content
# 3. UPDATE_MAPPING: Add new blog posts to the mapping table
# 4. VERIFY_RUBRICS: Ensure all blog posts have corresponding evaluation rubrics
# 5. MAINTAIN_STRUCTURE: Keep 1-1 mapping system intact
# 6. UPDATE_STATUS: Track rubric completion status
#
# DIRECTORY_STRUCTURE:
# - README.md: System overview and instructions
# - all-posts/: Universal evaluation criteria
#   - general-blog-evaluation.md: General blog evaluation (45 points)
#   - evaluating-content-quality.md: Content quality evaluation (20 points)
# - specific-posts/: Blog-specific evaluation criteria
#   - evaluating-[post-slug].md: Specific blog post rubrics
# - _category_.json: Docusaurus category configuration
#
# NAMING_CONVENTIONS:
# - Blog posts: [date]-[title-slug].md in /blog/ directory
# - Universal rubrics: all-posts/evaluating-[criteria].md
# - Specific rubrics: specific-posts/evaluating-[post-slug].md
# - Universal evaluation: all-posts/general-blog-evaluation.md
#
# EVALUATION_PROCESS:
# 1. Identify blog post by filename
# 2. Find corresponding rubric using naming convention
# 3. Read both blog post content and rubric criteria
# 4. Evaluate each criterion against actual content
# 5. Update checkboxes ([x] for met, [ ] for unmet)
# 6. Calculate scores and apply quality thresholds
# 7. Provide specific feedback for improvement
#
# AI_AGENT_INSTRUCTIONS:
# When Evaluating a Blog Post:
# 1. Identify the blog post by filename (e.g., my-approach.md)
# 2. Find the corresponding rubric using naming convention (evaluating-my-approach.md)
# 3. Read both files - the blog post content and the rubric criteria
# 4. Evaluate each criterion against the actual blog post content
# 5. Update checkboxes - mark [x] for met criteria, [ ] for unmet criteria
# 6. Calculate score and apply quality thresholds
# 7. Provide feedback on specific areas for improvement
#
# When Creating New Rubrics:
# 1. Follow naming convention - evaluating-[post-slug].md
# 2. Include focused questions specific to that blog post's content
# 3. Add quality thresholds (typically 80%+ for publish-ready)
# 4. Update README mapping table to include new rubric
# 5. Test rubric against the actual blog post content
# 6. ENFORCE TAG REQUIREMENTS - ensure proper tags are included
#
# When Updating Existing Rubrics:
# 1. Check if blog post content has changed
# 2. Re-evaluate all criteria against current content
# 3. Update checkboxes to reflect current state
# 4. Recalculate scores and thresholds
# 5. Update status in README if needed
# 6. VALIDATE TAGS - ensure tags meet requirements
#
# TAG_ENFORCEMENT:
# Universal Evaluation Files MUST include:
# - evaluation, general, content-quality, professional-positioning, universal-rubric
# Specific Evaluation Files MUST include:
# - rubric, [post-specific-tag], [content-focus], evaluation
# Verify all files meet tag requirements before considering complete
#
# RUBRIC_CREATION:
# - Follow evaluating-[post-slug].md naming pattern
# - Include focused questions specific to blog post content
# - Add quality thresholds (typically 80%+ for publish-ready)
# - Update README mapping table
# - Test rubric against actual blog post content
#
# UPDATE_TRIGGERS:
# - New blog posts added to /blog/ directory
# - New rubric files created in /docs/10-prompts/evals/ directory
# - Changes to blog post filenames or titles
# - Status changes for existing rubrics
# - Content changes in existing blog posts
#
# QUALITY_THRESHOLDS:
# - Ready to Publish: 80%+ criteria met
# - Needs Minor Revision: 60-79% criteria met
# - Needs Major Revision: Below 60% criteria met
#
# FORMATTING_RULES:
# - Use table format for mapping blog posts to rubrics
# - Include filename, rubric filename, and status columns
# - Use checkmarks for completed rubrics
# - Keep instructions concise and actionable
# - Maintain consistent status indicators
# - AVOID MDX-BREAKING CHARACTERS: Do not use < > & characters without quotes
# - Quote values containing < > & characters (e.g., "under 60%" instead of <60%)
# - Use "less than" or "under" instead of < symbol
# - Use "greater than" or "over" instead of > symbol
# - Use "and" instead of & symbol when possible
#
# UPDATE_FREQUENCY: Real-time updates when blog posts or rubrics are added/modified
```

</details>

*Each rubric is tailored to the specific content and goals of its corresponding blog post.*