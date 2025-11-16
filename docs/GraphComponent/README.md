# Graph Component System

## Overview

The Graph component system provides a comprehensive force-directed graph visualization for Docusaurus. The system has been refactored into smaller, focused components and hooks for better maintainability and testability.

## Architecture

### Component Hierarchy

```
GraphRenderer (BrowserOnly wrapper)
  └── GraphRendererImpl (Main component)
      ├── GraphCanvas (ForceGraph2D wrapper)
      ├── GraphInfoPanel (Side panel)
      └── GraphMenuBar (Control buttons)
```

### Components

#### 1. **GraphMenuBar**
- **File**: `GraphMenuBar.tsx`
- **Purpose**: Menu bar with graph control buttons
- **Props**: `onCenter`, `onExpandAll`, `onCollapseAll`, `onTogglePane`, `paneVisible`, `isDarkMode`, `menuBarHeight`
- **Features**:
  - Center graph button
  - Expand/Collapse all nodes
  - Toggle info panel visibility

#### 2. **GraphInfoPanel**
- **File**: `GraphInfoPanel.tsx`
- **Purpose**: Side panel displaying node/edge information
- **Props**: `selectedNode`, `selectedEdge`, `graphData`, `expandedNodes`, `graphRef`, `graphId`, `isDarkMode`, `height`, `onNodeClick`, `onExpandNode`
- **Features**:
  - Node information display
  - Edge information display
  - Connection lists (ingress/egress)
  - External links
  - Documentation section links
  - Comparison details for differentiating edges

#### 3. **GraphCanvas**
- **File**: `GraphCanvas.tsx`
- **Purpose**: Wrapper for ForceGraph2D component
- **Props**: All ForceGraph2D props plus custom renderers
- **Features**:
  - Canvas rendering
  - Node/edge rendering customization
  - Event handling

### Custom Hooks

#### 1. **useGraphState**
- **File**: `useGraphState.ts`
- **Purpose**: Centralized state management
- **Returns**: `{ state, actions }`
- **State Includes**:
  - `expandedNodes` - Set of expanded node IDs
  - `selectedNode` - Currently selected node
  - `selectedEdge` - Currently selected edge
  - `highlightedNodeId` - Highlighted node ID
  - `highlightedEdgeId` - Highlighted edge ID
  - `paneVisible` - Info panel visibility
  - `contextMenu` - Context menu state
  - `rightClickMenu` - Right-click menu state
  - `nodePositions` - Node position map
  - `isDarkMode` - Dark mode flag

#### 2. **useGraphData**
- **File**: `useGraphData.ts`
- **Purpose**: Graph data transformation
- **Returns**: `{ graphData, flattenNodes }`
- **Features**:
  - Flattens hierarchical nodes based on expansion state
  - Preserves all node/link properties
  - Generates parent-child links

#### 3. **useGraphInteractions**
- **File**: `useGraphInteractions.ts`
- **Purpose**: Event handler management
- **Returns**: Object with all interaction handlers
- **Handlers**:
  - `handleNodeClick` - Node click handler
  - `handleNodeRightClick` - Node right-click handler
  - `handleLinkClick` - Edge click handler
  - `handleLinkRightClick` - Edge right-click handler
  - `handleNodeDrag` - Node drag handler
  - `handleNodeDragEnd` - Node drag end handler
  - `handleZoom` - Zoom handler
  - `copyAnchorLink` - Copy anchor link to clipboard

### Utility Files

#### **GraphDataUtils.ts**
Tree traversal and data cleaning utilities:
- `findPathToNode` - Find path to a node
- `findNodeById` - Find node by ID
- `getAllNodesWithChildren` - Get all nodes with children
- `cleanNodeForSelection` - Clean node object
- `cleanEdgeForSelection` - Clean edge object

#### **GraphNodeUtils.ts**
Node properties and styling:
- `getNodeRadius` - Calculate node radius
- `getNodeColor` - Get node color
- `getNodeLabel` - Extract node label
- `isValidNodeCoordinates` - Validate coordinates
- `getNodeStatusIndicator` - Get status indicator

