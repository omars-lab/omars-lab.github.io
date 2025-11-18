---
title: 'Graph Component Architecture Documentation'
description: 'Documentation of the Graph component system architecture'
status: 'completed'
inception_date: '2025-11-17'
execution_date: '2025-11-17'
type: 'documentation'
component: 'Graph'
priority: 'medium'
---

# Graph Component Architecture Documentation

## Execution Plan

Document the architecture of the Graph component system after refactoring from a single 3200+ line file into a modular architecture with focused components, hooks, and utilities.

### Planned Documentation Sections
1. Component structure and hierarchy
2. Hook architecture
3. Utility architecture
4. Data flow diagrams
5. File structure

## Execution Results / Attempts

### ✅ Documentation Created

The Graph component system has been refactored from a single 3200+ line file into a modular architecture with focused components, hooks, and utilities.

## Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                  GraphRenderer                           │
│  (BrowserOnly wrapper - handles SSR prevention)          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  GraphRendererImpl   │
        │  (Main Component)  │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ GraphCanvas  │      │GraphInfoPanel│
│ (ForceGraph) │      │  (Side Bar)  │
└──────────────┘      └──────────────┘
        │
        ▼
┌──────────────┐
│ GraphMenuBar │
│  (Controls)  │
└──────────────┘
```

## Component Details

### GraphRenderer
- **Purpose**: Browser-only wrapper to prevent SSR issues
- **Location**: `GraphRenderer.tsx`
- **Responsibilities**:
  - Dynamic import of browser-only dependencies
  - Loading state management
  - Error handling

### GraphRendererImpl
- **Purpose**: Main component that composes all sub-components
- **Location**: `GraphRenderer.tsx` (to be refactored)
- **Responsibilities**:
  - Component composition
  - State coordination
  - Event handling orchestration

### GraphCanvas
- **Purpose**: ForceGraph2D wrapper
- **Location**: `GraphCanvas.tsx`
- **Props**: All ForceGraph2D configuration
- **Responsibilities**:
  - Canvas rendering setup
  - Graph visualization
  - Event propagation

### GraphInfoPanel
- **Purpose**: Side panel for node/edge information
- **Location**: `GraphInfoPanel.tsx`
- **Size**: ~400 lines (extracted from main file)
- **Responsibilities**:
  - Display node information
  - Display edge information
  - Show connections (ingress/egress)
  - External links
  - Documentation links

### GraphMenuBar
- **Purpose**: Control buttons
- **Location**: `GraphMenuBar.tsx`
- **Size**: ~100 lines
- **Responsibilities**:
  - Center graph
  - Expand/collapse all
  - Toggle panel visibility

## Hook Architecture

### useGraphState
- **Purpose**: Centralized state management
- **Location**: `useGraphState.ts`
- **Returns**: `{ state, actions }`
- **State Properties**:
  - `expandedNodes: Set<string>`
  - `selectedNode: any`
  - `selectedEdge: any`
  - `highlightedNodeId: string | null`
  - `highlightedEdgeId: string | null`
  - `paneVisible: boolean`
  - `contextMenu: {...} | null`
  - `rightClickMenu: {...} | null`
  - `nodePositions: Map<string, {...}>`
  - `isDarkMode: boolean`

### useGraphData
- **Purpose**: Data transformation
- **Location**: `useGraphData.ts`
- **Returns**: `{ graphData, flattenNodes }`
- **Features**:
  - Hierarchical node flattening
  - Expansion-based filtering
  - Link generation

### useGraphInteractions
- **Purpose**: Event handler management
- **Location**: `useGraphInteractions.ts`
- **Returns**: Object with all handlers
- **Handlers**:
  - Node interactions (click, right-click, drag)
  - Edge interactions (click, right-click)
  - Zoom handling
  - Clipboard operations

## Utility Architecture

### GraphDataUtils.ts
**Purpose**: Tree traversal and data operations
- `findPathToNode` - Find path to node in tree
- `findNodeById` - Find node by ID
- `getAllNodesWithChildren` - Get all parent nodes
- `cleanNodeForSelection` - Clean node object
- `cleanEdgeForSelection` - Clean edge object

### GraphNodeUtils.ts
**Purpose**: Node properties and styling
- `getNodeRadius` - Calculate radius (12 for parents, 8 for leaves)
- `getNodeColor` - Get color with fallback
- `getNodeLabel` - Extract label (title > name > id)
- `isValidNodeCoordinates` - Validate coordinates
- `getNodeStatusIndicator` - Get status symbol (▶/▼/🌿)

### GraphRenderingUtils.ts
**Purpose**: Rendering calculations
- `getEdgeCoordinates` - Calculate edge start/end points
- `calculateAvailableTextWidth` - Text width in circular node
- `calculateEmojiAreaCenterY` - Emoji area position
- `calculateLinePositions` - Text line Y positions
- `calculateOptimalTitleFontSize` - Title font sizing
- `calculateIndicatorFontSize` - Indicator font sizing

### GraphTextUtils.ts
**Purpose**: Text processing
- `breakLongWord` - Break words at natural boundaries
- `wrapTextIntoLines` - Wrap text into 3 lines
- `truncateLine` - Truncate with ellipsis
- `calculateOptimalFontSize` - Optimal font size calculation
- `applyZoomScaling` - Zoom-based font scaling

## Data Flow

```
User Interaction
    │
    ▼
