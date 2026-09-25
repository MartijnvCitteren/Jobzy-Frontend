import { useCallback, useState } from 'react';
import { vacancyApi, type VacancyResponse } from '../../../entities/vacancy';
import type { ApiError } from '../../../shared/api';

export function usePublishVacancy() {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const publish = useCallback(async (vacancyId: string): Promise<VacancyResponse> => {
    setError(undefined);
    setPublishing(true);
    try {
      return await vacancyApi.publishVacancy(vacancyId);
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(apiError.detail ?? apiError.title ?? 'Publiceren van de vacature is mislukt.');
      throw caught;
    } finally {
      setPublishing(false);
    }
  }, []);

  return { publish, publishing, error };
}
