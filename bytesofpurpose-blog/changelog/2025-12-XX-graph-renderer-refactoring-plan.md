---
title: 'GraphRenderer Component Refactoring Plan'
description: 'Comprehensive plan to refactor the 3382-line GraphRenderer.tsx into smaller, composable components and utilities'
status: 'planned'
inception_date: '2025-11-17'
execution_date: 'TBD'
type: 'refactoring'
component: 'GraphRenderer'
priority: 'high'
---

# GraphRenderer Refactoring Plan

## Execution Plan

Refactor the 3382-line `GraphRenderer.tsx` into smaller, composable components and utilities while maintaining all existing functionality. This plan follows principles that a principal frontend engineer would approve.

### Overview

## Component Organization Strategy

### Subdirectory Structure with Index Files

**Goal**: Organize components into subdirectories with `index.tsx` files for cleaner imports and better maintainability.

#### Target Directory Structure

```
src/components/Graph/
├── GraphRenderer/              # Main component (stays at root for now)
│   ├── index.tsx              # Re-exports GraphRenderer
│   ├── GraphRenderer.tsx      # Main implementation
│   ├── GraphRenderer.module.css
│   └── GraphRenderer.stories.tsx
├── GraphMenuBar/
│   ├── index.tsx              # Re-exports GraphMenuBar
│   ├── GraphMenuBar.tsx
│   └── GraphMenuBar.stories.tsx
├── GraphInfoPanel/
│   ├── index.tsx              # Re-exports GraphInfoPanel
│   ├── GraphInfoPanel.tsx
│   └── GraphInfoPanel.stories.tsx
├── GraphCanvas/
│   ├── index.tsx              # Re-exports GraphCanvas
│   ├── GraphCanvas.tsx
│   └── GraphCanvas.stories.tsx
├── GraphRightClickMenu/        # New component (extracted)
│   ├── index.tsx
│   ├── GraphRightClickMenu.tsx
│   └── GraphRightClickMenu.stories.tsx
├── GraphContextMenu/           # New component (extracted)
│   ├── index.tsx
│   ├── GraphContextMenu.tsx
│   └── GraphContextMenu.stories.tsx
├── hooks/                      # Custom hooks
│   ├── index.ts                # Re-exports all hooks
│   ├── useGraphDimensions.ts
│   ├── useGraphState.ts
│   ├── useGraphData.ts
│   ├── useGraphInteractions.ts
│   ├── useGraphCanvasSetup.ts
│   ├── useGraphMenuHandlers.ts
│   └── useGraphUrlFragment.ts
├── utils/                      # Utility functions
│   ├── index.ts                # Re-exports all utils
│   ├── graphConstants.ts
│   ├── GraphDataUtils.ts
│   ├── GraphNodeUtils.ts
│   ├── GraphRenderingUtils.ts
│   ├── GraphTextUtils.ts
│   ├── GraphCanvasDrawingUtils.ts
│   ├── GraphEdgeDrawingUtils.ts
│   └── graphUtils.ts          # Backward compatibility re-exports
├── types.ts                    # Shared types
└── README.md                   # Component documentation
```

#### Index File Pattern

Each component subdirectory will have an `index.tsx` that re-exports the component:

```typescript
// GraphMenuBar/index.tsx
export { GraphMenuBar } from './GraphMenuBar';
export type { GraphMenuBarProps } from './GraphMenuBar';
```

This allows clean imports:
```typescript
// Before
import { GraphMenuBar } from './GraphMenuBar/GraphMenuBar';

// After
import { GraphMenuBar } from './GraphMenuBar';
```

#### Story Organization

Stories will be co-located with components in their subdirectories:

```typescript
// GraphMenuBar/GraphMenuBar.stories.tsx
import { Meta, StoryObj } from '@storybook/react';
import { GraphMenuBar } from './GraphMenuBar';

const meta: Meta<typeof GraphMenuBar> = {
  title: 'Graph/GraphMenuBar',
  component: GraphMenuBar,
};

export default meta;
type Story = StoryObj<typeof GraphMenuBar>;

export const Default: Story = {
  // ...
};
```

#### Benefits of This Structure

1. **Cleaner Imports**: `import { GraphMenuBar } from './GraphMenuBar'` instead of `'./GraphMenuBar/GraphMenuBar'`
2. **Co-location**: Component, styles, stories, and tests in one place
3. **Better Discoverability**: Easy to find all files related to a component
4. **Scalability**: Easy to add new components without cluttering root
5. **Maintainability**: Clear boundaries between components

#### Migration Strategy

**Phase 0: Reorganize Existing Components** (Before refactoring)

1. **Create subdirectories for existing components**
   ```bash
   mkdir -p src/components/Graph/GraphMenuBar
   mkdir -p src/components/Graph/GraphInfoPanel
   mkdir -p src/components/Graph/GraphCanvas
   ```

