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

  it('hides the salary grid and clears salary fields on save when "Liever niet delen" is checked', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} />);

    await fillContactPerson(user);
    await user.type(screen.getByLabelText('Salaris minimum'), '3000');
    await user.click(screen.getByRole('checkbox', { name: 'Liever niet delen' }));

    expect(screen.queryByLabelText('Salaris minimum')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({
          offer: expect.objectContaining({
            salaryMin: null,
            salaryMax: null,
            currency: undefined,
            salaryPeriod: undefined,
          }),
        }),
      ),
    );
  });

  it('renders a generating banner in AI mode driven by the phase prop, without polling itself', async () => {
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} mode="ai" phase="generating" />);

    expect(
      screen.getByText(
        'We stellen je vacaturetekst op — ga jij alvast verder met contact en voorwaarden.',
      ),
    ).toBeInTheDocument();
  });

  it('renders a ready banner in AI mode when phase is ready', async () => {
    render(<VacancyContactOfferForm vacancyId="vacancy-1" onSaved={vi.fn()} mode="ai" phase="ready" />);

    expect(
      screen.getByText('Je concepttekst staat klaar — je ziet hem in het overzicht bij de volgende stap.'),
    ).toBeInTheDocument();
  });

  it('prefills fields from initialValues so navigating back does not lose saved data', async () => {
    render(
      <VacancyContactOfferForm
        vacancyId="vacancy-1"
        onSaved={vi.fn()}
        initialValues={{
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com', role: 'Recruiter', phone: '0612345678' },
          offer: { salaryMin: 4000, salaryMax: 5000, currency: 'EUR', salaryPeriod: 'MONTHLY', numberOfHolidays: 25 },
        }}
      />,
    );

    expect(screen.getByLabelText('Naam')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('E-mailadres')).toHaveValue('jane@example.com');
    expect(screen.getByLabelText('Salaris minimum')).toHaveValue(4000);
    expect(screen.getByLabelText('Salaris maximum')).toHaveValue(5000);
    expect(screen.getByLabelText('Valuta')).toHaveValue('EUR');
    expect(screen.getByLabelText('Salarisperiode')).toHaveValue('MONTHLY');
  });

  it('resaves the prefilled salary values unchanged when clicking Volgende again', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyContactOffer).mockResolvedValue(vacancy);
    render(
      <VacancyContactOfferForm
        vacancyId="vacancy-1"
        onSaved={vi.fn()}
        initialValues={{
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
          offer: { salaryMin: 4000, salaryMax: 5000, currency: 'EUR', salaryPeriod: 'MONTHLY' },
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(vacancyApi.patchVacancyContactOffer).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({
          offer: expect.objectContaining({ salaryMin: 4000, salaryMax: 5000, currency: 'EUR', salaryPeriod: 'MONTHLY' }),
        }),
      ),
    );
  });
});