#### **GraphRenderingUtils.ts**
Rendering calculations:
- `getEdgeCoordinates` - Calculate edge coordinates
- `calculateAvailableTextWidth` - Calculate text width
- `calculateEmojiAreaCenterY` - Calculate emoji area center
- `calculateLinePositions` - Calculate line positions
- `calculateOptimalTitleFontSize` - Calculate title font size
- `calculateIndicatorFontSize` - Calculate indicator font size

#### **GraphTextUtils.ts**
Text processing:
- `breakLongWord` - Break long words
- `wrapTextIntoLines` - Wrap text into lines
- `truncateLine` - Truncate line with ellipsis
- `calculateOptimalFontSize` - Calculate optimal font size
- `applyZoomScaling` - Apply zoom scaling

## Usage

### Basic Example

```tsx
import GraphRenderer from './GraphRenderer';

<GraphRenderer
  data={graphData}
  width={800}
  height={600}
  graphId="my-graph"
/>
```

### Using Individual Components

```tsx
import { GraphMenuBar } from './GraphMenuBar';
import { GraphInfoPanel } from './GraphInfoPanel';
import { useGraphState } from './useGraphState';

const MyGraph = () => {
  const { state, actions } = useGraphState();
  
  return (
    <>
      <GraphMenuBar
        onCenter={() => {}}
        onExpandAll={() => {}}
        onCollapseAll={() => {}}
        onTogglePane={actions.togglePane}
        paneVisible={state.paneVisible}
        isDarkMode={state.isDarkMode}
        menuBarHeight={40}
      />
      {state.paneVisible && (
        <GraphInfoPanel
          selectedNode={state.selectedNode}
          selectedEdge={state.selectedEdge}
          graphData={graphData}
          expandedNodes={state.expandedNodes}
          graphRef={graphRef}
          graphId="my-graph"
          isDarkMode={state.isDarkMode}
          height={600}
          onNodeClick={(id) => {}}
          onExpandNode={(id) => actions.toggleNodeExpansion(id)}
        />
      )}
    </>
  );
};
```

## Storybook

The component system is documented in Storybook. To view:

```bash
npm run storybook
# or
yarn storybook
```

### Available Stories

- **Graph/GraphMenuBar** - Menu bar component stories
- **Graph/GraphInfoPanel** - Info panel component stories
- **Graph/Architecture** - Architecture overview and examples

## File Structure

```
src/components/Graph/
├── GraphRenderer.tsx          # Main component (to be refactored)
├── GraphMenuBar.tsx           # Menu bar component
├── GraphInfoPanel.tsx         # Info panel component
├── GraphCanvas.tsx            # Canvas wrapper component
├── useGraphState.ts           # State management hook
├── useGraphData.ts            # Data transformation hook
├── useGraphInteractions.ts    # Event handlers hook
├── GraphDataUtils.ts          # Data utilities
├── GraphNodeUtils.ts          # Node utilities
├── GraphRenderingUtils.ts     # Rendering utilities
├── GraphTextUtils.ts          # Text utilities
├── graphUtils.ts              # Re-export file (backward compatibility)
├── NodeRenderer.ts            # Node rendering class
├── types.ts                   # TypeScript types
├── GraphRenderer.module.css   # Styles
├── GraphMenuBar.stories.tsx   # Menu bar stories
├── GraphInfoPanel.stories.tsx # Info panel stories
├── Graph.stories.tsx          # Architecture stories
└── README.md                  # This file
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each component has a single, clear responsibility
2. **Reusability**: Components can be used independently or in different contexts
3. **Testability**: Individual components and hooks can be unit tested
4. **Maintainability**: Smaller, focused files are easier to understand and modify
5. **Performance**: Better code splitting and optimization opportunities
6. **Documentation**: Storybook provides interactive documentation

## Migration Notes

The original `GraphRenderer.tsx` file is being refactored to use these new components. The refactoring maintains backward compatibility through:

- `graphUtils.ts` re-exports all utility functions
- Component props maintain the same API
- No breaking changes to external usage

## Next Steps

1. Complete refactoring of `GraphRendererImpl` to use all new components
2. Add more Storybook stories for edge cases
3. Add unit tests for individual components
4. Performance optimization based on component boundaries