2. **Move component files**
   ```bash
   mv GraphMenuBar.tsx GraphMenuBar/GraphMenuBar.tsx
   mv GraphMenuBar.stories.tsx GraphMenuBar/GraphMenuBar.stories.tsx
   ```

3. **Create index.tsx files**
   ```typescript
   // GraphMenuBar/index.tsx
   export { GraphMenuBar } from './GraphMenuBar';
   export type { GraphMenuBarProps } from './GraphMenuBar';
   ```

4. **Update imports in GraphRenderer**
   ```typescript
   // Before
   import { GraphMenuBar } from './GraphMenuBar';
   
   // After (no change needed if index.tsx is created)
   import { GraphMenuBar } from './GraphMenuBar';
   ```

5. **Create hooks/ subdirectory**
   ```bash
   mkdir -p src/components/Graph/hooks
   mv useGraphState.ts hooks/
   mv useGraphData.ts hooks/
   mv useGraphInteractions.ts hooks/
   ```

6. **Create hooks/index.ts**
   ```typescript
   // hooks/index.ts
   export { useGraphState } from './useGraphState';
   export { useGraphData } from './useGraphData';
   export { useGraphInteractions } from './useGraphInteractions';
   ```

7. **Create utils/ subdirectory** (if not exists)
   ```bash
   mkdir -p src/components/Graph/utils
   # Move utility files to utils/
   ```

8. **Update all imports**
   - Update GraphRenderer imports
   - Update Storybook stories
   - Update tests
   - Update documentation

**Timing**: This reorganization should happen **before** starting the refactoring phases, as it provides a clean foundation.

## Current State Analysis

### File Size: 3382 lines
### Main Sections:
1. **Drawing Functions** (~600 lines): `drawNodeCircle`, `drawDebugSectionSeparators`, `drawTitle`, `drawStatusIndicator`
2. **Edge Rendering Functions** (~100 lines): `getEdgeWidth`, `getEdgeCoordinates`, `drawComparisonEdge`, `drawEdgeLabel`
3. **Main Component Logic** (~2600 lines): State, event handlers, dimension calculations, canvas setup, menus, info panel
4. **Constants**: `NEO4J_COLORS`, `DEBUG_SHOW_NODE_SECTIONS`

### Existing Utilities (Already Extracted):
- ✅ `GraphDataUtils.ts` - Tree traversal, data cleaning
- ✅ `GraphNodeUtils.ts` - Node properties, styling, validation
- ✅ `GraphRenderingUtils.ts` - Rendering calculations, coordinates
- ✅ `GraphTextUtils.ts` - Text processing, wrapping, font sizing
- ✅ `NodeRenderer.ts` - Node rendering class
- ✅ `useGraphData.ts` - Graph data hooks
- ✅ `useGraphInteractions.ts` - Interaction hooks
- ✅ `useGraphState.ts` - State management hooks

### Existing Components (Already Extracted):
- ✅ `GraphCanvas.tsx` - Canvas wrapper
- ✅ `GraphInfoPanel.tsx` - Info panel component
- ✅ `GraphMenuBar.tsx` - Menu bar component

## Refactoring Strategy

### Phase 1: Extract Canvas Drawing Utilities (Low Risk)
**Goal**: Move pure drawing functions to utility files

#### 1.1 Create `GraphCanvasDrawingUtils.ts`
**Extract:**
- `drawNodeCircle` → `drawNodeCircle`
- `drawDebugSectionSeparators` → `drawDebugSectionSeparators`
- `drawStatusIndicator` → `drawStatusIndicator`
- `drawTitle` → `drawTitle` (complex, ~400 lines - keep as-is but move to utils)

**Location**: `src/components/Graph/GraphCanvasDrawingUtils.ts`

**Dependencies**: 
- Canvas context
- Node data
- Styling parameters (colors, sizes)

**Risk**: Low - Pure functions, no component state

#### 1.2 Create `GraphEdgeDrawingUtils.ts`
**Extract:**
- `drawComparisonEdge` → `drawComparisonEdge`
- `drawEdgeLabel` → `drawEdgeLabel`
- `getEdgeWidth` → `getEdgeWidth` (already in GraphRenderingUtils? Check)

**Location**: `src/components/Graph/GraphEdgeDrawingUtils.ts`

**Risk**: Low - Pure functions

### Phase 2: Extract Dimension Calculation Logic (Low Risk)
**Goal**: Move responsive dimension calculations to a custom hook

#### 2.1 Create `useGraphDimensions.ts`
**Extract:**
- Dimension calculation logic (lines ~2349-2361)
- `baseGraphAreaHeight`, `graphCanvasHeight`, `graphAreaHeight` calculations
- `graphWidth`, `panelWidth` calculations
- Container width measurement logic

**Location**: `src/components/Graph/useGraphDimensions.ts`

**Returns:**
```typescript
{
  graphAreaHeight: number;
  graphCanvasHeight: number;
  graphWidth: number;
  panelWidth: number;
  actualContainerWidth: number;
  isMobile: boolean;
}
```

