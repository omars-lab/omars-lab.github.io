/**
 * ============================================================================
 * GraphInfoPanel Stories
 * ============================================================================
 * Storybook stories for the GraphInfoPanel component.
 * ============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { GraphInfoPanel } from './GraphInfoPanel';
import React, { useRef } from 'react';

const meta: Meta<typeof GraphInfoPanel> = {
  title: 'Graph/GraphInfoPanel',
  component: GraphInfoPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Side panel component displaying detailed information about selected nodes or edges. Shows connections, external links, and documentation references.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isDarkMode: { control: 'boolean' },
    height: { control: { type: 'number', min: 200, max: 1000, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<typeof GraphInfoPanel>;

const mockGraphData = {
  nodes: [
    { id: 'node1', title: 'Node 1', name: 'Node 1', description: 'This is node 1', hasChildren: true },
    { id: 'node2', title: 'Node 2', name: 'Node 2', description: 'This is node 2', hasChildren: false },
    { id: 'node3', title: 'Node 3', name: 'Node 3', description: 'This is node 3', hasChildren: false },
  ],
  links: [
    { id: 'link1', source: 'node1', target: 'node2', label: 'connects to' },
    { id: 'link2', source: 'node2', target: 'node3', label: 'leads to' },
  ],
};

const MockWrapper = ({ children, ...props }: any) => {
  const graphRef = useRef(null);
  return (
    <div style={{ display: 'flex', width: '100%', height: '600px' }}>
      <div style={{ flex: 1, backgroundColor: '#f0f0f0', padding: '20px' }}>
        <p>Graph Canvas Area (Mock)</p>
      </div>
      {React.cloneElement(children, { ...props, graphRef })}
    </div>
  );
};

/**
 * Empty state when no node or edge is selected.
 */
export const EmptyState: Story = {
  args: {
    selectedNode: null,
    selectedEdge: null,
    graphData: mockGraphData,
    expandedNodes: new Set(),
    graphId: 'test-graph',
    isDarkMode: false,
    height: 600,
    onNodeClick: () => {},
    onExpandNode: () => {},
  },
  decorators: [
    (Story) => (
      <MockWrapper>
        <Story />
      </MockWrapper>
    ),
  ],
};

/**
 * Panel showing node information.
 */
export const NodeSelected: Story = {
  args: {
    selectedNode: {
      id: 'node1',
      title: 'Example Node',
      name: 'Example Node',
      description: 'This is an example node with a description that explains what it represents in the graph.',
      markdownSection: 'example-section',
      keyLinks: ['https://github.com/example', 'https://docs.example.com'],
    },
    selectedEdge: null,
    graphData: mockGraphData,
    expandedNodes: new Set(['node1']),
    graphId: 'test-graph',
    isDarkMode: false,
    height: 600,
    onNodeClick: () => {},
    onExpandNode: () => {},
  },
  decorators: [
    (Story) => (
      <MockWrapper>
        <Story />
      </MockWrapper>
    ),
  ],
};

/**
 * Panel showing edge information.
 */
export const EdgeSelected: Story = {
  args: {
    selectedNode: null,
    selectedEdge: {
      id: 'link1',
      source: 'node1',
      target: 'node2',
      label: 'Example Edge',
      markdownSection: 'example-edge-section',
    },
    graphData: mockGraphData,
    expandedNodes: new Set(),
    graphId: 'test-graph',
    isDarkMode: false,
    height: 600,
    onNodeClick: () => {},
    onExpandNode: () => {},
  },
  decorators: [
    (Story) => (
      <MockWrapper>
        <Story />
      </MockWrapper>
    ),
  ],
};

/**
 * Panel in dark mode.
 */
export const DarkMode: Story = {
  args: {
    selectedNode: {
      id: 'node1',
      title: 'Example Node',
      name: 'Example Node',
      description: 'This is an example node in dark mode.',
    },
    selectedEdge: null,
    graphData: mockGraphData,
    expandedNodes: new Set(),
    graphId: 'test-graph',
    isDarkMode: true,
    height: 600,
    onNodeClick: () => {},
    onExpandNode: () => {},
  },
  decorators: [
    (Story) => (
      <MockWrapper>
        <Story />
      </MockWrapper>
    ),
  ],
};

/**
 * Panel showing differentiating edge with comparison details.
 */
export const DifferentiatingEdge: Story = {
  args: {
    selectedNode: null,
    selectedEdge: {
      id: 'diff-link',
      source: 'node1',
      target: 'node2',
      type: 'differentiating',
      label: 'Comparison',
      sourceData: {
        key_features: ['Feature A', 'Feature B', 'Feature C'],
        main_use_case: 'Use case for source',
        differentiators: 'Source differentiator',
      },
      targetData: {
        key_features: ['Feature X', 'Feature Y'],
        main_use_case: 'Use case for target',
        differentiators: 'Target differentiator',
      },
      similarities: ['Similarity 1', 'Similarity 2'],
      differences: {
        source: ['Source only feature'],
        target: ['Target only feature'],
      },
    },
    graphData: mockGraphData,
    expandedNodes: new Set(),
    graphId: 'test-graph',
    isDarkMode: false,
    height: 600,
    onNodeClick: () => {},
    onExpandNode: () => {},
  },
  decorators: [
    (Story) => (
      <MockWrapper>
        <Story />
      </MockWrapper>
    ),
  ],
};

