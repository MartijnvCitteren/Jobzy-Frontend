import { describe, expect, it, vi } from 'vitest';
import { httpClient } from '../../../shared/api';
import { descriptionApi } from './descriptionApi';
import type {
  GenerateVacancyDescriptionRequest,
  VacancyDescriptionGeneration,
  VacancyDescriptionRequest,
  VacancyDescriptionResponse,
} from '../model/types';

vi.mock('../../../shared/api', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('descriptionApi', () => {
  it('generateDescription POSTs the short inputs to /vacancy/{id}/generate-description', async () => {
    const generation: VacancyDescriptionGeneration = { generationId: 'gen-1', status: 'PENDING' };
    vi.mocked(httpClient.post).mockResolvedValue(generation);
    const body: GenerateVacancyDescriptionRequest = {
      mostImportantTasks: 'Build things',
      team: 'Backend team',
      whyNiceJob: 'Great culture',
    };

    const result = await descriptionApi.generateDescription('vacancy-1', body);

    expect(httpClient.post).toHaveBeenCalledWith('/vacancy/vacancy-1/generate-description', body);
    expect(result).toEqual(generation);
  });

  it('getGenerationStatus GETs /vacancy/{id}/generate-description/{generationId}', async () => {
    const generation: VacancyDescriptionGeneration = { generationId: 'gen-1', status: 'COMPLETED' };
    vi.mocked(httpClient.get).mockResolvedValue(generation);

    const result = await descriptionApi.getGenerationStatus('vacancy-1', 'gen-1');

    expect(httpClient.get).toHaveBeenCalledWith('/vacancy/vacancy-1/generate-description/gen-1');
    expect(result).toEqual(generation);
  });

  it('saveDescription POSTs the description body to /vacancy/{id}/description', async () => {
    const response: VacancyDescriptionResponse = { summary: 'A summary' };
    vi.mocked(httpClient.post).mockResolvedValue(response);
    const body: VacancyDescriptionRequest = { summary: 'A summary' };

    const result = await descriptionApi.saveDescription('vacancy-1', body);

    expect(httpClient.post).toHaveBeenCalledWith('/vacancy/vacancy-1/description', body);
    expect(result).toEqual(response);
  });
});
