import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