**Risk**: Low - Isolated logic, easy to test

### Phase 3: Extract Event Handlers (Medium Risk)
**Goal**: Move event handler logic to custom hooks

#### 3.1 Enhance `useGraphInteractions.ts`
**Extract:**
- `handleNodeClick` → `useNodeClickHandler`
- `handleNodeRightClick` → `useNodeRightClickHandler`
- `handleLinkClick` → `useLinkClickHandler`
- `handleLinkRightClick` → `useLinkRightClickHandler`
- `handleNodeDrag` → `useNodeDragHandler`
- `handleNodeDragEnd` → `useNodeDragEndHandler`
- `handleZoom` → `useZoomHandler`
- `handleWheel` → `useWheelHandler`

**Location**: `src/components/Graph/useGraphInteractions.ts` (enhance existing)

**Risk**: Medium - Need to ensure all dependencies are passed correctly

#### 3.2 Create `useGraphMenuHandlers.ts`
**Extract:**
- `copyAnchorLink` → `useCopyAnchorLink`
- `togglePane` → `useTogglePane`
- Context menu click outside handler
- Right-click menu logic

**Location**: `src/components/Graph/useGraphMenuHandlers.ts`

**Risk**: Low - Isolated menu logic

### Phase 4: Extract Canvas Setup Logic (Medium Risk)
**Goal**: Move canvas initialization and event listeners to a hook

#### 4.1 Create `useGraphCanvasSetup.ts`
**Extract:**
- Canvas ref setup
- Event listener registration (wheel, contextmenu)
- Canvas cleanup
- `nodeCanvasObject` and `linkCanvasObject` creation

**Location**: `src/components/Graph/useGraphCanvasSetup.ts`

**Returns:**
```typescript
{
  graphRef: RefObject<any>;
  nodeCanvasObject: (node, ctx, globalScale) => void;
  linkCanvasObject: (link, ctx, globalScale) => void;
  linkCanvasObjectMode: (link) => string;
}
```

**Risk**: Medium - Complex setup logic, need to ensure all dependencies

### Phase 5: Extract Menu Components (Low Risk)
**Goal**: Extract inline menu JSX to separate components

#### 5.1 Create `GraphRightClickMenu.tsx`
**Extract:**
- Right-click menu JSX (lines ~2425-2486)
- Menu item rendering logic

**Location**: `src/components/Graph/GraphRightClickMenu.tsx`

**Props:**
```typescript
{
  menu: { nodeId: string; x: number; y: number } | null;
  isDarkMode: boolean;
  expandedNodes: Set<string>;
  onToggleExpansion: (nodeId: string) => void;
  onCopyLink: (nodeId: string) => void;
  onClose: () => void;
}
```

**Risk**: Low - Pure presentational component

#### 5.2 Create `GraphContextMenu.tsx`
**Extract:**
- Context menu JSX (lines ~2487-2510)

**Location**: `src/components/Graph/GraphContextMenu.tsx`

**Props:**
```typescript
{
  menu: { x: number; y: number; nodeId?: string; edgeId?: string } | null;
  isDarkMode: boolean;
  onCopyLink: (nodeId?: string, edgeId?: string) => void;
  onClose: () => void;
}
```

**Risk**: Low - Pure presentational component

### Phase 6: Extract URL Fragment Handling (Low Risk)
**Goal**: Move URL fragment parsing and highlighting to a hook

#### 6.1 Create `useGraphUrlFragment.ts`
**Extract:**
- URL fragment parsing logic
- `highlightNode` and `highlightEdge` calls from URL
- Scroll to graph logic

**Location**: `src/components/Graph/useGraphUrlFragment.ts`

**Risk**: Low - Isolated URL handling

### Phase 7: Extract Constants (Low Risk)
**Goal**: Move constants to a separate file

#### 7.1 Create `graphConstants.ts`
**Extract:**
- `NEO4J_COLORS` → `NEO4J_COLORS`
- `DEBUG_SHOW_NODE_SECTIONS` → `DEBUG_SHOW_NODE_SECTIONS`

**Location**: `src/components/Graph/graphConstants.ts`

**Risk**: Low - Simple constants

### Phase 8: Refactor Main Component (High Risk - Do Last)
**Goal**: Simplify GraphRendererImpl to orchestrate hooks and components

#### 8.1 Final GraphRendererImpl Structure
```typescript
const GraphRendererImpl = ({ ... }) => {
  // Hooks
  const dimensions = useGraphDimensions(width, height, paneVisible, isMobile);
  const graphState = useGraphState(initialExpandedNodes);
  const interactions = useGraphInteractions(/* deps */);
  const canvasSetup = useGraphCanvasSetup(/* deps */);
  const menuHandlers = useGraphMenuHandlers(graphId);
  const urlFragment = useGraphUrlFragment(/* deps */);
  
  // Memoized callbacks
  const nodeCanvasObject = canvasSetup.nodeCanvasObject;
  const linkCanvasObject = canvasSetup.linkCanvasObject;
  
  // Render
  return (
    <div>
      <GraphMenuBar />
      <div className={styles.graphArea}>
        <GraphCanvas>
          <ForceGraph2D {...props} />
        </GraphCanvas>
        {paneVisible && <GraphInfoPanel />}
      </div>
      <GraphRightClickMenu />
      <GraphContextMenu />
    </div>
  );
};
```

