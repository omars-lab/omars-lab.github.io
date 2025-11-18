import type { Meta, StoryObj } from '@storybook/react';
import { SdeSkill } from './index';

const meta = {
  title: 'Components/SdeSkill',
  component: SdeSkill,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SdeSkill component displays skill expectations for Software Development Engineers (SDE) at different levels (4-7).
Each skill expectation is highlighted with level-specific keywords to show progression.
This component is tightly coupled with the blog post about understanding differences in skills.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    role: {
      control: 'select',
      options: ['SDE'],
      description: 'Role type (currently only SDE is supported)',
    },
    skill: {
      control: 'select',
      options: ['PBD', 'PRD', 'DWA', 'DWC', 'ATN', 'SLQ', 'DLC', 'PLC', 'CNT', 'IMP', 'INF', 'ALN', 'MEN', 'SME', 'DCS', 'CDB', 'CLB', 'ABL', 'MND', 'FMX'],
      description: 'Skill code identifier',
    },
    l: {
      control: 'select',
      options: [4, 5, 6, 7],
      description: 'Level (4-7)',
    },
  },
} satisfies Meta<typeof SdeSkill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Level4: Story = {
  args: {
    role: 'SDE',
    skill: 'PBD',
    l: 4,
  },
};

export const Level5: Story = {
  args: {
    role: 'SDE',
    skill: 'PBD',
    l: 5,
  },
};

export const Level6: Story = {
  args: {
    role: 'SDE',
    skill: 'PBD',
    l: 6,
  },
};

export const Level7: Story = {
  args: {
    role: 'SDE',
    skill: 'PBD',
    l: 7,
  },
};

export const ProblemSolving: Story = {
  args: {
    role: 'SDE',
    skill: 'PBD',
    l: 5,
  },
};

export const CodeQuality: Story = {
  args: {
    role: 'SDE',
    skill: 'SLQ',
    l: 6,
  },
};

export const Leadership: Story = {
  args: {
    role: 'SDE',
    skill: 'INF',
    l: 7,
  },
};

export const InTable: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>Skill</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>L4</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>L5</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>L6</th>
          <th style={{ border: '1px solid #ddd', padding: '8px' }}>L7</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Problem Solving</td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}><SdeSkill role="SDE" skill="PBD" l={4} /></td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}><SdeSkill role="SDE" skill="PBD" l={5} /></td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}><SdeSkill role="SDE" skill="PBD" l={6} /></td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}><SdeSkill role="SDE" skill="PBD" l={7} /></td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}>Code Quality</td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}><SdeSkill role="SDE" skill="SLQ" l={4} /></td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}><SdeSkill role="SDE" skill="SLQ" l={5} /></td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}><SdeSkill role="SDE" skill="SLQ" l={6} /></td>
          <td style={{ border: '1px solid #ddd', padding: '8px' }}><SdeSkill role="SDE" skill="SLQ" l={7} /></td>
        </tr>
      </tbody>
    </table>
  ),
};

