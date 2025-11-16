# Storybook Guide for Graph Components

## Overview

Storybook provides interactive documentation for all Graph components, making it easy to understand the component architecture and test components in isolation.

## Running Storybook

```bash
# Start Storybook development server
npm run storybook
# or
yarn storybook

# Build static Storybook
npm run build-storybook
# or
yarn build-storybook
```

Storybook will be available at `http://localhost:6006`

## Available Stories

### 1. Graph/GraphMenuBar

Documentation and examples for the menu bar component.

**Stories:**
- **Default** - Menu bar in light mode with pane visible
- **DarkMode** - Menu bar in dark mode
- **PaneHidden** - Menu bar when pane is hidden
- **CustomHeight** - Menu bar with custom height

**Props Documented:**
- `onCenter` - Center graph callback
- `onExpandAll` - Expand all nodes callback
- `onCollapseAll` - Collapse all nodes callback
- `onTogglePane` - Toggle pane visibility callback
- `paneVisible` - Current pane visibility state
- `isDarkMode` - Dark mode flag
- `menuBarHeight` - Height of the menu bar

### 2. Graph/GraphInfoPanel

Documentation and examples for the info panel component.

**Stories:**
- **EmptyState** - Panel when no node/edge is selected
- **NodeSelected** - Panel showing node information
- **EdgeSelected** - Panel showing edge information
- **DarkMode** - Panel in dark mode
- **DifferentiatingEdge** - Panel showing comparison edge details

**Props Documented:**
- `selectedNode` - Currently selected node
- `selectedEdge` - Currently selected edge
- `graphData` - Graph data object
- `expandedNodes` - Set of expanded node IDs
- `graphRef` - Reference to graph instance
- `graphId` - Graph identifier
- `isDarkMode` - Dark mode flag
- `height` - Panel height
- `onNodeClick` - Node click handler
- `onExpandNode` - Node expansion handler

### 3. Graph/Architecture

Overview of the component architecture and how components work together.

**Stories:**
- **Architecture** - Complete architecture overview
- **MenuBarExample** - Interactive menu bar example
- **InfoPanelExample** - Interactive info panel example

## Component Documentation

Each story includes:
- **Description** - What the component does
- **Props Table** - All available props with types and descriptions
- **Examples** - Interactive examples showing different states
- **Source Code** - View the component source code
- **Controls** - Interactive controls to modify props

## Using Stories for Development

### Testing Components in Isolation

1. Open Storybook
2. Navigate to the component you want to test
3. Use controls to modify props
4. See changes in real-time

### Understanding Component API

1. Open a component story
2. View the "Docs" tab
3. See all props with descriptions
4. View usage examples

### Debugging

1. Use Storybook's addons (Actions, Interactions)
2. See event handlers fire in the Actions panel
3. Test edge cases with different prop combinations

## Story Structure

Each story file follows this pattern:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Graph/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Component description...',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Prop documentation
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

## Best Practices

1. **Document All Props** - Use `argTypes` to document every prop
2. **Provide Examples** - Show different use cases
3. **Include Edge Cases** - Test boundary conditions
4. **Use Controls** - Make props interactive when possible
5. **Add Descriptions** - Explain what each component does

## Adding New Stories

To add a new story:

1. Create `ComponentName.stories.tsx` in the Graph directory
2. Follow the story structure pattern
3. Add multiple stories for different states
4. Document all props in `argTypes`
5. Add descriptions in `parameters.docs`

## Integration with Development

Storybook stories can be used for:
- **Component Development** - Develop components in isolation
- **Design Review** - Share components with designers
- **Documentation** - Living documentation for the codebase
- **Testing** - Visual regression testing
- **Onboarding** - Help new developers understand components

