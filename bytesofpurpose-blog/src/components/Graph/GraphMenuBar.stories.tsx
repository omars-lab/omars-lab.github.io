/**
 * ============================================================================
 * GraphMenuBar Stories
 * ============================================================================
 * Storybook stories for the GraphMenuBar component.
 * ============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { GraphMenuBar } from './GraphMenuBar';

const meta: Meta<typeof GraphMenuBar> = {
  title: 'Graph/GraphMenuBar',
  component: GraphMenuBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Menu bar component with controls for graph navigation and expansion. Provides buttons for centering the graph, expanding/collapsing nodes, and toggling the info panel.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onCenter: { action: 'centered' },
    onExpandAll: { action: 'expand-all' },
    onCollapseAll: { action: 'collapse-all' },
    onTogglePane: { action: 'toggle-pane' },
    paneVisible: { control: 'boolean' },
    isDarkMode: { control: 'boolean' },
    menuBarHeight: { control: { type: 'number', min: 30, max: 60, step: 5 } },
  },
};

export default meta;
type Story = StoryObj<typeof GraphMenuBar>;

/**
 * Default menu bar in light mode.
 */
export const Default: Story = {
  args: {
    paneVisible: true,
    isDarkMode: false,
    menuBarHeight: 40,
  },
};

/**
 * Menu bar in dark mode.
 */
export const DarkMode: Story = {
  args: {
    paneVisible: true,
    isDarkMode: true,
    menuBarHeight: 40,
  },
};

/**
 * Menu bar with pane hidden.
 */
export const PaneHidden: Story = {
  args: {
    paneVisible: false,
    isDarkMode: false,
    menuBarHeight: 40,
  },
};

/**
 * Menu bar with custom height.
 */
export const CustomHeight: Story = {
  args: {
    paneVisible: true,
    isDarkMode: false,
    menuBarHeight: 50,
  },
};

