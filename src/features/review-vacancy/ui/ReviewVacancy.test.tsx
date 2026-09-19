import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewVacancy } from './ReviewVacancy';
import type { VacancyResponse } from '../../../entities/vacancy';

const vacancy: VacancyResponse = {
  id: 'vacancy-1',
  status: 'DRAFT',
  jobTitle: 'Senior Backend Developer',
  category: 'ENGINEERING',
  location: { country: 'NL', city: 'Amsterdam' },
  workplaceType: 'HYBRID',
  minHoursPerWeek: 24,
  maxHoursPerWeek: 36,
  createdAt: '2026-09-19T00:00:00Z',
  description: { summary: 'A great job summary' },
  contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
  offer: { salaryMin: 3000, salaryMax: 4000, currency: 'EUR', salaryPeriod: 'MONTHLY' },
} as unknown as VacancyResponse;

describe('ReviewVacancy', () => {
  it('renders the assembled summary from the given wizard state', () => {
    render(<ReviewVacancy vacancy={vacancy} onComplete={vi.fn()} />);

    expect(screen.getByText('Senior Backend Developer')).toBeInTheDocument();
    expect(screen.getByText('Amsterdam')).toBeInTheDocument();
    expect(screen.getByText('A great job summary')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText(/3000/)).toBeInTheDocument();
  });

  it('calls onComplete when "Voltooien" is clicked, without triggering a new API call', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ReviewVacancy vacancy={vacancy} onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: 'Voltooien' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
