import type { Meta, StoryObj } from '@storybook/react';
import { Highlight } from './index';

const meta = {
  title: 'Components/Highlighters',
  component: Highlight,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Highlight component provides a styled mark element with a gradient background and optional label.
Useful for emphasizing text in blog posts and documentation.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Text content to highlight',
    },
    label: {
      control: 'text',
      description: 'Optional uppercase label displayed after the highlighted text',
    },
  },
} satisfies Meta<typeof Highlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is highlighted text',
    label: 'NEW',
  },
};

export const WithoutLabel: Story = {
  args: {
    children: 'Highlighted text without label',
  },
};

export const WithCustomLabel: Story = {
  args: {
    children: 'Important information',
    label: 'IMPORTANT',
  },
};

export const InParagraph: Story = {
  render: () => (
    <p>
      This is a paragraph with <Highlight label="NEW">new content</Highlight> that is highlighted,
      and here's some <Highlight label="TIP">additional text</Highlight> with a tip label.
    </p>
  ),
};

