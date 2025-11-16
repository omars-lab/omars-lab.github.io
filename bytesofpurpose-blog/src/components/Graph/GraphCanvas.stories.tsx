/**
 * ============================================================================
 * GraphCanvas Stories
 * ============================================================================
 * Storybook stories for the GraphCanvas component.
 * 
 * Note: This component requires ForceGraph2D which is browser-only.
 * Stories may require BrowserOnly wrapper or mocking in Storybook.
 * ============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useRef } from 'react';
import { GraphCanvas, GraphCanvasProps } from './GraphCanvas';

// Mock ForceGraph2D for Storybook
const MockForceGraph2D = React.forwardRef<any, any>((props, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: props.width || 800,
        height: props.height || 600,
        backgroundColor: props.backgroundColor || '#ffffff',
        border: '2px dashed #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '14px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div>ForceGraph2D Mock</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          Nodes: {props.graphData?.nodes?.length || 0}
          <br />
          Links: {props.graphData?.links?.length || 0}
        </div>
      </div>
    </div>
  );
});
MockForceGraph2D.displayName = 'MockForceGraph2D';

// Mock node renderer
const mockNodeRenderer = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
  // Mock implementation - in real usage this draws on canvas
};

// Mock link renderer
const mockLinkCanvasObject = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
  // Mock implementation - in real usage this draws on canvas
};

const meta: Meta<typeof GraphCanvas> = {
  title: 'Graph/GraphCanvas',
  component: GraphCanvas,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
GraphCanvas is a wrapper component for ForceGraph2D that handles canvas rendering.

**Note**: This component requires browser-only dependencies (ForceGraph2D, canvas APIs).
In Storybook, we use a mock implementation. In real usage, this component renders
an interactive force-directed graph.

## Props

- \`ForceGraph2D\` - The ForceGraph2D component (browser-only)
- \`graphData\` - Graph data with nodes and links
- \`width\` / \`height\` - Canvas dimensions
- \`backgroundColor\` - Background color
- \`nodeRenderer\` - Custom node rendering function
- \`linkCanvasObject\` - Custom link rendering function
- Event handlers: \`onNodeClick\`, \`onLinkClick\`, etc.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GraphCanvas>;

const defaultGraphData = {
  nodes: [
    { id: '1', label: 'Node 1', hasChildren: false },
    { id: '2', label: 'Node 2', hasChildren: false },
    { id: '3', label: 'Node 3', hasChildren: true },
  ],
  links: [
    { id: '1-2', source: '1', target: '2', value: 1 },
    { id: '2-3', source: '2', target: '3', value: 1 },
  ],
};

/**
 * Default GraphCanvas with basic graph data.
 */
export const Default: Story = {
  args: {
    ForceGraph2D: MockForceGraph2D,
    graphData: defaultGraphData,
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    linkColor: '#999',
    arrowColor: '#666',
    nodeBorderColor: '#333',
    highlightedNodeId: null,
    highlightedEdgeId: null,
    selectedNode: null,
    expandedNodes: new Set(),
    isDarkMode: false,
    graphRef: { current: null },
    nodeRenderer: mockNodeRenderer,
    linkCanvasObjectMode: () => 'replace',
    linkCanvasObject: mockLinkCanvasObject,
    onNodeClick: () => {},
    onNodeRightClick: () => {},
    onLinkClick: () => {},
    onLinkRightClick: () => {},
    onNodeDrag: () => {},
    onNodeDragEnd: () => {},
    onZoom: () => {},
  } as GraphCanvasProps,
};

/**
 * GraphCanvas in dark mode.
 */
export const DarkMode: Story = {
  args: {
    ...Default.args,
    backgroundColor: '#1a1a1a',
    linkColor: '#666',
    arrowColor: '#888',
    nodeBorderColor: '#aaa',
    isDarkMode: true,
  } as GraphCanvasProps,
};

/**
 * GraphCanvas with highlighted node.
 */
export const HighlightedNode: Story = {
  args: {
    ...Default.args,
    highlightedNodeId: '2',
  } as GraphCanvasProps,
};

/**
 * GraphCanvas with highlighted edge.
 */
export const HighlightedEdge: Story = {
  args: {
    ...Default.args,
    highlightedEdgeId: '1-2',
  } as GraphCanvasProps,
};

/**
 * GraphCanvas with expanded nodes.
 */
export const WithExpandedNodes: Story = {
  args: {
    ...Default.args,
    expandedNodes: new Set(['3']),
  } as GraphCanvasProps,
};

/**
 * GraphCanvas with selected node.
 */
export const WithSelectedNode: Story = {
  args: {
    ...Default.args,
    selectedNode: defaultGraphData.nodes[0],
  } as GraphCanvasProps,
};

