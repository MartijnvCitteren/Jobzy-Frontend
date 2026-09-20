import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VacancyPreview } from './VacancyPreview';
import type { VacancyResponse } from '../../../entities/vacancy';
import type { VacancyDescriptionResponse } from '../../../entities/vacancy-description';

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
  contactPerson: { name: 'Jane Doe', role: 'HR', email: 'jane@example.com' },
  offer: { salaryMin: 3000, salaryMax: 4000, currency: 'EUR', salaryPeriod: 'MONTHLY', numberOfHolidays: 25 },
} as unknown as VacancyResponse;

const description: VacancyDescriptionResponse = {
  summary: 'A great job summary',
  jobDescription: 'Role text',
  tasks: 'Task list',
};

describe('VacancyPreview', () => {
  it('renders the header chips (location, workplace, hours, salary)', () => {
    render(
      <VacancyPreview
        vacancy={vacancy}
        description={description}
        onBack={vi.fn()}
        onSaveDraft={vi.fn()}
        onRequestPublish={vi.fn()}
      />,
    );

    expect(screen.getByText('Amsterdam, Nederland')).toBeInTheDocument();
    expect(screen.getByText('24–36 uur per week')).toBeInTheDocument();
    expect(screen.getAllByText('€3.000 – €4.000 per maand').length).toBeGreaterThan(0);
  });

  it('renders "Salaris in overleg" when no salary is set', () => {
    const vacancyNoSalary = { ...vacancy, offer: undefined } as unknown as VacancyResponse;
    render(
      <VacancyPreview
        vacancy={vacancyNoSalary}
        description={description}
        onBack={vi.fn()}
        onSaveDraft={vi.fn()}
        onRequestPublish={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Salaris in overleg').length).toBeGreaterThan(0);
  });

  it('renders the summary and job description body sections', () => {
    render(
      <VacancyPreview
        vacancy={vacancy}
        description={description}
        onBack={vi.fn()}
        onSaveDraft={vi.fn()}
        onRequestPublish={vi.fn()}
      />,
    );

    expect(screen.getByText('A great job summary')).toBeInTheDocument();
    expect(screen.getByText('Role text')).toBeInTheDocument();
    expect(screen.getByText('Task list')).toBeInTheDocument();
  });

  it('renders a disabled "Solliciteren" button', () => {
    render(
      <VacancyPreview
        vacancy={vacancy}
        description={description}
        onBack={vi.fn()}
        onSaveDraft={vi.fn()}
        onRequestPublish={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Solliciteren' })).toBeDisabled();
  });

  it('calls onBack, onSaveDraft and onRequestPublish from the footer buttons', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onSaveDraft = vi.fn();
    const onRequestPublish = vi.fn();
    render(
      <VacancyPreview
        vacancy={vacancy}
        description={description}
        onBack={onBack}
        onSaveDraft={onSaveDraft}
        onRequestPublish={onRequestPublish}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Terug' }));
    expect(onBack).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Bewaren als concept' }));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Publiceer vacature' }));
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
  });
});