**Risk**: High - This is the integration point, need careful testing

## Implementation Order (Risk-Based)

### Phase 0: Reorganize Structure (Week 0 - Prerequisite)
**Goal**: Set up subdirectory structure before refactoring

1. ✅ Create subdirectories for existing components
2. ✅ Move components to subdirectories with index.tsx
3. ✅ Move stories to component subdirectories
4. ✅ Create hooks/ subdirectory and move hooks
5. ✅ Create utils/ subdirectory (if needed)
6. ✅ Update all imports across codebase
7. ✅ Verify all tests still pass
8. ✅ Verify Storybook stories still work

**Timing**: Do this **before** starting Phase 1

### Week 1: Low-Risk Extractions
1. ✅ Phase 7: Extract Constants → `utils/graphConstants.ts`
2. ✅ Phase 1: Extract Canvas Drawing Utilities → `utils/GraphCanvasDrawingUtils.ts` & `utils/GraphEdgeDrawingUtils.ts`
3. ✅ Phase 2: Extract Dimension Calculation Logic → `hooks/useGraphDimensions.ts`
4. ✅ Phase 5: Extract Menu Components → `GraphRightClickMenu/` & `GraphContextMenu/`

### Week 2: Medium-Risk Extractions
5. ✅ Phase 3: Extract Event Handlers → `hooks/useGraphInteractions.ts` (enhance)
6. ✅ Phase 4: Extract Canvas Setup Logic → `hooks/useGraphCanvasSetup.ts`
7. ✅ Phase 6: Extract URL Fragment Handling → `hooks/useGraphUrlFragment.ts`
8. ✅ Phase 7: Extract Menu Handlers → `hooks/useGraphMenuHandlers.ts`

### Week 3: High-Risk Integration
9. ✅ Phase 8: Refactor Main Component
10. ✅ Comprehensive Testing
11. ✅ Update Documentation

## Testing Strategy

### Test Directory Structure
```
test/
├── e2e/                    # End-to-end tests (Playwright)
│   ├── graph-renderer.spec.ts
│   ├── graph-selection-state.spec.ts
│   ├── graph-title-rendering.spec.ts
│   └── helpers/
│       └── canvas-utils.ts
├── unit/                   # Unit tests (Jest)
│   └── GraphRenderer.title.test.ts
├── utils/                  # Test utilities
│   └── canvasMock.ts
└── setup.ts               # Jest setup
```

### Unit Tests (Jest) - `test/unit/`

#### Phase 1: Utility Function Tests
**Location**: `test/unit/`

**New Test Files to Create:**
1. **`GraphCanvasDrawingUtils.test.ts`**
   - Test `drawNodeCircle` with various parameters
   - Test `drawDebugSectionSeparators` (when debug enabled)
   - Test `drawStatusIndicator` for leaf vs parent nodes
   - Test `drawTitle` with various text lengths and zoom levels
   - Use `createMockCanvasContext()` from `test/utils/canvasMock.ts`

2. **`GraphEdgeDrawingUtils.test.ts`**
   - Test `drawComparisonEdge` rendering
   - Test `drawEdgeLabel` with various labels and scales
   - Test `getEdgeWidth` calculations

3. **`graphConstants.test.ts`**
   - Test `NEO4J_COLORS` array structure
   - Test `DEBUG_SHOW_NODE_SECTIONS` flag

4. **`useGraphDimensions.test.ts`**
   - Test dimension calculations for mobile vs desktop
   - Test pane visibility impact on dimensions
   - Test container width measurement
   - Use React Testing Library to test hook

**Update Existing:**
- **`GraphRenderer.title.test.ts`**: Update imports if `drawTitle` moves to utils

#### Phase 2: Hook Tests
**Location**: `test/unit/`

**New Test Files:**
1. **`useGraphMenuHandlers.test.ts`**
   - Test `useCopyAnchorLink` with clipboard API
   - Test `useTogglePane` state changes
   - Test context menu click outside handler

2. **`useGraphUrlFragment.test.ts`**
   - Test URL fragment parsing
   - Test `highlightNode` from URL
   - Test `highlightEdge` from URL
   - Test scroll to graph behavior

3. **`useGraphCanvasSetup.test.ts`**
   - Test canvas ref setup
   - Test event listener registration
   - Test `nodeCanvasObject` creation
   - Test `linkCanvasObject` creation

**Enhance Existing:**
- **`useGraphInteractions.ts`** (if exists): Add tests for extracted handlers

