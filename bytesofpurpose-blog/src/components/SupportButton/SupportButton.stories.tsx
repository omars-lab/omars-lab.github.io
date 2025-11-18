import type { Meta, StoryObj } from '@storybook/react';
import { Support } from './index';

const meta = {
  title: 'Components/SupportButton',
  component: Support,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SupportButton component provides a PayPal donation form button.
This allows users to support the developer through PayPal donations.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Support>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Support />,
};

