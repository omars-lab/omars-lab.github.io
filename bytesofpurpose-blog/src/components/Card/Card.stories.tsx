import type { Meta, StoryObj } from '@storybook/react';
import Card from './index';
import CardHeader from './CardHeader';
import CardBody from './CardBody';
import CardFooter from './CardFooter';
import CardImage from './CardImage';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Card component provides a flexible container for displaying content with optional shadow effects.
It works together with CardHeader, CardBody, CardFooter, and CardImage subcomponents to create structured card layouts.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    shadow: {
      control: 'select',
      options: ['lw', 'md', 'tl', undefined],
      description: 'Shadow level: low (lw), medium (md), top-level (tl)',
    },
    children: {
      control: false,
      description: 'Card content (typically CardHeader, CardBody, CardFooter, CardImage)',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Card>
      <CardBody>
        This is a basic card with just body content.
      </CardBody>
    </Card>
  ),
};

export const WithShadow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <Card shadow="lw">
        <CardBody>
          <h3>Low Shadow</h3>
          <p>Card with low shadow (lw)</p>
        </CardBody>
      </Card>
      <Card shadow="md">
        <CardBody>
          <h3>Medium Shadow</h3>
          <p>Card with medium shadow (md)</p>
        </CardBody>
      </Card>
      <Card shadow="tl">
        <CardBody>
          <h3>Top Level Shadow</h3>
          <p>Card with top-level shadow (tl)</p>
        </CardBody>
      </Card>
    </div>
  ),
};

export const CompleteCard: Story = {
  render: () => (
    <Card shadow="tl">
      <CardHeader>
        <h3>Card Title</h3>
      </CardHeader>
      <CardBody>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quis ipsum suspendisse ultrices gravida.
      </CardBody>
      <CardFooter>
        <button className="button button--secondary button--block">See All</button>
      </CardFooter>
    </Card>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card shadow="md">
      <CardImage
        cardImageUrl="/img/artifacts.svg"
        alt="Card Image"
        title="Card Image Title"
      />
      <CardBody>
        <h3>Card with Image</h3>
        <p>This card includes an image at the top.</p>
      </CardBody>
      <CardFooter>
        <button className="button button--secondary">Learn More</button>
      </CardFooter>
    </Card>
  ),
};

export const StyledCard: Story = {
  render: () => (
    <Card>
      <CardHeader style={{ backgroundColor: '#205d3b', color: 'white' }}>
        <h3>Styled Header</h3>
      </CardHeader>
      <CardBody
        style={{ backgroundColor: '#f0f0f0', color: '#333' }}
        textAlign="center"
        transform="uppercase"
      >
        <h3>Styled Body</h3>
        <p>This card has custom styling applied to header and body.</p>
      </CardBody>
      <CardFooter style={{ backgroundColor: '#205d3b', color: 'white' }}>
        <div className="button-group button-group--block">
          <button className="button button--secondary">Like</button>
          <button className="button button--secondary">Comment</button>
          <button className="button button--secondary">Share</button>
        </div>
      </CardFooter>
    </Card>
  ),
};

export const TextVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', maxWidth: '400px' }}>
      <Card>
        <CardBody textAlign="left">
          <h4>Left Aligned</h4>
          <p>Text aligned to the left</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody textAlign="center">
          <h4>Center Aligned</h4>
          <p>Text aligned to the center</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody textAlign="right">
          <h4>Right Aligned</h4>
          <p>Text aligned to the right</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody transform="uppercase" weight="bold">
          <h4>Uppercase & Bold</h4>
          <p>Transformed text with bold weight</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody italic variant="secondary">
          <h4>Italic & Secondary</h4>
          <p>Italic text with secondary color variant</p>
        </CardBody>
      </Card>
    </div>
  ),
};

export const ImageOnly: Story = {
  render: () => (
    <Card>
      <CardImage
        cardImageUrl="/img/posts.svg"
        alt="Posts"
        title="Posts Image"
      />
      <CardFooter>
        <div className="button-group button-group--block">
          <button className="button button--success">Like</button>
          <button className="button button--warning">Comment</button>
          <button className="button button--danger">Share</button>
        </div>
      </CardFooter>
    </Card>
  ),
};

