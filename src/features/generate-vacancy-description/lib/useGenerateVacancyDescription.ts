import { useCallback, useRef, useState } from 'react';
import { descriptionApi, type VacancyDescriptionResponse } from '../../../entities/vacancy-description';
import { pollUntil } from '../../../shared/lib/polling';
import type { ApiError } from '../../../shared/api';

export type GenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';

export interface GenerateVacancyDescriptionInputs {
  mostImportantTasks: string;
  team: string;
  whyNiceJob: string;
}

export type RegeneratableSection = 'summary' | 'jobDescription' | 'tasks';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

const FAILURE_MESSAGE =
  'Genereren van de vacaturetekst is mislukt. Je kunt de tekst hieronder handmatig invullen.';

export function useGenerateVacancyDescription(vacancyId: string) {
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [result, setResult] = useState<VacancyDescriptionResponse | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const lastInputs = useRef<GenerateVacancyDescriptionInputs | undefined>(undefined);

  const runGeneration = useCallback(
    async (inputs: GenerateVacancyDescriptionInputs) => {
      setError(undefined);
      setPhase('generating');
      lastInputs.current = inputs;
      try {
        const started = await descriptionApi.generateDescription(vacancyId, inputs);
        const generation = await pollUntil(
          () => descriptionApi.getGenerationStatus(vacancyId, started.generationId),
          (status) => status.status === 'COMPLETED' || status.status === 'FAILED',
          { intervalMs: POLL_INTERVAL_MS, timeoutMs: POLL_TIMEOUT_MS },
        );

        if (generation.status === 'FAILED' || !generation.description) {
          setError(FAILURE_MESSAGE);
          setPhase('failed');
          return;
        }

        setResult(generation.description);
        setPhase('ready');
      } catch (caught) {
        const apiError = caught as ApiError;
        setError(apiError.detail ?? apiError.title ?? FAILURE_MESSAGE);
        setPhase('failed');
      }
    },
    [vacancyId],
  );

  const start = useCallback(
    (inputs: GenerateVacancyDescriptionInputs) => runGeneration(inputs),
    [runGeneration],
  );

  const regenerate = useCallback(
    async (section: RegeneratableSection) => {
      if (!lastInputs.current) return;
      const previous = result;
      await runGeneration(lastInputs.current);
      setResult((current) => {
        if (!current) return current;
        if (!previous) return current;
        return { ...previous, [section]: current[section] };
      });
    },
    [runGeneration, result],
  );

  return { phase, result, error, start, regenerate };
}
