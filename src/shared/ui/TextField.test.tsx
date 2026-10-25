import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TextField } from './TextField';

describe('TextField', () => {
  it('exposes the accessible name while hiding the label visually when hideLabel is set', () => {
    render(<TextField label="Samenvatting" value="Some text" onChange={vi.fn()} hideLabel />);

    expect(screen.getByLabelText('Samenvatting')).toBeInTheDocument();
    expect(screen.getByText('Samenvatting').className).toMatch(/srOnly/);
  });

  it('renders a normally-visible label by default', () => {
    render(<TextField label="Samenvatting" value="Some text" onChange={vi.fn()} />);

    expect(screen.getByText('Samenvatting').className).not.toMatch(/srOnly/);
  });

  it('links the error to the control and marks it invalid', () => {
    render(<TextField label="Voornaam" value="" onChange={vi.fn()} error="Vul je voornaam nog even in." />);

    const input = screen.getByLabelText('Voornaam');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Vul je voornaam nog even in.');
  });

  it('links the helper text to the control when there is no error', () => {
    render(<TextField label="Wachtwoord" value="" onChange={vi.fn()} helperText="Minimaal 12 tekens." />);

    expect(screen.getByLabelText('Wachtwoord')).toHaveAccessibleDescription('Minimaal 12 tekens.');
  });

  it('passes native form attributes through so the field can post with a plain form', () => {
    render(
      <TextField
        label="E-mailadres"
        value=""
        onChange={vi.fn()}
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />,
    );

    const input = screen.getByLabelText('E-mailadres');
    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('reports blur so callers can validate on focus loss', () => {
    const onBlur = vi.fn();
    render(<TextField label="Voornaam" value="" onChange={vi.fn()} onBlur={onBlur} />);

    fireEvent.blur(screen.getByLabelText('Voornaam'));

    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('renders a trailing control next to the input', () => {
    render(
      <TextField label="Wachtwoord" value="" onChange={vi.fn()} trailing={<button type="button">Tonen</button>} />,
    );

    expect(screen.getByRole('button', { name: 'Tonen' })).toBeInTheDocument();
  });
});
