import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Vote } from './index';

const meta = {
  title: 'Components/VoteButton',
  component: Vote,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
VoteButton component provides a styled button for voting on blog posts.
Uses the FancyButton styles with gradient background animation.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Button label text',
    },
    color: {
      control: 'color',
      description: 'Optional color override (currently not applied)',
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof Vote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Vote',
  },
};

export const WithText: Story = {
  args: {
    children: 'Vote for this post',
  },
};

export const ThumbsUp: Story = {
  args: {
    children: '👍 Vote',
  },
};

export const MultipleButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', alignItems: 'center' }}>
      <Vote>Vote for Feature A</Vote>
      <Vote>Vote for Feature B</Vote>
      <Vote>👍 Like this post</Vote>
    </div>
  ),
};

