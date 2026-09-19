import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybride' },
  { value: 'REMOTE', label: 'Remote' },
];

describe('SegmentedControl', () => {
  it('marks the selected option as pressed', () => {
    render(<SegmentedControl options={options} value="HYBRID" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Hybride' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'On-site' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the clicked option value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SegmentedControl options={options} value="HYBRID" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remote' }));

    expect(onChange).toHaveBeenCalledWith('REMOTE');
  });
});
