import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stepper } from './Stepper';

const steps = [
  { label: 'Basisgegevens' },
  { label: 'Vacaturetekst' },
  { label: 'Contact en voorwaarden' },
  { label: 'Overzicht' },
];

describe('Stepper', () => {
  it('renders all step labels', () => {
    render(<Stepper steps={steps} currentIndex={0} />);

    for (const step of steps) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it('marks the current step as active and others as inactive', () => {
    render(<Stepper steps={steps} currentIndex={2} />);

    expect(screen.getByText('Contact en voorwaarden').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'active',
    );
    expect(screen.getByText('Basisgegevens').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'inactive',
    );
    expect(screen.getByText('Overzicht').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'inactive',
    );
  });
});
