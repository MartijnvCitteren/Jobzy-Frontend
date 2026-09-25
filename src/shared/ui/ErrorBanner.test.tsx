import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBanner } from './ErrorBanner';

describe('ErrorBanner', () => {
  it('renders nothing when there is no message', () => {
    const { container } = render(<ErrorBanner message={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the message with an alert role when present', () => {
    render(<ErrorBanner message="Backend niet bereikbaar." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Backend niet bereikbaar.');
  });
});
