/**
 * ============================================================================
 * NodeRendererDemo Stories
 * ============================================================================
 * Storybook stories for the NodeRendererDemo component.
 * 
 * This component demonstrates how NodeRenderer renders nodes at different
 * zoom levels and with different properties.
 * ============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import NodeRendererDemo from './NodeRendererDemo';

const meta: Meta<typeof NodeRendererDemo> = {
  title: 'Graph/NodeRendererDemo',
  component: NodeRendererDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
NodeRendererDemo showcases how the NodeRenderer class renders individual nodes
at different zoom levels and configurations.

## Features

- **Zoom Level Testing**: Shows how node rendering changes at different zoom levels
- **Parent vs Child Nodes**: Demonstrates visual differences between parent and child nodes
- **Title Length Testing**: Shows how long titles are handled
- **Color Customization**: Demonstrates different node colors
- **Dark Mode Support**: Adapts to theme color mode

## Use Cases

- Testing node rendering at different zoom levels
- Demonstrating title wrapping and truncation
- Showing visual differences between node types
- Documenting NodeRenderer behavior
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Node title text',
    },
    zoomLevel: {
      control: { type: 'number', min: 0.1, max: 3, step: 0.1 },
      description: 'Zoom level for rendering',
    },
    isParent: {
      control: 'boolean',
      description: 'Whether this is a parent node (has children)',
    },
    color: {
      control: 'color',
      description: 'Node color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NodeRendererDemo>;

/**
 * Default node at normal zoom level.
 */
export const Default: Story = {
  args: {
    title: 'Example Node',
    zoomLevel: 1.0,
    isParent: false,
    color: '#68BDF6',
  },
};

/**
 * Parent node (has children indicator).
 */
export const ParentNode: Story = {
  args: {
    title: 'Parent Node',
    zoomLevel: 1.0,
    isParent: true,
    color: '#68BDF6',
  },
};

/**
 * Child node (no children indicator).
 */
export const ChildNode: Story = {
  args: {
    title: 'Child Node',
    zoomLevel: 1.0,
    isParent: false,
    color: '#60BE86',
  },
};

/**
 * Node at low zoom level (zoomed out).
 */
export const LowZoom: Story = {
  args: {
    title: 'Low Zoom Node',
    zoomLevel: 0.5,
    isParent: false,
    color: '#68BDF6',
  },
};

/**
 * Node at high zoom level (zoomed in).
 */
export const HighZoom: Story = {
  args: {
    title: 'High Zoom Node',
    zoomLevel: 2.0,
    isParent: false,
    color: '#68BDF6',
  },
};

/**
 * Node with short title.
 */
export const ShortTitle: Story = {
  args: {
    title: 'Short',
    zoomLevel: 1.0,
    isParent: false,
    color: '#68BDF6',
  },
};

/**
 * Node with medium-length title.
 */
export const MediumTitle: Story = {
  args: {
    title: 'Medium Length Node Title',
    zoomLevel: 1.0,
    isParent: false,
    color: '#68BDF6',
  },
};

/**
 * Node with very long title to test wrapping.
 */
export const LongTitle: Story = {
  args: {
    title: 'This is a very long node title that should wrap or truncate appropriately',
    zoomLevel: 1.0,
    isParent: false,
    color: '#68BDF6',
  },
};

/**
 * Node with custom color.
 */
export const CustomColor: Story = {
  args: {
    title: 'Custom Color Node',
    zoomLevel: 1.0,
    isParent: false,
    color: '#FF6B6B',
  },
};

/**
 * Multiple nodes at different zoom levels for comparison.
 */
export const ZoomComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
      <NodeRendererDemo title="Zoom 0.5x" zoomLevel={0.5} />
      <NodeRendererDemo title="Zoom 1.0x" zoomLevel={1.0} />
      <NodeRendererDemo title="Zoom 1.5x" zoomLevel={1.5} />
      <NodeRendererDemo title="Zoom 2.0x" zoomLevel={2.0} />
    </div>
  ),
};

/**
 * Parent vs child node comparison.
 */
export const ParentVsChild: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
      <NodeRendererDemo title="Parent Node" isParent={true} color="#68BDF6" />
      <NodeRendererDemo title="Child Node" isParent={false} color="#60BE86" />
    </div>
  ),
};

/**
 * Title length comparison.
 */
export const TitleLengthComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
      <NodeRendererDemo title="Short" />
      <NodeRendererDemo title="Medium Length Title" />
      <NodeRendererDemo title="This is a very long node title that demonstrates how text wrapping works" />
    </div>
  ),
};

