import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vacancyApi } from '../../../entities/vacancy';
import { VacancyContactOfferForm } from './VacancyContactOfferForm';
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

const vacancy: VacancyResponse = { id: 'vacancy-1' } as unknown as VacancyResponse;

async function fillContactPerson(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Naam'), 'Jane Doe');
  await user.type(screen.getByLabelText('E-mailadres'), 'jane@example.com');
}

describe('VacancyContactOfferForm', () => {
  beforeEach(() => {
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockReset();
  });

  it('requires currency and salaryPeriod once a salary field is filled in', async () => {
    const user = userEvent.setup();
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Salaris minimum'), '3000');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByText('Valuta is verplicht bij een ingevuld salaris.')).toBeInTheDocument();
    expect(screen.getByText('Salarisperiode is verplicht bij een ingevuld salaris.')).toBeInTheDocument();
    expect(vacancyApi.patchVacancyContactOffer).not.toHaveBeenCalled();
  });

  it('does not require currency/salaryPeriod when no salary field is filled in', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() => expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledTimes(1));
  });

  it('calls patchVacancyContactOffer with contactPerson and offer on save', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    const onSaved = vi.fn();
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={onSaved} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Salaris minimum'), '3000');
    await user.selectOptions(screen.getByLabelText('Valuta'), 'EUR');
    await user.selectOptions(screen.getByLabelText('Salarisperiode'), 'MONTHLY');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({
          contactPerson: expect.objectContaining({ name: 'Jane Doe', email: 'jane@example.com' }),
          offer: expect.objectContaining({ salaryMin: 3000, currency: 'EUR', salaryPeriod: 'MONTHLY' }),
        }),
      ),
    );
    expect(onSaved).toHaveBeenCalledWith(vacancy);
  });
});
