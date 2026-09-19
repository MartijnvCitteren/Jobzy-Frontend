import { useState } from 'react';
import { descriptionApi, type VacancyDescriptionResponse } from '../../../entities/vacancy-description';
import { pollUntil } from '../../../shared/lib/polling';
import type { ApiError } from '../../../shared/api';
import { Button, Card, ErrorBanner, TextField } from '../../../shared/ui';

export interface GenerateVacancyDescriptionCardProps {
  vacancyId: string;
  onGenerated: (draft: VacancyDescriptionResponse) => void;
}

interface Inputs {
  mostImportantTasks: string;
  team: string;
  whyNiceJob: string;
}

const emptyInputs: Inputs = { mostImportantTasks: '', team: '', whyNiceJob: '' };

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

export function GenerateVacancyDescriptionCard({ vacancyId, onGenerated }: GenerateVacancyDescriptionCardProps) {
  const [inputs, setInputs] = useState<Inputs>(emptyInputs);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  function setField<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  async function generate() {
    setError(undefined);
    setGenerating(true);
    try {
      const started = await descriptionApi.generateDescription(vacancyId, inputs);
      const result = await pollUntil(
        () => descriptionApi.getGenerationStatus(vacancyId, started.generationId),
        (generation) => generation.status === 'COMPLETED' || generation.status === 'FAILED',
        { intervalMs: POLL_INTERVAL_MS, timeoutMs: POLL_TIMEOUT_MS },
      );

      if (result.status === 'FAILED' || !result.description) {
        setError('Genereren van de vacaturetekst is mislukt. Je kunt de tekst hieronder handmatig invullen.');
        return;
      }

      onGenerated(result.description);
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(
        apiError.detail ??
          apiError.title ??
          'Genereren van de vacaturetekst is mislukt. Je kunt de tekst hieronder handmatig invullen.',
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card variant="advice">
      <h3>Genereer met AI</h3>
      <ErrorBanner message={error} />
      <TextField
        label="Belangrijkste taken"
        value={inputs.mostImportantTasks}
        onChange={(value) => setField('mostImportantTasks', value)}
        maxLength={1000}
        multiline
      />
      <TextField
        label="Team"
        value={inputs.team}
        onChange={(value) => setField('team', value)}
        maxLength={1000}
        multiline
      />
      <TextField
        label="Waarom een leuke baan"
        value={inputs.whyNiceJob}
        onChange={(value) => setField('whyNiceJob', value)}
        maxLength={1000}
        multiline
      />
      <Button type="button" disabled={generating} onClick={generate}>
        Genereer met AI
      </Button>
    </Card>
  );
}
