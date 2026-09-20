import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vacancyApi } from '../../../entities/vacancy';
import { VacancyCoreForm } from './VacancyCoreForm';
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

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Functietitel'), 'Senior Backend Developer');
  await user.selectOptions(screen.getByLabelText('Categorie'), 'ENGINEERING');
  await user.selectOptions(screen.getByLabelText('Land'), 'NL');
  await user.type(screen.getByLabelText('Stad'), 'Amsterdam');
  await user.click(screen.getByRole('button', { name: 'Hybride' }));
  await user.clear(screen.getByLabelText('Uren per week (minimum)'));
  await user.type(screen.getByLabelText('Uren per week (minimum)'), '24');
  await user.clear(screen.getByLabelText('Uren per week (maximum)'));
  await user.type(screen.getByLabelText('Uren per week (maximum)'), '36');
}

describe('VacancyCoreForm', () => {
  beforeEach(() => {
    vi.mocked(vacancyApi.createVacancy).mockReset();
    vi.mocked(vacancyApi.patchVacancyCore).mockReset();
  });

  it('shows the selected country ISO2 code as a suffix on the Land select', async () => {
    const user = userEvent.setup();
    render(<VacancyCoreForm vacancyId={null} onSaved={vi.fn()} />);

    expect(screen.queryByText('NL', { selector: 'span' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Land'), 'NL');

    expect(screen.getByText('NL', { selector: 'span' })).toBeInTheDocument();
  });

  it('shows required-field validation errors and does not submit when the form is empty', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<VacancyCoreForm vacancyId={null} onSaved={onSaved} />);

    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByText('Functietitel is verplicht.')).toBeInTheDocument();
    expect(vacancyApi.createVacancy).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('calls createVacancy on first save (no vacancyId yet)', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    const onSaved = vi.fn();
    render(<VacancyCoreForm vacancyId={null} onSaved={onSaved} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() => expect(vacancyApi.createVacancy).toHaveBeenCalledTimes(1));
    expect(vacancyApi.patchVacancyCore).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledWith(createdVacancy);
  });

  it('calls patchVacancyCore on resubmission when a vacancyId already exists', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.patchVacancyCore).mockResolvedValue(createdVacancy);
    const onSaved = vi.fn();
    render(
      <VacancyCoreForm
        vacancyId="vacancy-1"
        initialValues={{
          jobTitle: 'Senior Backend Developer',
          category: 'ENGINEERING',
          country: 'NL',
          city: 'Amsterdam',
          workplaceType: 'HYBRID',
          minHoursPerWeek: 24,
          maxHoursPerWeek: 36,
        }}
        onSaved={onSaved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() => expect(vacancyApi.patchVacancyCore).toHaveBeenCalledTimes(1));
    expect(vacancyApi.createVacancy).not.toHaveBeenCalled();
    expect(vacancyApi.patchVacancyCore).toHaveBeenCalledWith('vacancy-1', {
      jobTitle: 'Senior Backend Developer',
      category: 'ENGINEERING',
      location: { country: 'NL', city: 'Amsterdam' },
      workplaceType: 'HYBRID',
    });
  });

  it('renders per-field errors from a 400 ApiError response', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockRejectedValue({
      title: 'Validation failed',
      status: 400,
      errors: [{ field: 'jobTitle', message: 'Titel is te kort.' }],
    });
    render(<VacancyCoreForm vacancyId={null} onSaved={vi.fn()} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByText('Titel is te kort.')).toBeInTheDocument();
  });

  it('renders a top-level error banner for a non-field/unreachable-backend error', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockRejectedValue({
      title: 'Netwerkfout: de server is niet bereikbaar.',
      status: 0,
    });
    render(<VacancyCoreForm vacancyId={null} onSaved={vi.fn()} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Netwerkfout: de server is niet bereikbaar.');
  });

  it('calls onSaved (page lifts "Concept opgeslagen" display, per §10.1 item 7) after a successful save', async () => {
    const user = userEvent.setup();
    vi.mocked(vacancyApi.createVacancy).mockResolvedValue(createdVacancy);
    const onSaved = vi.fn();
    render(<VacancyCoreForm vacancyId={null} onSaved={onSaved} />);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Bewaren als concept' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(createdVacancy));
  });

  it('renders the hours-per-week fields as read-only once a vacancyId already exists', () => {
    render(
      <VacancyCoreForm
        vacancyId="vacancy-1"
        initialValues={{
          jobTitle: 'Senior Backend Developer',
          category: 'ENGINEERING',
          country: 'NL',
          city: 'Amsterdam',
          workplaceType: 'HYBRID',
          minHoursPerWeek: 24,
          maxHoursPerWeek: 36,
        }}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Uren per week (minimum)')).toBeDisabled();
    expect(screen.getByLabelText('Uren per week (maximum)')).toBeDisabled();
    expect(
      screen.getByText('Uren per week kunnen na aanmaken niet meer worden aangepast.'),
    ).toBeInTheDocument();
  });
});
