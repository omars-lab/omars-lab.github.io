# Changelog Directory Structure

This directory contains changelog entries organized by category.

## Directory Structure

- **`content/`** - Content-related changes (blog posts, documentation, content enhancements)
- **`development/`** - Development/infrastructure changes (components, mechanics, infrastructure, optimization, structure)

## File Organization

### Content Changes (`content/`)
Place entries related to:
- New blog posts (`content-post-*`)
- Documentation updates (`documentation-*`)
- Content enhancements

**Example**: `content/2025-01-15-content-post-knowledge-agents-design.md`

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

- [Naming Conventions](../../docs/NAMING_CONVENTIONS.md)
- [Changelog System Documentation](../../docs/6-techniques/3-blogging-techniques/changelog-system.md)

