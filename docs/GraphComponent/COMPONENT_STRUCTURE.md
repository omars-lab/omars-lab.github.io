# GraphRenderer Component Structure

## Overview
This document outlines the component structure for splitting `GraphRenderer.tsx` into smaller, more maintainable components.

## Proposed Component Structure

### 1. **GraphMenuBar** ✅ (Created)
- **Location**: `GraphMenuBar.tsx`
- **Purpose**: Menu bar with graph control buttons
- **Props**: `onCenter`, `onExpandAll`, `onCollapseAll`, `onTogglePane`, `paneVisible`, `isDarkMode`, `menuBarHeight`
- **Status**: ✅ Complete

### 2. **useGraphState** ✅ (Created)
- **Location**: `useGraphState.ts`
- **Purpose**: Custom hook for managing graph state
- **Returns**: State object and actions object
- **Status**: ✅ Complete

### 3. **GraphInfoPanel** (To Create)
- **Location**: `GraphInfoPanel.tsx`
- **Purpose**: Side panel displaying node/edge information
- **Props**: 
  - `selectedNode`, `selectedEdge`, `graphData`
  - `onNodeClick`, `expandedNodes`, `graphRef`, `graphId`
  - `isDarkMode`, `height`
- **Status**: ⏳ Pending

### 4. **GraphCanvas** (To Create)
- **Location**: `GraphCanvas.tsx`
- **Purpose**: Wrapper for ForceGraph2D component
- **Props**: 
  - `graphData`, `width`, `height`, `backgroundColor`
  - `onNodeClick`, `onNodeRightClick`, `onLinkClick`, `onLinkRightClick`
  - `nodeCanvasObject`, `linkCanvasObject`, `linkCanvasObjectMode`
  - `graphRef`, `isDarkMode`
- **Status**: ⏳ Pending

### 5. **useGraphInteractions** (To Create)
- **Location**: `useGraphInteractions.ts`
- **Purpose**: Custom hook for graph interaction handlers
- **Returns**: Event handlers for nodes, edges, zoom, drag, etc.
- **Status**: ⏳ Pending

### 6. **useGraphData** (To Create)
- **Location**: `useGraphData.ts`
- **Purpose**: Custom hook for graph data transformation
- **Returns**: Flattened graph data, node expansion logic
- **Status**: ⏳ Pending

### 7. **GraphRendererImpl** (To Refactor)
- **Location**: `GraphRenderer.tsx` (refactored)
- **Purpose**: Main component that composes all sub-components
- **Composition**: Uses all the above components and hooks
- **Status**: ⏳ Pending

## Benefits of This Structure

1. **Separation of Concerns**: Each component has a single, clear responsibility
2. **Reusability**: Components can be reused or tested independently
3. **Maintainability**: Smaller files are easier to understand and modify
4. **Testability**: Individual components and hooks can be unit tested
5. **Performance**: Better code splitting and optimization opportunities

## Next Steps

1. Create `GraphInfoPanel.tsx` component
2. Create `GraphCanvas.tsx` component
3. Create `useGraphInteractions.ts` hook
4. Create `useGraphData.ts` hook
5. Refactor `GraphRendererImpl` to compose all components
6. Update main `GraphRenderer` wrapper

