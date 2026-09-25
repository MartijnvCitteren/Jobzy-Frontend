import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders unchecked by default and reflects the checked prop', () => {
    render(<Checkbox label="Liever niet delen" checked={false} onChange={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Liever niet delen' })).not.toBeChecked();
  });

  it('calls onChange with the toggled value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Liever niet delen" checked={false} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Liever niet delen' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders as checked when checked is true', () => {
    render(<Checkbox label="Liever niet delen" checked={true} onChange={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Liever niet delen' })).toBeChecked();
  });
});
