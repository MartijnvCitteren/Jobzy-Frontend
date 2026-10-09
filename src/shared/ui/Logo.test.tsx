import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './Logo';

describe('Logo', () => {
  it('exposes a single accessible name, whichever variant', () => {
    render(
      <>
        <Logo />
        <Logo variant="lockup" />
      </>,
    );

    expect(screen.getAllByRole('img', { name: 'Talmar' })).toHaveLength(2);
  });

  it('renders the wordmark as text only in the lockup', () => {
    const { container, rerender } = render(<Logo />);
    expect(container).not.toHaveTextContent('Talmar');

    rerender(<Logo variant="lockup" />);
    expect(container).toHaveTextContent('Talmar');
  });

  it('gives each instance its own knockout mask', () => {
    const { container } = render(
      <>
        <Logo />
        <Logo />
      </>,
    );

    const ids = Array.from(container.querySelectorAll('mask')).map((mask) => mask.id);
    expect(new Set(ids).size).toBe(2);
    ids.forEach((id) =>
      expect(container.querySelector(`rect[mask="url(#${id})"]`)).not.toBeNull(),
    );
  });

  it('sizes the symbol from the design-system size scale', () => {
    render(<Logo size={48} />);
    expect(screen.getByRole('img', { name: 'Talmar' })).toHaveStyle({ '--logo-size': '48px' });
  });
});
