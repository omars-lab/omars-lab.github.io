import type { Meta, StoryObj } from '@storybook/react';
import ContributionTimeline from './index';

const meta = {
  title: 'Components/ContributionTimeline',
  component: ContributionTimeline,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ContributionTimeline component provides click functionality for the Contribution Timeline in blog posts.
It handles SVG click events and scrolls to corresponding sections based on short ID mappings.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContributionTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story showing the ContributionTimeline component.
 * Note: This component requires a timeline-container element with an SVG to function properly.
 */
export const Default: Story = {
  render: () => (
    <div>
      <ContributionTimeline />
      <div id="timeline-container" style={{ padding: '20px', border: '1px dashed #ccc' }}>
        <p>Timeline container placeholder</p>
        <p>In actual usage, this would contain an SVG timeline element.</p>
        <svg width="400" height="200" style={{ border: '1px solid #ddd' }}>
          <text x="20" y="50" fontSize="16">[P1] Profile-of-One Platform</text>
          <text x="20" y="100" fontSize="16">[B1] Barclays CEO Demos</text>
          <text x="20" y="150" fontSize="16">[R1] Radian ML Pipeline</text>
        </svg>
      </div>
      <div id="profile-of-one-platform" style={{ marginTop: '500px', padding: '20px', background: '#f0f0f0' }}>
        <h2>Profile-of-One Platform</h2>
        <p>This section would be scrolled to when clicking [P1] in the timeline.</p>
      </div>
      <div id="barclays-ceo-demos" style={{ marginTop: '500px', padding: '20px', background: '#f0f0f0' }}>
        <h2>Barclays CEO Demos</h2>
        <p>This section would be scrolled to when clicking [B1] in the timeline.</p>
      </div>
      <div id="radian-ml-pipeline-optimization" style={{ marginTop: '500px', padding: '20px', background: '#f0f0f0' }}>
        <h2>Radian ML Pipeline Optimization</h2>
        <p>This section would be scrolled to when clicking [R1] in the timeline.</p>
      </div>
    </div>
  ),
};

