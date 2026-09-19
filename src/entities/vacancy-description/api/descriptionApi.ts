import { httpClient } from '../../../shared/api';
import type {
  GenerateVacancyDescriptionRequest,
  VacancyDescriptionGeneration,
  VacancyDescriptionRequest,
  VacancyDescriptionResponse,
} from '../model/types';

export const descriptionApi = {
  generateDescription(
    vacancyId: string,
    body: GenerateVacancyDescriptionRequest,
  ): Promise<VacancyDescriptionGeneration> {
    return httpClient.post<VacancyDescriptionGeneration>(
      `/vacancy/${vacancyId}/generate-description`,
      body,
    );
  },
  getGenerationStatus(vacancyId: string, generationId: string): Promise<VacancyDescriptionGeneration> {
    return httpClient.get<VacancyDescriptionGeneration>(
      `/vacancy/${vacancyId}/generate-description/${generationId}`,
    );
  },
  saveDescription(vacancyId: string, body: VacancyDescriptionRequest): Promise<VacancyDescriptionResponse> {
    return httpClient.post<VacancyDescriptionResponse>(`/vacancy/${vacancyId}/description`, body);
  },
};
