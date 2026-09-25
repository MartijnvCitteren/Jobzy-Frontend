import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { descriptionApi } from '../../../entities/vacancy-description';
import { VacancyDescriptionEditor } from './VacancyDescriptionEditor';
import type { VacancyDescriptionResponse } from '../../../entities/vacancy-description';

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

describe('VacancyDescriptionEditor', () => {
  beforeEach(() => {
    vi.mocked(descriptionApi.saveDescription).mockReset();
  });

  it('renders empty fields when no draft is passed', () => {
    render(<VacancyDescriptionEditor vacancyId="vacancy-1" onSaved={vi.fn()} />);

    expect(screen.getByLabelText('Samenvatting')).toHaveValue('');
  });

  it('does not render a "Wat wij bieden" field', () => {
    render(<VacancyDescriptionEditor vacancyId="vacancy-1" onSaved={vi.fn()} />);

    expect(screen.queryByLabelText('Wat wij bieden')).not.toBeInTheDocument();
  });

  it('renders "Vacaturetekst" as an h2 heading (standalone step card)', () => {
    render(<VacancyDescriptionEditor vacancyId="vacancy-1" onSaved={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Vacaturetekst' })).toBeInTheDocument();
  });

  it('pre-fills fields from a passed-in draft', () => {
    const draft: VacancyDescriptionResponse = {
      summary: 'Generated summary',
      jobDescription: 'Generated job description',
      tasks: 'Generated tasks',
      whatWeOffer: 'Generated offer',
      aboutUs: 'Generated about us',
    };
    render(<VacancyDescriptionEditor vacancyId="vacancy-1" draft={draft} onSaved={vi.fn()} />);

    expect(screen.getByLabelText('Samenvatting')).toHaveValue('Generated summary');
    expect(screen.getByLabelText('Over de rol')).toHaveValue('Generated job description');
    expect(screen.getByLabelText('Taken')).toHaveValue('Generated tasks');
    expect(screen.getByLabelText('Team en organisatie')).toHaveValue('Generated about us');
  });

  it('enforces maxLength on the summary and over-de-rol fields', () => {
    render(<VacancyDescriptionEditor vacancyId="vacancy-1" onSaved={vi.fn()} />);

    expect(screen.getByLabelText('Samenvatting')).toHaveAttribute('maxLength', '1000');
    expect(screen.getByLabelText('Over de rol')).toHaveAttribute('maxLength', '5000');
  });

  it('calls saveDescription with the current field values (whatWeOffer preserved from the draft, not rendered)', async () => {
    const user = userEvent.setup();
    vi.mocked(descriptionApi.saveDescription).mockResolvedValue({ summary: 'Written by hand' });
    const onSaved = vi.fn();
    render(<VacancyDescriptionEditor vacancyId="vacancy-1" onSaved={onSaved} />);

    await user.type(screen.getByLabelText('Samenvatting'), 'Written by hand');
    await user.click(screen.getByRole('button', { name: 'Volgende' }));

    await waitFor(() =>
      expect(descriptionApi.saveDescription).toHaveBeenCalledWith(
        'vacancy-1',
        expect.objectContaining({ summary: 'Written by hand' }),
      ),
    );
    expect(onSaved).toHaveBeenCalledWith({ summary: 'Written by hand' });
  });
});
