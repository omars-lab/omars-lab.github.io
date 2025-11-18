import type { Meta, StoryObj } from '@storybook/react';
import { FancyButton } from './index';

const meta = {
  title: 'Components/FancyButton',
  component: FancyButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
FancyButton is a styled button component with a gradient background animation on hover.
Based on the design from https://codepen.io/merkund/pen/EGpOEr
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
  },
} satisfies Meta<typeof FancyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click Me',
  },
};

export const WithText: Story = {
  args: {
    children: 'Fancy Button',
  },
};

export const LongText: Story = {
  args: {
    children: 'This is a longer button text',
  },
};

