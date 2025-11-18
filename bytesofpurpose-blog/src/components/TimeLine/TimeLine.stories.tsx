import type { Meta, StoryObj } from '@storybook/react';
import TimeLine from './index';
import TimelineItem from './TimeLineItem';

const meta = {
  title: 'Components/TimeLine',
  component: TimeLine,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
TimeLine component displays a vertical timeline with items that can be aligned left or right.
Each timeline item can have different variants (colors), alignments, and text styling options.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'warning', 'success', 'info', 'link', undefined],
      description: 'Line color variant',
    },
    children: {
      control: false,
      description: 'Timeline items (TimelineItem components)',
    },
  },
} satisfies Meta<typeof TimeLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <TimeLine>
      <TimelineItem align="right" variant="primary">
        <h3>2024</h3>
        <p>Year of the Dragon: The Dragon symbolizes power, strength, and good fortune.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="success">
        <h3>2023</h3>
        <p>Year of the Rabbit: The Rabbit is associated with luck, peace, and gentleness.</p>
      </TimelineItem>
      <TimelineItem align="right" variant="warning">
        <h3>2022</h3>
        <p>Year of the Tiger: The Tiger symbolizes bravery, courage, and determination.</p>
      </TimelineItem>
    </TimeLine>
  ),
};

export const WithVariants: Story = {
  render: () => (
    <TimeLine variant="primary">
      <TimelineItem align="right" variant="white" color="danger">
        <h3>2024</h3>
        <p>Year of the Dragon: The Dragon symbolizes power, strength, and good fortune.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="black" color="info">
        <h3>2023</h3>
        <p>Year of the Rabbit: The Rabbit is associated with luck, peace, and gentleness.</p>
      </TimelineItem>
      <TimelineItem align="right" variant="warning">
        <h3>2022</h3>
        <p>Year of the Tiger: The Tiger symbolizes bravery, courage, and determination.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="info">
        <h3>2021</h3>
        <p>Year of the Ox: The Ox represents hard work, stability, and perseverance.</p>
      </TimelineItem>
      <TimelineItem align="right" variant="primary">
        <h3>2020</h3>
        <p>Year of the Rat: The Rat is associated with intelligence, prosperity, and resourcefulness.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="danger">
        <h3>2019</h3>
        <p>Year of the Pig: The Pig symbolizes abundance, generosity, and kindness.</p>
      </TimelineItem>
    </TimeLine>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <TimeLine variant="success">
      <TimelineItem align="right" variant="primary">
        <h3>Primary Variant</h3>
        <p>Timeline item with primary background color.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="success">
        <h3>Success Variant</h3>
        <p>Timeline item with success background color.</p>
      </TimelineItem>
      <TimelineItem align="right" variant="warning">
        <h3>Warning Variant</h3>
        <p>Timeline item with warning background color.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="danger">
        <h3>Danger Variant</h3>
        <p>Timeline item with danger background color.</p>
      </TimelineItem>
      <TimelineItem align="right" variant="info">
        <h3>Info Variant</h3>
        <p>Timeline item with info background color.</p>
      </TimelineItem>
    </TimeLine>
  ),
};

export const TextStyling: Story = {
  render: () => (
    <TimeLine>
      <TimelineItem align="right" variant="primary" textAlign="left" weight="bold">
        <h3>Bold Text</h3>
        <p>Timeline item with bold text weight.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="success" transform="uppercase">
        <h3>Uppercase Text</h3>
        <p>Timeline item with uppercase text transformation.</p>
      </TimelineItem>
      <TimelineItem align="right" variant="warning" italic>
        <h3>Italic Text</h3>
        <p>Timeline item with italic text style.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="info" textAlign="center" color="primary">
        <h3>Center Aligned</h3>
        <p>Timeline item with center-aligned text.</p>
      </TimelineItem>
    </TimeLine>
  ),
};

export const LongContent: Story = {
  render: () => (
    <TimeLine variant="primary-dark">
      <TimelineItem align="right" variant="primary-lightest" breakWord>
        <h3>2024 - Major Milestone</h3>
        <p>
          This is a longer timeline item that demonstrates how the component handles
          extended content. The breakWord prop ensures that long words will break
          appropriately to fit within the timeline item boundaries.
        </p>
        <p>
          Additional paragraphs can be included to show how multiple content blocks
          are rendered within a single timeline item.
        </p>
      </TimelineItem>
      <TimelineItem align="left" variant="success-lightest" breakWord>
        <h3>2023 - Another Achievement</h3>
        <p>
          Timeline items can contain rich content including multiple paragraphs,
          lists, and other HTML elements. The component maintains proper spacing
          and alignment regardless of content length.
        </p>
        <ul>
          <li>First achievement</li>
          <li>Second achievement</li>
          <li>Third achievement</li>
        </ul>
      </TimelineItem>
    </TimeLine>
  ),
};

export const AlternatingAlignment: Story = {
  render: () => (
    <TimeLine variant="info">
      <TimelineItem align="right" variant="primary">
        <h3>Right Aligned Item</h3>
        <p>This item is aligned to the right side of the timeline.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="success">
        <h3>Left Aligned Item</h3>
        <p>This item is aligned to the left side of the timeline.</p>
      </TimelineItem>
      <TimelineItem align="right" variant="warning">
        <h3>Right Aligned Item</h3>
        <p>Alternating alignment creates a visually appealing timeline.</p>
      </TimelineItem>
      <TimelineItem align="left" variant="danger">
        <h3>Left Aligned Item</h3>
        <p>The timeline automatically positions items based on the align prop.</p>
      </TimelineItem>
    </TimeLine>
  ),
};

export const WithLinks: Story = {
  render: () => (
    <TimeLine variant="primary">
      <TimelineItem align="right" variant="primary-lightest">
        <h3>2024 - Project Launch</h3>
        <p>
          Successfully launched our new project. Check out the{' '}
          <a href="https://example.com">documentation</a> for more details.
        </p>
      </TimelineItem>
      <TimelineItem align="left" variant="success-lightest">
        <h3>2023 - Team Expansion</h3>
        <p>
          Expanded our team with new members. Visit our{' '}
          <a href="https://example.com/team">team page</a> to meet everyone.
        </p>
      </TimelineItem>
      <TimelineItem align="right" variant="info-lightest">
        <h3>2022 - First Release</h3>
        <p>
          Released version 1.0. Read the{' '}
          <a href="https://example.com/release-notes">release notes</a> for all the details.
        </p>
      </TimelineItem>
    </TimeLine>
  ),
};

