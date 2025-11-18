# Changelog Entry Naming Conventions

This document defines the naming conventions for changelog entry files in the `bytesofpurpose-blog/changelog/` directory.

## General Format

```
YYYY-MM-DD-{category}-{action}-{descriptor}.md
```

Where:
- `YYYY-MM-DD` is the date (use `XX` for unknown/planned dates)
- `{category}` is the type of change (see Categories below)
- `{action}` is what's being done (see Actions below)
- `{descriptor}` is a kebab-case description of the specific item

## Categories

### Component
For changes related to UI components, React components, or visual elements.

**Format**: `component-{action}-{component-name}`

**Examples**:
- `2025-01-20-component-creation-graph-renderer.md`
- `2025-01-20-component-enhancement-graph-renderer.md`
- `2025-01-20-component-refactoring-graph-renderer.md`
- `2025-XX-XX-component-creation-mermaid-components.md`

### Mechanic
For changes related to blogging mechanisms, workflows, or processes.

**Format**: `mechanic-{action}-{mechanic-name}`

**Examples**:
- `2025-01-20-mechanic-establishment-link-management.md`
- `2025-01-20-mechanic-enhancement-link-management.md`
- `2025-XX-XX-mechanic-establishment-journey-analysis.md`

### Content Post
For blog content enhancements, new blog posts, or content-related improvements.

**Format**: `content-post-{descriptor}`

**Examples**:
- `2025-XX-XX-content-post-knowledge-agents-design.md`
- `2025-01-20-content-post-api-tutorial.md`

### Feature
For new features or capabilities that don't fit into component, mechanic, or content post categories.

**Format**: `feature-{descriptor}`

**Examples**:
- `2025-XX-XX-feature-search-functionality.md`
- `2025-01-20-feature-user-authentication.md`

### Bugfix
For bug fixes and error corrections.

**Format**: `bugfix-{descriptor}`

**Examples**:
- `2025-01-20-bugfix-graph-centering-mobile.md`
- `2025-01-20-bugfix-link-resolution-error.md`

### Documentation
For documentation improvements, guides, or content updates.

**Format**: `documentation-{descriptor}`

**Examples**:
- `2025-01-20-documentation-api-reference.md`
- `2025-01-20-documentation-setup-guide.md`

### Infrastructure
For infrastructure, build system, CI/CD, or deployment changes.

**Format**: `infrastructure-{descriptor}`

**Examples**:
- `2025-01-20-infrastructure-ci-cd-pipeline.md`
- `2025-XX-XX-infrastructure-build-optimization.md`

### Optimization
For performance optimizations, bundle size improvements, load time optimizations, or other performance-related changes.

**Format**: `optimization-{descriptor}`

**Examples**:
- `2025-01-20-optimization-bundle-size-storybook.md`
- `2025-XX-XX-optimization-page-load-time.md`
- `2025-01-20-optimization-code-splitting.md`
- `2025-XX-XX-optimization-asset-loading.md`

**Note**: Use `infrastructure-improvement-{descriptor}` for general infrastructure improvements, and `optimization-{descriptor}` specifically for performance/optimization work.

### Structure
For changes related to the blog's structure, organization, navigation, or information architecture.

**Format**: `structure-{descriptor}`

**Examples**:
- `2025-XX-XX-structure-navigation-reorganization.md`
- `2025-01-20-structure-category-hierarchy.md`
- `2025-XX-XX-structure-blog-layout.md`

### Plan
For planning documents, roadmaps, or strategic planning entries.

**Format**: `plan-{descriptor}`

**Examples**:
- `2025-XX-XX-plan-quarterly-roadmap.md`
- `2025-01-20-plan-feature-development.md`
- `2025-XX-XX-plan-blog-strategy.md`

### Refactoring
For code refactoring that doesn't fit into component refactoring (use `component-refactoring` for component-specific refactoring).

**Format**: `refactoring-{descriptor}`

**Examples**:
- `2025-01-20-refactoring-code-organization.md`
- `2025-01-20-refactoring-test-structure.md`

