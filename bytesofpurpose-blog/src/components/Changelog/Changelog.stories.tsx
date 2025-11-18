import type { Meta, StoryObj } from '@storybook/react';
import { Changelog } from './Changelog';
import type { ChangelogEntry } from './types';

const meta: Meta<typeof Changelog> = {
  title: 'Changelog/Changelog',
  component: Changelog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The Changelog component displays changelog entries in a visual heatmap format with horizontal scrolling quarter lists.

See the Structure story for detailed documentation about the component's layout and behavior.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Changelog>;

const sampleEntries: ChangelogEntry[] = [
  {
    title: 'Graph Component Refactoring Summary',
    description: 'Summary of completed Graph component refactoring work',
    status: 'completed',
    inception_date: '2025-11-17',
    execution_date: '2025-11-17',
    type: 'refactoring',
    component: 'Graph',
    priority: 'high',
    category: 'development',
    slug: '2025-11-17-graph-component-refactoring-summary',
  },
  {
    title: 'Graph Component Architecture Documentation',
    description: 'Documentation of the Graph component system architecture',
    status: 'completed',
    inception_date: '2025-11-17',
    execution_date: '2025-11-17',
    type: 'documentation',
    component: 'Graph',
    priority: 'medium',
    category: 'development',
    slug: '2025-11-17-graph-component-architecture',
  },
  {
    title: 'New Blog Post: Knowledge Agents Design',
    description: 'Published blog post about knowledge agents design patterns',
    status: 'completed',
    inception_date: '2025-01-15',
    execution_date: '2025-01-20',
    type: 'feature',
    component: 'Blog',
    priority: 'medium',
    category: 'content',
    slug: '2025-01-15-content-post-knowledge-agents-design',
  },
  {
    title: 'GraphRenderer Component Refactoring Plan',
    description: 'Comprehensive plan to refactor the 3382-line GraphRenderer.tsx into smaller, composable components and utilities',
    status: 'planned',
    inception_date: '2025-11-17',
    execution_date: 'TBD',
    type: 'refactoring',
    component: 'GraphRenderer',
    priority: 'high',
    category: 'development',
    slug: '2025-12-XX-graph-renderer-refactoring-plan',
  },
  {
    title: 'New Feature Implementation',
    description: 'Added new feature for better user experience',
    status: 'in-progress',
    inception_date: '2025-10-15',
    execution_date: 'TBD',
    type: 'feature',
    component: 'UserInterface',
    priority: 'high',
    category: 'development',
    slug: '2025-10-15-new-feature',
  },
  {
    title: 'Bug Fix: Memory Leak',
    description: 'Fixed memory leak in data processing pipeline',
    status: 'completed',
    inception_date: '2025-09-20',
    execution_date: '2025-09-22',
    type: 'bugfix',
    component: 'DataProcessor',
    priority: 'critical',
    category: 'development',
    slug: '2025-09-22-memory-leak-fix',
  },
];

export const Default: Story = {
  args: {
    entries: sampleEntries,
    getEntryUrl: (slug) => `/changelog/${slug}`,
  },
};

export const SingleEntry: Story = {
  args: {
    entries: [sampleEntries[0]],
    getEntryUrl: (slug) => `/changelog/${slug}`,
  },
};

export const ManyEntries: Story = {
  args: {
    entries: [
      ...sampleEntries,
      {
        title: 'Q1 2025 Entry 1',
        description: 'First quarter entry',
        status: 'completed',
        inception_date: '2025-01-15',
        execution_date: '2025-01-20',
        type: 'feature',
        priority: 'medium',
        category: 'development',
        slug: '2025-01-15-q1-entry-1',
      },
      {
        title: 'Q2 2025 Entry 1',
        description: 'Second quarter entry',
        status: 'completed',
        inception_date: '2025-04-10',
        execution_date: '2025-04-15',
        type: 'feature',
        priority: 'low',
        category: 'content',
        slug: '2025-04-10-q2-entry-1',
      },
      {
        title: 'Q3 2025 Entry 1',
        description: 'Third quarter entry',
        status: 'in-progress',
        inception_date: '2025-07-05',
        execution_date: 'TBD',
        type: 'refactoring',
        priority: 'high',
        category: 'development',
        slug: '2025-07-05-q3-entry-1',
      },
    ],
    getEntryUrl: (slug) => `/changelog/${slug}`,
  },
};

export const ContentOnly: Story = {
  args: {
    entries: sampleEntries.filter(e => e.category === 'content'),
    getEntryUrl: (slug) => `/changelog/${slug}`,
  },
};

export const DevelopmentOnly: Story = {
  args: {
    entries: sampleEntries.filter(e => e.category === 'development'),
    getEntryUrl: (slug) => `/changelog/${slug}`,
  },
};