#### Test Utilities to Create/Update
**Location**: `test/utils/`

1. **`graphHookTestUtils.ts`** (New)
   ```typescript
   // Utilities for testing graph hooks
   export function renderGraphHook<T>(hook: () => T, wrapper?: ReactWrapper)
   export function createMockGraphRef()
   export function createMockGraphData()
   ```

2. **`canvasMock.ts`** (Update)
   - Add more mock methods if needed for new drawing functions
   - Ensure compatibility with extracted drawing utilities

### End-to-End Tests (Playwright) - `test/e2e/`

#### Update Strategy for E2E Tests

**Key Principle**: E2E tests should remain largely unchanged since they test the public API of `GraphRenderer`, not internal implementation details.

#### Files to Update:

1. **`graph-renderer.spec.ts`**
   - **No changes needed** - Tests public API (canvas rendering, interactions)
   - May need to update selectors if component structure changes slightly
   - Verify canvas still renders correctly after refactoring

2. **`graph-selection-state.spec.ts`**
   - **No changes needed** - Tests selection behavior (public API)
   - Verify node/edge selection still works after refactoring
   - Test URL hash behavior still works

3. **`graph-title-rendering.spec.ts`**
   - **No changes needed** - Tests title rendering (visual output)
   - Verify ellipsis regression test still passes
   - May need screenshot updates if rendering changes slightly

#### New E2E Tests to Add:

1. **`graph-responsive-behavior.spec.ts`** (New)
   ```typescript
   // Test responsive behavior
   - Test mobile layout (pane below graph)
   - Test desktop layout (pane beside graph)
   - Test pane visibility toggle
   - Test graph area resizing
   - Test canvas overflow prevention
   ```

2. **`graph-menu-interactions.spec.ts`** (New)
   ```typescript
   // Test menu interactions
   - Test right-click menu
   - Test context menu
   - Test copy anchor link
   - Test menu positioning
   ```

#### E2E Test Helpers to Update:

1. **`helpers/canvas-utils.ts`**
   - **No changes needed** - Generic canvas utilities
   - May add helpers for testing responsive behavior if needed

### Integration Tests (New Category)

