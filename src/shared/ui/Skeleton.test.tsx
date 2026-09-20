import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders a bar with the given width and height', () => {
    render(<Skeleton width="60%" height={14} />);

    const bar = screen.getByRole('presentation');
    expect(bar).toHaveStyle({ width: '60%', height: '14px' });
  });
});
