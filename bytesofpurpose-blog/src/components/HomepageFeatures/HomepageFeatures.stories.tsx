import type { Meta, StoryObj } from '@storybook/react';
import HomepageFeatures from './index';
import { BrowserOnlyMock } from '../../stories/mocks/BrowserOnlyMock';

const meta = {
  title: 'Components/HomepageFeatures',
  component: HomepageFeatures,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
HomepageFeatures component displays a grid of feature cards on the homepage.
Each feature includes an image, title, description, and a link button.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserOnlyMock>
        <Story />
      </BrowserOnlyMock>
    ),
  ],
} satisfies Meta<typeof HomepageFeatures>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <HomepageFeatures />,
};

