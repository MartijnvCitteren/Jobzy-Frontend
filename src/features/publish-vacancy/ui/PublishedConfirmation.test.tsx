import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishedConfirmation } from './PublishedConfirmation';

describe('PublishedConfirmation', () => {
  it('renders the vacancy title in the body copy', () => {
    render(
      <PublishedConfirmation
        vacancyTitle="Senior Backend Developer"
        onBackToOverview={vi.fn()}
        onViewVacancy={vi.fn()}
      />,
    );

    expect(screen.getByText(/Senior Backend Developer/)).toBeInTheDocument();
  });

  it('calls the navigation callbacks', async () => {
    const user = userEvent.setup();
    const onBackToOverview = vi.fn();
    const onViewVacancy = vi.fn();
    render(
      <PublishedConfirmation
        vacancyTitle="Senior Backend Developer"
        onBackToOverview={onBackToOverview}
        onViewVacancy={onViewVacancy}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Terug naar overzicht' }));
    expect(onBackToOverview).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Bekijk je vacature' }));
    expect(onViewVacancy).toHaveBeenCalledTimes(1);
  });
});
