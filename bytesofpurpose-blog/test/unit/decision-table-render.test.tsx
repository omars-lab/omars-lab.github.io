// Render test for the <DecisionTable> component (packages/blog-ui): each decision must
// render an anchored row (id="d1"…), a status badge, and (when any decision has one) a
// Choice column; the build-time gate must throw on a duplicate id or an unknown status.
import React from 'react';
import {render, screen, within} from '@testing-library/react';
import '@testing-library/jest-dom';
import DecisionTable from '../../../packages/blog-ui/src/components/DecisionTable';

const decisions = [
  {id: 'D1', decision: 'Execution model', status: 'decided' as const, choice: 'native → self-hosted'},
  {id: 'D2', decision: 'Measurement rigor', status: 'leaning' as const, choice: 'Bayesian'},
  {id: 'D3', decision: 'Autonomy model', status: 'decided' as const, statusNote: 'in principle', choice: 'tiers',
    detail: <>Configurable tiers with rollback.</>},
  {id: 'D7', decision: 'Tech stack', status: 'tbd' as const},
];

describe('DecisionTable', () => {
  it('renders one anchored row per decision, id = lowercased id', () => {
    const {container} = render(
      <DecisionTable title="Key Decisions" desc="d" decisions={decisions} />,
    );
    // Each decision row is #d1..#d7 addressable.
    for (const id of ['d1', 'd2', 'd3', 'd7']) {
      expect(container.querySelector(`tr#${id}`)).toBeInTheDocument();
    }
  });

  it('renders a status badge with the status text for each decision', () => {
    render(<DecisionTable title="Key Decisions" desc="d" decisions={decisions} />);
    expect(screen.getAllByText('decided')).toHaveLength(2);
    expect(screen.getByText('leaning')).toBeInTheDocument();
    expect(screen.getByText('tbd')).toBeInTheDocument();
  });

  it('shows a Choice column when any decision has a choice', () => {
    render(<DecisionTable title="Key Decisions" desc="d" decisions={decisions} />);
    expect(screen.getByText('native → self-hosted')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Choice'})).toBeInTheDocument();
  });

  it('renders the id as a modal button when a decision has detail, a plain link otherwise', () => {
    render(<DecisionTable title="Key Decisions" desc="d" decisions={decisions} />);
    // D3 has detail → a button; D1 has none → a link.
    const d3row = document.querySelector('tr#d3')!;
    expect(within(d3row as HTMLElement).getByRole('button')).toBeInTheDocument();
    const d1row = document.querySelector('tr#d1')!;
    expect(within(d1row as HTMLElement).getByRole('link', {name: 'D1'})).toHaveAttribute('href', '#d1');
  });

  it('throws (fails the build) on a duplicate decision id', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <DecisionTable
          title="T"
          desc="d"
          decisions={[
            {id: 'D1', decision: 'a', status: 'open' as const},
            {id: 'd1', decision: 'b', status: 'open' as const},
          ]}
        />,
      ),
    ).toThrow(/duplicate decision id/i);
    spy.mockRestore();
  });

  it('throws on an unknown status', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <DecisionTable
          title="T"
          desc="d"
          // @ts-expect-error intentionally invalid status
          decisions={[{id: 'D1', decision: 'a', status: 'maybe'}]}
        />,
      ),
    ).toThrow(/unknown status/i);
    spy.mockRestore();
  });
});
