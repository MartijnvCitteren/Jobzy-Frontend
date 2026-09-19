import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { descriptionApi } from '../../../entities/vacancy-description';
import { GenerateVacancyDescriptionCard } from './GenerateVacancyDescriptionCard';
import type { VacancyDescriptionGeneration } from '../../../entities/vacancy-description';

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

async function fillInputs(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Belangrijkste taken'), 'Build the backend');
  await user.type(screen.getByLabelText('Team'), 'A small backend team');
  await user.type(screen.getByLabelText('Waarom een leuke baan'), 'Great impact');
}

describe('GenerateVacancyDescriptionCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(descriptionApi.generateDescription).mockReset();
    vi.mocked(descriptionApi.getGenerationStatus).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts generation, polls, and hands the completed draft up via onGenerated', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(descriptionApi.generateDescription).mockResolvedValue({
      generationId: 'gen-1',
      status: 'PENDING',
    });
    vi.mocked(descriptionApi.getGenerationStatus)
      .mockResolvedValueOnce({ generationId: 'gen-1', status: 'PENDING' })
      .mockResolvedValueOnce({
        generationId: 'gen-1',
        status: 'COMPLETED',
        description: { summary: 'Generated summary' },
      } as VacancyDescriptionGeneration);
    const onGenerated = vi.fn();

    render(<GenerateVacancyDescriptionCard vacancyId="vacancy-1" onGenerated={onGenerated} />);
    await fillInputs(user);
    await user.click(screen.getByRole('button', { name: 'Genereer met AI' }));

    await waitFor(() => expect(descriptionApi.generateDescription).toHaveBeenCalledTimes(1));

    await act(async () => { await vi.runAllTimersAsync(); });

    await waitFor(() => expect(onGenerated).toHaveBeenCalledWith({ summary: 'Generated summary' }));
  });

  it('shows a visible failure state when generation status is FAILED, without blocking the manual path', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(descriptionApi.generateDescription).mockResolvedValue({
      generationId: 'gen-1',
      status: 'PENDING',
    });
    vi.mocked(descriptionApi.getGenerationStatus).mockResolvedValue({
      generationId: 'gen-1',
      status: 'FAILED',
    });

    render(<GenerateVacancyDescriptionCard vacancyId="vacancy-1" onGenerated={vi.fn()} />);
    await fillInputs(user);
    await user.click(screen.getByRole('button', { name: 'Genereer met AI' }));

    await act(async () => { await vi.runAllTimersAsync(); });

    expect(await screen.findByRole('alert')).toHaveTextContent(/mislukt/i);
  });

  it('shows a visible failure state when the start call itself errors', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(descriptionApi.generateDescription).mockRejectedValue({
      title: 'Netwerkfout: de server is niet bereikbaar.',
      status: 0,
    });

    render(<GenerateVacancyDescriptionCard vacancyId="vacancy-1" onGenerated={vi.fn()} />);
    await fillInputs(user);
    await user.click(screen.getByRole('button', { name: 'Genereer met AI' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Netwerkfout: de server is niet bereikbaar.');
  });
});
