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

  it('draws the Talmar icon: the "t" glyph and the violet dot on the teal square', () => {
    const { container } = render(<Logo />);

    expect(container.querySelector('[data-part="square"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-part="glyph"]')).toHaveLength(2);
    expect(container.querySelector('[data-part="dot"]')).not.toBeNull();
  });

  it('adds the wordmark only in the lockup', () => {
    const { container, rerender } = render(<Logo />);
    expect(container.querySelector('[data-part="wordmark"]')).toBeNull();

    rerender(<Logo variant="lockup" />);
    expect(container.querySelector('[data-part="wordmark"]')).not.toBeNull();
  });

  it('sizes the logo from the design-system size scale', () => {
    render(<Logo size={48} />);
    expect(screen.getByRole('img', { name: 'Talmar' })).toHaveStyle({ '--logo-size': '48px' });
  });
});
