import { httpClient } from '../../../shared/api';
import type {
  ContactPerson,
  Location,
  Offer,
  VacancyCategory,
  VacancyCoreRequest,
  VacancyResponse,
  WorkplaceType,
} from '../model/types';

/**
 * Deliberately excludes hours-per-week: `VacancyUpdateRequest` has no contract-valid way
 * to change hours after creation. See ADR-0002.
 */
export interface VacancyCorePatch {
  jobTitle?: string;
  category?: VacancyCategory;
  location?: Location;
  workplaceType?: WorkplaceType;
}

export interface VacancyContactOfferPatch {
  contactPerson?: ContactPerson;
  offer?: Offer;
}

export const vacancyApi = {
  createVacancy(body: VacancyCoreRequest): Promise<VacancyResponse> {
    return httpClient.post<VacancyResponse>('/vacancy', body);
  },
  patchVacancyCore(id: string, body: VacancyCorePatch): Promise<VacancyResponse> {
    return httpClient.patch<VacancyResponse>(`/vacancy/${id}`, body);
  },
  patchVacancyContactOffer(id: string, body: VacancyContactOfferPatch): Promise<VacancyResponse> {
    return httpClient.patch<VacancyResponse>(`/vacancy/${id}`, body);
  },
  publishVacancy(id: string): Promise<VacancyResponse> {
    return httpClient.post<VacancyResponse>(`/vacancy/${id}/publish`, undefined);
  },
};
