import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { descriptionApi } from '../../../entities/vacancy-description';
import { ReviewVacancy } from './ReviewVacancy';
import type { VacancyResponse } from '../../../entities/vacancy';

vi.mock('../../../entities/vacancy-description', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/vacancy-description')>(
    '../../../entities/vacancy-description',
  );
  return {
    ...actual,
    descriptionApi: {
      generateDescription: vi.fn(),
      getGenerationStatus: vi.fn(),
      saveDescription: vi.fn(),
    },
  };
});

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
  offer: { salaryMin: 3000, salaryMax: 4000, currency: 'EUR', salaryPeriod: 'MONTHLY' },
} as unknown as VacancyResponse;

const description = { summary: 'A great job summary', jobDescription: 'Role text', tasks: 'Task list' };

describe('ReviewVacancy', () => {
  beforeEach(() => {
    vi.mocked(descriptionApi.saveDescription).mockReset();
  });

  it('shows skeleton bars while phase is generating and no description yet', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        mode="ai"
        phase="generating"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('presentation')).toHaveLength(4);
    expect(screen.queryByLabelText('Samenvatting')).not.toBeInTheDocument();
  });

  it('renders editable textareas and the assembled summary once ready', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Samenvatting')).toHaveValue('A great job summary');
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText('€3.000 – €4.000 per maand')).toBeInTheDocument();
  });

  it('does not show "Opnieuw" regenerate controls in manual mode', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Opnieuw/ })).not.toBeInTheDocument();
  });

  it('shows "Opnieuw" regenerate controls in AI mode and calls onRegenerate with the section', async () => {
    const user = userEvent.setup();
    const onRegenerate = vi.fn();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="ai"
        phase="ready"
        onDescriptionSaved={vi.fn()}
        onRegenerate={onRegenerate}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: /Opnieuw/ });
    expect(buttons).toHaveLength(3);
    await user.click(buttons[0]);

    expect(onRegenerate).toHaveBeenCalledWith('summary');
  });

  it('"Aanpassen" links call onNavigateToStep with step 1 and step 3', async () => {
    const user = userEvent.setup();
    const onNavigateToStep = vi.fn();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={onNavigateToStep}
        onViewPreview={vi.fn()}
      />,
    );

    const links = screen.getAllByRole('button', { name: 'Aanpassen' });
    await user.click(links[0]);
    expect(onNavigateToStep).toHaveBeenCalledWith(1);

    await user.click(links[1]);
    expect(onNavigateToStep).toHaveBeenCalledWith(3);
  });

  it('saves edited description via saveDescription', async () => {
    const user = userEvent.setup();
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ ...description, summary: 'Updated' });
    const onDescriptionSaved = vi.fn();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={onDescriptionSaved}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Samenvatting'), '!');
    await user.click(screen.getByRole('button', { name: 'Bekijk je vacature' }));

    await waitFor(() => expect(descriptionApi.saveDescription).toHaveBeenCalled());
  });

  it('calls onViewPreview when "Bekijk je vacature" is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue(description);
    const onViewPreview = vi.fn();
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={onViewPreview}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Bekijk je vacature' }));

    await waitFor(() => expect(onViewPreview).toHaveBeenCalledTimes(1));
  });

  it('formats the salary line with nl-NL thousands separators and the period', () => {
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancy}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('€3.000 – €4.000 per maand')).toBeInTheDocument();
  });

  it('shows "Salaris in overleg" when the vacancy has no offer', () => {
    const vacancyWithoutOffer = { ...vacancy, offer: undefined };
    render(
      <ReviewVacancy
        vacancyId="vacancy-1"
        vacancy={vacancyWithoutOffer}
        description={description}
        mode="manual"
        onDescriptionSaved={vi.fn()}
        onNavigateToStep={vi.fn()}
        onViewPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('Salaris in overleg')).toBeInTheDocument();
  });
});