## Actions

### For Components
- **`creation`**: Creating a new component from scratch
- **`enhancement`**: Adding features or improving an existing component
- **`refactoring`**: Restructuring or improving code quality of an existing component

### For Mechanics
- **`establishment`**: Establishing a new blogging mechanism or workflow
- **`enhancement`**: Improving or extending an existing mechanism
- **`refactoring`**: Restructuring an existing mechanism

### For Other Categories
Most other categories don't require explicit actions, but you can use:
- **`improvement`**: General improvements (e.g., `infrastructure-improvement-build-speed.md`)
- **`addition`**: Adding something new (e.g., `documentation-addition-api-guide.md`)

## Date Format

- Use `YYYY-MM-DD` for specific dates (e.g., `2025-01-20`)
- Use `YYYY-XX-XX` for planned entries with unknown dates (e.g., `2025-XX-XX`)
- Use `YYYY-MM-XX` for entries with known month but unknown day (e.g., `2025-01-XX`)

## Descriptor Guidelines

1. Use **kebab-case** (lowercase with hyphens)
2. Be **specific** but **concise**
3. Use **singular** or **plural** as appropriate (e.g., `graph-renderer` not `graph-renderers`)
4. Avoid redundant words already covered by category/action (e.g., don't use `component-creation-new-graph-renderer.md`)

## Examples

### Component Examples
```
2025-01-20-component-creation-graph-renderer.md
2025-01-XX-component-enhancement-graph-renderer.md
2025-11-17-component-refactoring-graph-renderer.md
2025-XX-XX-component-creation-mermaid-components.md
```

### Mechanic Examples
```
2025-XX-XX-mechanic-establishment-link-management.md
2025-XX-XX-mechanic-enhancement-link-management.md
2025-XX-XX-mechanic-establishment-journey-analysis.md
```

### Content Post Examples
```
2025-XX-XX-content-post-knowledge-agents-design.md
2025-01-20-content-post-api-tutorial.md
```

### Feature Examples
```
2025-XX-XX-feature-search-functionality.md
2025-01-20-feature-user-authentication.md
```

### Bugfix Examples
```
2025-01-20-bugfix-graph-centering-mobile.md
2025-01-20-bugfix-link-resolution-error.md
```

### Documentation Examples
```
2025-01-20-documentation-api-reference.md
2025-01-20-documentation-setup-guide.md
```

### Infrastructure Examples
```
2025-XX-XX-infrastructure-build-optimization.md
2025-01-20-infrastructure-ci-cd-pipeline.md
```

### Optimization Examples
```
2025-01-20-optimization-bundle-size-storybook.md
2025-XX-XX-optimization-page-load-time.md
2025-01-20-optimization-code-splitting.md
```

### Structure Examples
```
2025-XX-XX-structure-navigation-reorganization.md
2025-01-20-structure-category-hierarchy.md
2025-XX-XX-structure-blog-layout.md
```

### Plan Examples
```
2025-XX-XX-plan-quarterly-roadmap.md
2025-01-20-plan-feature-development.md
2025-XX-XX-plan-blog-strategy.md
```

## Migration Notes

When renaming existing files:
1. Update the file name to match the convention
2. Regenerate changelog data: `node scripts/generate-changelog-data.js`
3. Update any references to the old file name in documentation or code

## Questions?

If you're unsure about the naming convention for a specific entry:
1. Identify the **category** (component, mechanic, content-post, feature, bugfix, documentation, infrastructure, optimization, structure, plan, refactoring)
2. Identify the **action** (creation, enhancement, refactoring, establishment, etc.) - note: structure, plan, and optimization categories don't require an action
3. Create a **concise descriptor** in kebab-case
4. Combine: `YYYY-MM-DD-{category}-{action}-{descriptor}.md` (or `YYYY-MM-DD-structure-{descriptor}.md` for structure entries, `YYYY-MM-DD-plan-{descriptor}.md` for plan entries, or `YYYY-MM-DD-optimization-{descriptor}.md` for optimization entries)

