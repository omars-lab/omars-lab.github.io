/**
 * ============================================================================
 * Graph Component Architecture Stories
 * ============================================================================
 * Storybook stories documenting the Graph component architecture.
 * ============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Graph/Architecture',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Graph Component Architecture

The Graph component system is split into multiple focused components and hooks for better maintainability.

## Component Structure

### Components

1. **GraphMenuBar** - Menu bar with control buttons
   - Center, Expand All, Collapse All, Toggle Pane
   - Located at: \`GraphMenuBar.tsx\`

2. **GraphInfoPanel** - Side panel for node/edge information
   - Displays selected node/edge details
   - Shows connections, external links, documentation
   - Located at: \`GraphInfoPanel.tsx\`

3. **GraphCanvas** - ForceGraph2D wrapper
   - Handles canvas rendering
   - Manages graph visualization
   - Located at: \`GraphCanvas.tsx\`

### Hooks

1. **useGraphState** - State management
   - Manages expanded nodes, selections, highlights
   - Located at: \`useGraphState.ts\`

2. **useGraphData** - Data transformation
   - Flattens hierarchical nodes based on expansion
   - Located at: \`useGraphData.ts\`

3. **useGraphInteractions** - Event handlers
   - Node/edge click handlers
   - Drag and zoom handlers
   - Located at: \`useGraphInteractions.ts\`

### Utility Files

- **GraphDataUtils.ts** - Tree traversal, data cleaning
- **GraphNodeUtils.ts** - Node properties, styling
- **GraphRenderingUtils.ts** - Rendering calculations
- **GraphTextUtils.ts** - Text processing, wrapping

## Component Composition

\`\`\`tsx
GraphRenderer
  └── GraphRendererImpl
      ├── GraphCanvas (ForceGraph2D)
      ├── GraphInfoPanel
      └── GraphMenuBar
\`\`\`

## Benefits

- **Separation of Concerns**: Each component has a single responsibility
- **Reusability**: Components can be used independently
- **Testability**: Easier to unit test individual components
- **Maintainability**: Smaller, focused files are easier to understand
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Component architecture overview showing how components work together.
 */
export const Architecture: Story = {
  render: () => (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Graph Component Architecture</h1>
      <p>
        The Graph component system is split into focused components and hooks for better maintainability.
      </p>
      
      <h2>Components</h2>
      <ul>
        <li><strong>GraphMenuBar</strong> - Menu bar with control buttons</li>
        <li><strong>GraphInfoPanel</strong> - Side panel for node/edge information</li>
        <li><strong>GraphCanvas</strong> - ForceGraph2D wrapper for canvas rendering</li>
      </ul>
      
      <h2>Hooks</h2>
      <ul>
        <li><strong>useGraphState</strong> - State management</li>
        <li><strong>useGraphData</strong> - Data transformation</li>
        <li><strong>useGraphInteractions</strong> - Event handlers</li>
      </ul>
      
      <h2>Utilities</h2>
      <ul>
        <li><strong>GraphDataUtils</strong> - Tree traversal, data cleaning</li>
        <li><strong>GraphNodeUtils</strong> - Node properties, styling</li>
        <li><strong>GraphRenderingUtils</strong> - Rendering calculations</li>
        <li><strong>GraphTextUtils</strong> - Text processing, wrapping</li>
      </ul>
    </div>
  ),
};

/**
 * For detailed examples of individual components, see:
 * - GraphMenuBar stories: Graph/GraphMenuBar
 * - GraphInfoPanel stories: Graph/GraphInfoPanel
 * - GraphCanvas stories: Graph/GraphCanvas
 */

