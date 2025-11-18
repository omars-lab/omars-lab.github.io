---
title: 'Mermaid-Based Components for Blog'
description: 'Create reusable React components that wrap Mermaid diagrams for easier embedding and consistent styling across blog posts and documentation'
status: 'in-progress'
inception_date: '2025-09-15'
execution_date: '2025-09-29'
type: 'feature'
component: 'Mermaid'
priority: 'medium'
---

# Mermaid-Based Components for Blog

# Blob Changlog - Embedding Mermaid Diagrams
* Use this to iterate on mermaid diagrams 
	* https://github.com/mermaid-js/mermaid-cli
* [ ] Explore how to optimize the blog / use the latest features 
	* https://docusaurus.io/blog/releases/3.6#mermaid

## Execution Plan

### Overview

Currently, Mermaid diagrams are embedded directly in MDX files using code fences. While this works, creating reusable React components would provide:
- Consistent styling and theming
- Easier reuse across multiple posts
- Better integration with Docusaurus theme (light/dark mode)
- Component-level documentation in Storybook
- Type safety and validation

### Planned Components

#### 1. MermaidDiagram Component
**Purpose**: Base component for rendering Mermaid diagrams

**Features**:
- Accepts Mermaid code as prop or children
- Automatic theme detection (light/dark mode)
- Loading states
- Error handling with fallback display
- Responsive sizing
- Configurable Mermaid options

**Props**:
```typescript
interface MermaidDiagramProps {
  code: string;
  title?: string;
  config?: MermaidConfig;
  height?: string | number;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}
```

#### 2. MermaidTimeline Component
**Purpose**: Specialized component for timeline diagrams

**Features**:
- Pre-configured timeline styling
- Common timeline patterns
- Date formatting helpers
- Color scheme integration

#### 3. MermaidFlowchart Component
**Purpose**: Specialized component for flowcharts and process diagrams

**Features**:
- Pre-configured flowchart styling
- Common flowchart patterns
- Node styling helpers
- Link styling customization

#### 4. MermaidSequence Component
**Purpose**: Specialized component for sequence diagrams

**Features**:
- Pre-configured sequence diagram styling
- Actor styling helpers
- Message formatting
- Activation box styling

#### 5. MermaidGantt Component
**Purpose**: Specialized component for Gantt charts

**Features**:
- Pre-configured Gantt styling
- Date range helpers
- Task grouping
- Milestone markers

### Implementation Strategy

#### Phase 1: Base Component
1. Create `src/components/Mermaid/MermaidDiagram.tsx`
2. Integrate with `@docusaurus/theme-mermaid`
3. Add theme detection using `useColorMode` hook
4. Implement error boundaries
5. Add loading states
6. Create Storybook stories

#### Phase 2: Specialized Components
1. Create specialized components (Timeline, Flowchart, Sequence, Gantt)
2. Add component-specific styling and helpers
3. Create Storybook stories for each
4. Document usage patterns

#### Phase 3: Integration
1. Update documentation in `docs/6-techniques/3-blogging-techniques/2-embed-diagrams/`
2. Create usage examples
3. Migrate existing mermaid diagrams to use components (optional)
4. Add component to MDXComponents for global availability

### Technical Considerations

#### Dependencies
- `@docusaurus/theme-mermaid` - Already installed
- `mermaid` - Already installed
- `@docusaurus/theme-common` - For `useColorMode` hook

#### Theme Integration
- Detect current theme using `useColorMode()` hook
- Pass theme to Mermaid config
- Support manual theme override
- Ensure proper contrast in both themes

#### Performance
- Lazy load Mermaid library if needed
- Memoize diagram rendering
- Optimize re-renders on theme changes

#### Error Handling
- Catch Mermaid parsing errors
- Display error message with original code
- Fallback to code block display
- Log errors for debugging

### Storybook Integration

Create stories for:
- Base MermaidDiagram component
- Each specialized component
- Theme switching (light/dark)
- Error states
- Loading states
- Various diagram types

### Documentation

Update:
- `docs/6-techniques/3-blogging-techniques/2-embed-diagrams/diagrams-mermaid.mdx`
- Add component usage examples
- Document props and configuration
- Add migration guide from code fences

### Benefits

1. **Consistency**: All diagrams use same styling and theming
2. **Reusability**: Easy to reuse diagrams across posts
3. **Maintainability**: Centralized styling and configuration
4. **Type Safety**: TypeScript props prevent errors
5. **Documentation**: Storybook provides interactive examples
6. **Theme Support**: Automatic light/dark mode support
7. **Error Handling**: Better error messages and fallbacks

## Execution Results / Attempts

### ✅ Initial Work Completed (2025-09-15 to 2025-09-29)

**Work Period:** September 15, 2025 to September 29, 2025

**Commits:** 2 commits related to Mermaid diagrams

**Key Accomplishments:**
- Got Mermaid diagrams working in the blog
- Added comprehensive professional contributions timeline using Mermaid diagrams

**Notable Commits:**
- `4402f778` (2025-09-15): Got mermaid diagrams to work
- `dc099fc3` (2025-09-29): feat: Add comprehensive professional contributions timeline and approach documentation

**Status:** Initial Mermaid integration is complete. The blog now supports Mermaid diagrams. The plan to create reusable React components wrapping Mermaid diagrams is still planned for future work.


