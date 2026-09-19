import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vacancyApi } from '../../../entities/vacancy';
import { descriptionApi } from '../../../entities/vacancy-description';
import { VacancyCreatePage } from './VacancyCreatePage';
import type { VacancyResponse } from '../../../entities/vacancy';

vi.mock('../../../entities/vacancy', async () => {
  const actual = await vi.importActual<typeof import('../../../entities/vacancy')>(
    '../../../entities/vacancy',
  );
  return {
    ...actual,
    vacancyApi: {
      createVacancy: vi.fn(),
      patchVacancyCore: vi.fn(),
      patchVacancyContactOffer: vi.fn(),
    },
  };
});

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

const createdVacancy: VacancyResponse = {
  id: 'vacancy-1',
  status: 'DRAFT',
  jobTitle: 'Senior Backend Developer',
  category: 'ENGINEERING',
  location: { country: 'NL', city: 'Amsterdam' },
  workplaceType: 'HYBRID',
  minHoursPerWeek: 24,
  maxHoursPerWeek: 36,
  createdAt: '2026-09-19T00:00:00Z',
} as unknown as VacancyResponse;

function renderPage() {
  render(
    <MemoryRouter>
      <VacancyCreatePage />
    </MemoryRouter>,
  );
}

async function completeStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Functietitel'), 'Senior Backend Developer');
  await user.selectOptions(screen.getByLabelText('Categorie'), 'ENGINEERING');
  await user.selectOptions(screen.getByLabelText('Land'), 'NL');
  await user.type(screen.getByLabelText('Stad'), 'Amsterdam');
  await user.click(screen.getByRole('button', { name: 'Hybride' }));
  await user.clear(screen.getByLabelText('Uren per week (minimum)'));
  await user.type(screen.getByLabelText('Uren per week (minimum)'), '24');
  await user.clear(screen.getByLabelText('Uren per week (maximum)'));
  await user.type(screen.getByLabelText('Uren per week (maximum)'), '36');
  await user.click(screen.getByRole('button', { name: 'Volgende' }));
  await waitFor(() => expect(vacancyApi.createVacancy).toHaveBeenCalledTimes(1));
}

describe('VacancyCreatePage', () => {
  beforeEach(() => {
    vi.mocked(vacancyApi.createVacancy).mockReset();
    vi.mocked(vacancyApi.patchVacancyCore).mockReset();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockReset();
    vi.mocked(descriptionApi.saveDescription).mockReset();
  });

  it('starts on step 1 and does not advance while the step is invalid', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('heading', { name: 'Basisgegevens' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(vacancyApi.createVacancy).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Basisgegevens' })).toBeInTheDocument();
  });

  it('shows a visible error (not a blank screen) when the backend is unreachable on step 1', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockRejectedValue({
      title: 'Netwerkfout: de server is niet bereikbaar.',
      status: 0,
    });
    renderPage();

    await completeStep1(user).catch(() => undefined);

    expect(await screen.findByRole('alert')).toHaveTextContent('Netwerkfout: de server is niet bereikbaar.');
  });

  it('advances step-by-step to Step 4 on a full happy-path click-through (manual description path)', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ summary: 'Written by hand' });
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue({
      ...createdVacancy,
      contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
    } as unknown as VacancyResponse);

    renderPage();

    await completeStep1(user);

    expect(await screen.findByRole('heading', { name: 'Vacaturetekst' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Samenvatting'), 'Written by hand');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(descriptionApi.saveDescription).toHaveBeenCalledTimes(1));

    expect(await screen.findByRole('heading', { name: 'Contact en voorwaarden' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Naam'), 'Jane Doe');
    await user.type(screen.getByLabelText('E-mailadres'), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));
    await waitFor(() => expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledTimes(1));

    expect(await screen.findByRole('heading', { name: 'Overzicht' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltooien' })).toBeInTheDocument();
  });
});
