import type {Meta, StoryObj} from '@storybook/react';
import TaskList from './index';

/**
 * TaskList renders a markdown task list with the special capture tags styled as chips. In MDX
 * you wrap a real markdown list; these stories use the `items` prop (raw task strings) so the
 * component can render standalone in Storybook.
 */
const meta = {
  title: 'Components/TaskList',
  component: TaskList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Wrap a markdown task list in `<TaskList>` to render its capture tags (>due, ' +
          '@done(date), ~Nx~, #stamp/#tag) as styled chips instead of raw text. The markdown ' +
          'stays the source of truth. Pass `items` (raw task strings) to render from data.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TaskList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mixed: Story = {
  args: {
    items: [
      'Export bookmarks over the CLI `>2022-04-18`',
      '[x] Make a chime script `@done(2022-04-13)`',
      'Smarter date helpers `#2022-07-08` `~05x~`',
      'Other work streams `>2022-06-25` `#2022-04-27` `~10x~`',
      'A plain task with no tags',
      '[x] Backup work tasks `@done(2022-05-23)`',
    ],
  },
};

export const AllOpen: Story = {
  args: {
    items: [
      'Track script usage and retire the unused functions',
      'Port the portfolio to React `#frontend`',
      'Fix broken links `>2022-04-18`',
    ],
  },
};
