/**
 * ============================================================================
 * AIFrameworkGraph Stories
 * ============================================================================
 * Storybook stories for the AIFrameworkGraph component.
 * 
 * This component is a specialized wrapper around GraphRenderer that displays
 * AI framework comparison data with categories and differentiating edges.
 * ============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import AIFrameworkGraph from './AIFrameworkGraph';

const meta: Meta<typeof AIFrameworkGraph> = {
  title: 'Graph/AIFrameworkGraph',
  component: AIFrameworkGraph,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
AIFrameworkGraph is a specialized implementation of GraphRenderer that displays
AI framework and technology comparison data.

## Features

- **Category Grouping**: Technologies are grouped by category (frameworks, libraries, platforms, etc.)
- **Comparison Edges**: Shows "vs." relationships between technologies
- **Differentiating Edges**: Highlights differences and similarities between compared technologies
- **Auto-expanded Categories**: Category nodes are expanded by default
- **Dark Mode Support**: Adapts to theme color mode

## Data Structure

The component expects \`FrameworkData\` with:
- \`data\`: Record of technology data with category, use cases, features, etc.
- \`processed_technologies\`: List of processed tech names
- \`queue\` / \`enhanced_queue\`: Processing queues

## Usage

\`\`\`tsx
<AIFrameworkGraph data={frameworkData} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock framework data for stories
const mockFrameworkData = {
  processed_technologies: ['LangChain', 'LlamaIndex', 'AutoGPT'],
  queue: [],
  enhanced_queue: [],
  data: {
    LangChain: {
      category: 'framework',
      main_use_case: 'Building LLM applications with chains',
      compared_with: ['LlamaIndex'],
      key_features: ['Chains', 'Agents', 'Memory', 'Tools'],
      differentiators: 'Focus on composable chains and agent workflows',
      key_links: ['https://langchain.com'],
    },
    LlamaIndex: {
      category: 'framework',
      main_use_case: 'Building RAG applications',
      compared_with: ['LangChain'],
      key_features: ['Data Connectors', 'Indexing', 'Querying', 'Retrieval'],
      differentiators: 'Specialized for retrieval-augmented generation',
      key_links: ['https://llamaindex.ai'],
    },
    AutoGPT: {
      category: 'multi_agent_framework',
      main_use_case: 'Autonomous AI agents',
      compared_with: [],
      key_features: ['Autonomy', 'Goal Setting', 'Task Planning'],
      differentiators: 'Fully autonomous agent execution',
      key_links: ['https://autogpt.net'],
    },
  },
};

const largerMockData = {
  processed_technologies: ['LangChain', 'LlamaIndex', 'AutoGPT', 'CrewAI', 'Haystack'],
  queue: [],
  enhanced_queue: [],
  data: {
    LangChain: {
      category: 'framework',
      main_use_case: 'Building LLM applications with chains',
      compared_with: ['LlamaIndex', 'Haystack'],
      key_features: ['Chains', 'Agents', 'Memory', 'Tools'],
      differentiators: 'Focus on composable chains and agent workflows',
      key_links: ['https://langchain.com'],
    },
    LlamaIndex: {
      category: 'framework',
      main_use_case: 'Building RAG applications',
      compared_with: ['LangChain'],
      key_features: ['Data Connectors', 'Indexing', 'Querying', 'Retrieval'],
      differentiators: 'Specialized for retrieval-augmented generation',
      key_links: ['https://llamaindex.ai'],
    },
    AutoGPT: {
      category: 'multi_agent_framework',
      main_use_case: 'Autonomous AI agents',
      compared_with: ['CrewAI'],
      key_features: ['Autonomy', 'Goal Setting', 'Task Planning'],
      differentiators: 'Fully autonomous agent execution',
      key_links: ['https://autogpt.net'],
    },
    CrewAI: {
      category: 'multi_agent_framework',
      main_use_case: 'Multi-agent collaboration',
      compared_with: ['AutoGPT'],
      key_features: ['Role-based Agents', 'Collaboration', 'Task Delegation'],
      differentiators: 'Role-based agent teams with collaboration',
      key_links: ['https://crewai.com'],
    },
    Haystack: {
      category: 'framework',
      main_use_case: 'End-to-end NLP pipelines',
      compared_with: ['LangChain'],
      key_features: ['Pipelines', 'Document Stores', 'Retrievers', 'Readers'],
      differentiators: 'Production-ready NLP pipeline framework',
      key_links: ['https://haystack.deepset.ai'],
    },
  },
};

/**
 * Basic AI framework graph with minimal data.
 */
export const Basic: Story = {
  args: {
    data: mockFrameworkData,
  },
};

/**
 * AI framework graph with more technologies and comparisons.
 */
export const WithMultipleTechnologies: Story = {
  args: {
    data: largerMockData,
  },
};

/**
 * Empty state - no data.
 */
export const EmptyState: Story = {
  args: {
    data: {
      processed_technologies: [],
      queue: [],
      enhanced_queue: [],
      data: {},
    },
  },
};

/**
 * Single technology with no comparisons.
 */
export const SingleTechnology: Story = {
  args: {
    data: {
      processed_technologies: ['LangChain'],
      queue: [],
      enhanced_queue: [],
      data: {
        LangChain: {
          category: 'framework',
          main_use_case: 'Building LLM applications',
          compared_with: [],
          key_features: ['Chains', 'Agents'],
          differentiators: 'Composable chains',
          key_links: [],
        },
      },
    },
  },
};

