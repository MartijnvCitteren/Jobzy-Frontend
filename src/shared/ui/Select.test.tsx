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

  it('shows a suffix badge next to the control when provided', () => {
    render(<Select label="Land" options={options} value="NL" onChange={vi.fn()} suffix="NL" />);

    expect(screen.getByText('NL', { selector: 'span' })).toBeInTheDocument();
  });

  it('renders no suffix badge when the suffix prop is omitted', () => {
    render(<Select label="Land" options={options} value="NL" onChange={vi.fn()} />);

    expect(screen.queryByText('NL', { selector: 'span' })).not.toBeInTheDocument();
  });

  it('renders a separator entry as a disabled, unselectable option', () => {
    const optionsWithSeparator = [
      { value: 'NL', label: 'Nederland' },
      { type: 'separator' as const },
      { value: 'BE', label: 'België' },
    ];
    render(<Select label="Land" options={optionsWithSeparator} value="NL" onChange={vi.fn()} />);

    const select = screen.getByLabelText('Land');
    const allOptions = Array.from(select.querySelectorAll('option'));
    const separatorOption = allOptions.find((option) => /^─+$/.test(option.textContent ?? ''));

    expect(separatorOption).toBeDefined();
    expect(separatorOption).toBeDisabled();
  });

  it('never fires onChange with the separator as the selected value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const optionsWithSeparator = [
      { value: 'NL', label: 'Nederland' },
      { type: 'separator' as const },
      { value: 'BE', label: 'België' },
    ];
    render(<Select label="Land" options={optionsWithSeparator} value="NL" onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Land'), 'BE');

    expect(onChange).toHaveBeenCalledWith('BE');
    expect(onChange).not.toHaveBeenCalledWith(expect.stringMatching(/^─+$/));
  });

  it('renders a chevron icon (native select arrow replaced for consistent cross-browser sizing)', () => {
    const { container } = render(<Select label="Land" options={options} value="NL" onChange={vi.fn()} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