useGraphInteractions (handlers)
    │
    ▼
useGraphState (state updates)
    │
    ▼
useGraphData (data transformation)
    │
    ▼
GraphCanvas (rendering)
    │
    ├──► GraphInfoPanel (display info)
    └──► GraphMenuBar (controls)
```

## Storybook Documentation

All components are documented in Storybook with:
- Interactive examples
- Prop documentation
- Usage examples
- Architecture overview

### Running Storybook

```bash
npm run storybook
# or
yarn storybook
```

### Available Stories

1. **Graph/GraphMenuBar**
   - Default (light mode)
   - Dark mode
   - Pane hidden
   - Custom height

2. **Graph/GraphInfoPanel**
   - Empty state
   - Node selected
   - Edge selected
   - Dark mode
   - Differentiating edge

3. **Graph/Architecture**
   - Architecture overview
   - Component examples
   - Usage patterns

## File Size Reduction

### Before Refactoring
- `GraphRenderer.tsx`: ~3,219 lines

### After Refactoring
- `GraphRenderer.tsx`: ~800-1000 lines (estimated after full refactor)
- `GraphMenuBar.tsx`: ~100 lines
- `GraphInfoPanel.tsx`: ~400 lines
- `GraphCanvas.tsx`: ~150 lines
- `useGraphState.ts`: ~120 lines
- `useGraphData.ts`: ~100 lines
- `useGraphInteractions.ts`: ~150 lines
- Utility files: ~1,200 lines (split across 4 files)

**Total**: Similar line count, but much better organized

## Benefits

1. **Maintainability**: Smaller files are easier to understand
2. **Testability**: Components can be tested independently
3. **Reusability**: Components can be used in different contexts
4. **Documentation**: Storybook provides interactive docs
5. **Performance**: Better code splitting opportunities
6. **Collaboration**: Multiple developers can work on different components

## Migration Path

1. ✅ Created utility files (GraphDataUtils, GraphNodeUtils, etc.)
2. ✅ Created hooks (useGraphState, useGraphData, useGraphInteractions)
3. ✅ Created components (GraphMenuBar, GraphInfoPanel, GraphCanvas)
4. ⏳ Refactor GraphRendererImpl to use new components
5. ✅ Set up Storybook
6. ✅ Create Storybook stories

## Next Steps

1. Complete GraphRendererImpl refactoring
2. Add unit tests for components
3. Add integration tests
4. Performance profiling
5. Additional Storybook stories for edge cases

