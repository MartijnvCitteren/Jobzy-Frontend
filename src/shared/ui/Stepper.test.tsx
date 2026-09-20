import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('marks the current step as active, earlier steps as done, and later steps as inactive', () => {
    render(<Stepper steps={steps} currentIndex={2} />);

    expect(screen.getByText('Contact en voorwaarden').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'active',
    );
    expect(screen.getByText('Basisgegevens').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'done',
    );
    expect(screen.getByText('Vacaturetekst').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'done',
    );
    expect(screen.getByText('Overzicht').closest('[data-status]')).toHaveAttribute(
      'data-status',
      'inactive',
    );
  });

  it('calls onStepClick with the clicked step index when reachable', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(
      <Stepper
        steps={steps}
        currentIndex={0}
        onStepClick={onStepClick}
        isReachable={(index) => index <= 1}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Vacaturetekst/ }));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });

  it('disables unreachable steps and does not call onStepClick for them', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(
      <Stepper
        steps={steps}
        currentIndex={0}
        onStepClick={onStepClick}
        isReachable={(index) => index <= 1}
      />,
    );

    const overzichtButton = screen.getByRole('button', { name: /Overzicht/ });
    expect(overzichtButton).toBeDisabled();
    await user.click(overzichtButton);
    expect(onStepClick).not.toHaveBeenCalled();
  });
});
