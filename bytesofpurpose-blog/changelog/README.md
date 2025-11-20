# Changelog Directory Structure

This directory contains changelog entries organized by category.

## Directory Structure

- **`content/`** - Content-related changes (blog posts, documentation, content enhancements)
- **`development/`** - Development/infrastructure changes (components, mechanics, infrastructure, optimization, structure)

## File Organization

### Content Changes (`content/`)
Place entries related to:
- New blog posts (`content-post-*`)
- Documentation that creates new docs (`content-docs-*`)
- Changelog-related content/analysis (`content-changelog-*`)
- General documentation updates (`documentation-*` - legacy, prefer `content-docs-*` for new entries)
- Content enhancements

**Prefix Guidelines:**
- **`content-post-{descriptor}`**: For blog posts and blog content enhancements
- **`content-docs-{descriptor}`**: For documentation that results in new documentation files
- **`content-changelog-{descriptor}`**: For changelog-related content or analysis
- **`documentation-{descriptor}`**: For general documentation updates (legacy format)

**Examples**:
- `content/2025-01-15-content-post-knowledge-agents-design.md` - Blog post entry
- `content/2025-11-20-content-docs-adding-content-guides.md` - Documentation creation entry
- `content/2025-11-20-content-changelog-missing-features-analysis.md` - Changelog analysis entry

### Development Changes (`development/`)
Place entries related to:
- Component creation/enhancement (`component-*`)
- Blogging mechanics (`mechanic-*`)
- Infrastructure improvements (`infrastructure-*`)
- Performance optimizations (`optimization-*`)
- Structure changes (`structure-*`)
- Refactoring (`refactoring-*`)
- Bug fixes (`bugfix-*`)

**Example**: `development/2025-01-15-component-creation-svg-kanban.md`

## Backward Compatibility

Files in the root `changelog/` directory are automatically categorized:
- Files with `content-post-*` prefix → `content` category
- All other files → `development` category

However, **it's recommended to move files to the appropriate subdirectory** for better organization.

## Migration Guide

To migrate existing files:

1. **Content entries** → Move to `content/` subdirectory
2. **Development entries** → Move to `development/` subdirectory

The generation script automatically handles subdirectories, so slugs will include the subdirectory path (e.g., `content/2025-01-15-content-post-...`).

## See Also

- [Naming Conventions](https://github.com/omars-lab/omars-lab.github.io/blob/master/docs/NAMING_CONVENTIONS.md)
- [Changelog System Documentation](/docs/techniques/blogging-techniques/changelog-system)

