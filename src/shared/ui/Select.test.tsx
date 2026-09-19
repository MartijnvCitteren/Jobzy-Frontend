import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const options = [
  { value: 'NL', label: 'Nederland' },
  { value: 'BE', label: 'België' },
];

describe('Select', () => {
  it('renders a labelled combobox with the given options', () => {
    render(<Select label="Land" options={options} value="NL" onChange={vi.fn()} />);

    const select = screen.getByLabelText('Land');
    expect(select).toHaveValue('NL');
    expect(screen.getByRole('option', { name: 'België' })).toBeInTheDocument();
  });

  it('calls onChange with the new value on selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="Land" options={options} value="NL" onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Land'), 'BE');

    expect(onChange).toHaveBeenCalledWith('BE');
  });

  it('shows a field-level error message when provided', () => {
    render(<Select label="Land" options={options} value="" onChange={vi.fn()} error="is verplicht" />);

    expect(screen.getByText('is verplicht')).toBeInTheDocument();
  });
});