**Location**: `test/integration/` (Create if doesn't exist)

#### Purpose
Test interactions between hooks and components in isolation from full E2E flow.

#### New Test Files:

1. **`GraphRenderer.integration.test.tsx`**
   ```typescript
   // Test GraphRenderer with all hooks integrated
   - Test component renders with all hooks
   - Test hook interactions (e.g., dimension changes trigger re-render)
   - Test state synchronization between hooks
   - Use React Testing Library
   ```

2. **`GraphHooks.integration.test.tsx`**
   ```typescript
   // Test hook interactions
   - Test useGraphDimensions + useGraphState interaction
   - Test useGraphInteractions + useGraphCanvasSetup interaction
   - Test useGraphUrlFragment + useGraphState interaction
   ```

### Test Update Checklist Per Phase

#### Phase 1: Extract Constants & Drawing Utilities
- [ ] Create `GraphCanvasDrawingUtils.test.ts`
- [ ] Create `GraphEdgeDrawingUtils.test.ts`
- [ ] Create `graphConstants.test.ts`
- [ ] Update `GraphRenderer.title.test.ts` imports if needed
- [ ] Run unit tests: `yarn test`
- [ ] Verify all tests pass

#### Phase 2: Extract Dimension Calculations
- [ ] Create `useGraphDimensions.test.ts`
- [ ] Test mobile vs desktop calculations
- [ ] Test pane visibility impact
- [ ] Run unit tests: `yarn test`
- [ ] Run E2E tests: `yarn test:e2e` (verify no regressions)

#### Phase 3: Extract Event Handlers
- [ ] Enhance `useGraphInteractions.test.ts` (if exists)
- [ ] Test all event handlers in isolation
- [ ] Run unit tests: `yarn test`
- [ ] Run E2E tests: `yarn test:e2e` (verify interactions still work)

#### Phase 4: Extract Canvas Setup
- [ ] Create `useGraphCanvasSetup.test.ts`
- [ ] Test canvas ref setup
- [ ] Test event listener registration
- [ ] Run unit tests: `yarn test`
- [ ] Run E2E tests: `yarn test:e2e` (verify canvas still renders)

#### Phase 5: Extract Menu Components
- [ ] Create `GraphRightClickMenu.test.tsx`
- [ ] Create `GraphContextMenu.test.tsx`
- [ ] Test menu rendering and interactions
- [ ] Run unit tests: `yarn test`
- [ ] Run E2E tests: `yarn test:e2e` (verify menus still work)

#### Phase 6: Extract URL Fragment Handling
- [ ] Create `useGraphUrlFragment.test.ts`
- [ ] Test URL parsing and highlighting
- [ ] Run unit tests: `yarn test`
- [ ] Run E2E tests: `yarn test:e2e` (verify URL hash still works)

#### Phase 7: Extract Menu Handlers
- [ ] Create `useGraphMenuHandlers.test.ts`
- [ ] Test clipboard API interactions
- [ ] Test pane toggle
- [ ] Run unit tests: `yarn test`
- [ ] Run E2E tests: `yarn test:e2e` (verify menu actions still work)

#### Phase 8: Refactor Main Component
- [ ] Create `GraphRenderer.integration.test.tsx`
- [ ] Test full component with all hooks
- [ ] Run all unit tests: `yarn test`
- [ ] Run all E2E tests: `yarn test:e2e`
- [ ] Visual regression test in Storybook
- [ ] Performance test (ensure no degradation)

### Test Maintenance Strategy

#### After Each Phase:
1. **Run Test Suite**
   ```bash
   # Unit tests
   yarn test
   
   # E2E tests
   yarn test:e2e
   
   # With coverage
   yarn test:coverage
   ```

2. **Update Test Documentation**
   - Update `test/README.md` if test structure changes
   - Update `test/e2e/README.md` if E2E tests change
   - Update `test/unit/README.md` if unit tests change

3. **Fix Broken Tests**
   - Update imports if code moves
   - Update mocks if APIs change
   - Update selectors if component structure changes

4. **Add New Tests**
   - Add tests for newly extracted code
   - Ensure coverage doesn't decrease
   - Add integration tests for hook interactions

#### Test Coverage Goals:
- **Unit Tests**: > 80% coverage for utility functions
- **Hook Tests**: > 70% coverage for custom hooks
- **Component Tests**: > 60% coverage for components
- **E2E Tests**: Cover all critical user flows

### Regression Testing

#### Visual Regression Tests
- Use Storybook for visual regression testing
- Compare screenshots before/after refactoring
- Test all graph states (expanded, collapsed, selected, etc.)

#### Performance Regression Tests
- Measure render time before/after refactoring
- Measure memory usage
- Test with large graphs (100+ nodes)
- Ensure no performance degradation

#### Functional Regression Tests
- Run full E2E test suite after each phase
- Test all user interactions
- Test all responsive breakpoints
- Test all pane visibility states

### Test Utilities to Create

#### `test/utils/graphHookTestUtils.ts` (New)
```typescript
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

/**
 * Renders a graph hook with necessary providers
 */
export function renderGraphHook<T>(
  hook: () => T,
  options?: {
    wrapper?: ({ children }: { children: ReactNode }) => JSX.Element;
  }
) {
  // Implementation
}

/**
 * Creates a mock graph ref for testing
 */
export function createMockGraphRef() {
  // Implementation
}

/**
 * Creates mock graph data for testing
 */
export function createMockGraphData() {
  // Implementation
}
```

#### `test/utils/graphComponentTestUtils.tsx` (New)
```typescript
/**
 * Utilities for testing graph components
 */
export function renderGraphComponent(props: GraphRendererProps) {
  // Implementation with all necessary providers
}

export function waitForGraphToStabilize() {
  // Helper to wait for force graph to stabilize
}
```

### E2E Test Updates

#### Minimal Changes Required
E2E tests should require minimal changes because they test the public API. However:

1. **Selector Updates** (if component structure changes)
   - Update canvas selectors if wrapper structure changes
   - Update menu selectors if menu components are extracted

2. **Wait Strategy Updates** (if initialization changes)
   - Update wait times if hook initialization changes
   - Update wait conditions if component mounting changes

3. **Screenshot Updates** (if visual changes)
   - Update baseline screenshots if rendering changes
   - Add new screenshots for new features

#### E2E Test Maintenance
- Keep E2E tests focused on user-facing behavior
- Don't test internal implementation details
- Use page objects if tests become complex
- Add visual regression tests for critical UI states

### Blog Post and Documentation Updates

#### Files That Import Graph Components

**Documentation Files:**
1. **`docs/6-techniques/3-blogging-techniques/1-embed-structural-components/graph.mdx`**
   - Imports: `GraphRenderer`, `NodeRendererDemo`
   - Usage: Component documentation and examples
   - Impact: **High** - Main component documentation

2. **`docs/3-mental-models/6-understanding-the-genai-domain/2025-11-10-ai-framework-landscape.md`**
   - Imports: `AIFrameworkGraph`
   - Usage: Displays AI framework comparison graph
   - Impact: **High** - Live graph visualization

**Blog Posts:**
1. **`blog/2025-03-07-DFS-vs-BFS.md`**
   - May reference graph concepts (needs verification)
   - Impact: **Low** - Likely just mentions, not imports

2. **`blog/2025-09-27-my-contributions.mdx`**
   - May reference graph components (needs verification)
   - Impact: **Low** - Likely just mentions, not imports

#### Import Path Updates Required

When components move to subdirectories, import paths in MDX files need updates:

**Before:**
```mdx
import GraphRenderer from '@site/src/components/Graph/GraphRenderer';
import NodeRendererDemo from '@site/src/components/Graph/NodeRendererDemo';
import AIFrameworkGraph from '@site/src/components/Graph/AIFrameworkGraph';
```

**After (if components move to subdirectories):**
```mdx
// Option 1: If index.tsx is created, no change needed
import GraphRenderer from '@site/src/components/Graph/GraphRenderer';
import NodeRendererDemo from '@site/src/components/Graph/NodeRendererDemo';
import AIFrameworkGraph from '@site/src/components/Graph/AIFrameworkGraph';

// Option 2: If explicit paths are preferred
import GraphRenderer from '@site/src/components/Graph/GraphRenderer/GraphRenderer';
import NodeRendererDemo from '@site/src/components/Graph/NodeRendererDemo/NodeRendererDemo';
import AIFrameworkGraph from '@site/src/components/Graph/AIFrameworkGraph/AIFrameworkGraph';
```

**Recommendation**: Use `index.tsx` files so imports don't need to change.

#### Update Strategy for Blog Posts and Docs

**Phase 0: Before Reorganization**
1. **Audit all imports**
   ```bash
   # Find all files importing Graph components
   grep -r "from '@site/src/components/Graph" blog/ docs/
   ```

2. **Document current import paths**
   - List all files that import Graph components
   - Note which components are imported
   - Create checklist for updates

**Phase 0: During Reorganization**
1. **Update import paths** (if needed)
   - If using `index.tsx`, imports may not need changes
   - If not using `index.tsx`, update all import paths
   - Test each file after updating

2. **Verify components still work**
   - Build Docusaurus site: `make build`
   - Check each page that uses Graph components
   - Verify graphs render correctly
   - Test interactive features (clicking, zooming, etc.)

**After Each Refactoring Phase**
1. **Test affected pages**
   - Rebuild Docusaurus: `make build`
   - Check pages that use Graph components
   - Verify no regressions

2. **Update documentation if needed**
   - Update component documentation if APIs change
   - Update examples if usage patterns change
   - Update README files if structure changes

#### Files to Update Checklist

**Documentation:**
- [ ] `docs/6-techniques/3-blogging-techniques/1-embed-structural-components/graph.mdx`
  - [ ] Update `GraphRenderer` import if path changes
  - [ ] Update `NodeRendererDemo` import if path changes
  - [ ] Verify examples still work
  - [ ] Update documentation if component API changes

- [ ] `docs/3-mental-models/6-understanding-the-genai-domain/2025-11-10-ai-framework-landscape.md`
  - [ ] Update `AIFrameworkGraph` import if path changes
  - [ ] Verify graph renders correctly
  - [ ] Test interactive features

**Blog Posts:**
- [ ] `blog/2025-03-07-DFS-vs-BFS.md`
  - [ ] Check if it actually imports components (may just mention)
  - [ ] Update if needed

- [ ] `blog/2025-09-27-my-contributions.mdx`
  - [ ] Check if it actually imports components (may just mention)
  - [ ] Update if needed

**Other Documentation:**
- [ ] Check all files in `docs/` that mention "graph" or "Graph"
  - [ ] Update import paths if needed
  - [ ] Update examples if component API changes
  - [ ] Update code snippets if usage patterns change

#### Testing Blog Posts and Docs

**After Each Phase:**
1. **Build Docusaurus**
   ```bash
   cd bytesofpurpose-blog
   yarn build
   ```

2. **Check for Build Errors**
   - Look for import errors
   - Look for component not found errors
   - Fix any broken imports

3. **Visual Verification**
   - Start dev server: `yarn start`
   - Navigate to each page that uses Graph components
   - Verify graphs render correctly
   - Test interactive features

4. **Anchor Link Testing**
   - Test URL hash navigation (e.g., `#graph-node-123`)
   - Verify nodes/edges highlight correctly
   - Verify scrolling to graph works

#### Backward Compatibility Strategy

**Goal**: Ensure existing blog posts and docs continue to work without changes.

**Strategy**:
1. **Use index.tsx files** - Allows imports to remain unchanged
2. **Maintain public API** - Don't change component props or behavior
3. **Re-export from root** - Consider re-exporting from `Graph/index.ts` for convenience

**Example re-export file:**
```typescript
// src/components/Graph/index.ts
// Re-export all public components for convenience
export { GraphRenderer } from './GraphRenderer';
export { AIFrameworkGraph } from './AIFrameworkGraph';
export { NodeRendererDemo } from './NodeRendererDemo';
export type { GraphRendererProps } from './GraphRenderer';
```

This allows imports like:
```mdx
import { GraphRenderer, AIFrameworkGraph } from '@site/src/components/Graph';
```

#### Documentation Update Guidelines

**When to Update Documentation:**
- ✅ Component moves to subdirectory (update import paths)
- ✅ Component API changes (update examples)
- ✅ New features added (document new features)
- ✅ Breaking changes (document migration path)
- ❌ Internal refactoring only (no doc updates needed if public API unchanged)

**What to Update:**
1. **Import statements** - If paths change
2. **Code examples** - If API changes
3. **Usage patterns** - If best practices change
4. **Component documentation** - If features change
5. **README files** - If structure changes

**What NOT to Update:**
- Internal implementation details (unless relevant to users)
- File structure (unless it affects imports)
- Utility functions (unless they're part of public API)

### Storybook Story Updates

#### Story Path Updates
When components move to subdirectories, Storybook story paths may need updates:

**Before:**
```typescript
// GraphMenuBar.stories.tsx (at root)
import { Meta } from '@storybook/addon-docs/blocks';
<Meta title="Graph/GraphMenuBar" />
```

**After:**
```typescript
// GraphMenuBar/GraphMenuBar.stories.tsx
import { Meta } from '@storybook/addon-docs/blocks';
<Meta title="Graph/GraphMenuBar" />
// Path stays the same - Storybook uses title, not file path
```

#### Story Co-location Benefits
- Stories live next to components
- Easy to find component documentation
- Stories can import from `./ComponentName` (same directory)
- Better organization in Storybook sidebar

#### Story Import Updates
When components move to subdirectories:

**Before:**
```typescript
// GraphMenuBar.stories.tsx
import { GraphMenuBar } from './GraphMenuBar';
```

**After:**
```typescript
// GraphMenuBar/GraphMenuBar.stories.tsx
import { GraphMenuBar } from './GraphMenuBar'; // Same directory
// OR
import { GraphMenuBar } from '.'; // From index.tsx
```

## Migration Checklist

### Phase 0: Reorganization (Before Refactoring)
- [ ] Create subdirectories for existing components
- [ ] Move component files to subdirectories
- [ ] Create index.tsx files for each component
- [ ] Move stories to component subdirectories
- [ ] Create hooks/ subdirectory
- [ ] Move hooks to hooks/ subdirectory
- [ ] Create hooks/index.ts
- [ ] Create utils/ subdirectory (if needed)
- [ ] Update all imports in GraphRenderer
- [ ] Update all imports in stories
- [ ] Update all imports in tests
- [ ] **Audit blog posts and docs for Graph component imports**
- [ ] **Update import paths in blog posts and docs (if needed)**
- [ ] **Build Docusaurus: `make build`**
- [ ] **Verify all pages with Graph components render correctly**
- [ ] **Test interactive features in blog posts/docs**
- [ ] Run tests: `yarn test`
- [ ] Run E2E tests: `yarn test:e2e`
- [ ] Verify Storybook stories work
- [ ] Update Storybook story paths if needed
- [ ] Test in Docusaurus
- [ ] Code review
- [ ] Merge

### For Each Refactoring Phase:
- [ ] Create new file(s) in appropriate subdirectory
- [ ] Move code to new file(s)
- [ ] Create index.tsx if new component
- [ ] Create stories in component subdirectory
- [ ] Update imports in GraphRenderer
- [ ] Update imports in stories
- [ ] Update imports in tests
- [ ] **Build Docusaurus: `make build`**
- [ ] **Verify blog posts/docs with Graph components still work**
- [ ] **Test interactive features in blog posts/docs**
- [ ] Run tests
- [ ] Check Storybook stories
- [ ] Test in Docusaurus
- [ ] Update documentation (if API changes)
- [ ] Code review
- [ ] Merge

## Success Criteria

1. ✅ GraphRenderer.tsx reduced to < 500 lines
2. ✅ All existing functionality preserved
3. ✅ No performance degradation
4. ✅ All tests passing
5. ✅ Storybook stories working
6. ✅ Docusaurus integration working
7. ✅ Code review approved
8. ✅ Documentation updated

## Notes

- **Incremental Approach**: Each phase is independent and can be merged separately
- **Backward Compatibility**: Maintain existing public API
- **Type Safety**: Ensure all extracted code is properly typed
- **Performance**: Monitor for any performance regressions
- **Documentation**: Update JSDoc comments as code moves

## Potential Challenges

1. **Circular Dependencies**: Watch for circular imports between utilities
2. **Hook Dependencies**: Ensure all hook dependencies are correctly passed
3. **Ref Management**: Graph ref needs careful handling across hooks
4. **State Synchronization**: Ensure state updates don't cause infinite loops
5. **Event Handler Context**: Ensure event handlers have correct context

## Future Improvements (Post-Refactoring)

1. Consider extracting ForceGraph2D wrapper to separate component
2. Consider using React Context for graph state (if needed)
3. Consider memoization optimizations
4. Consider TypeScript strict mode improvements
5. Consider adding more comprehensive error boundaries

## Execution Results / Attempts

_This section will be updated as the refactoring progresses. It will document what was actually done, any challenges encountered, deviations from the plan, and lessons learned._

### Status: Not Started

Execution has not yet begun. This section will be updated when work commences.

