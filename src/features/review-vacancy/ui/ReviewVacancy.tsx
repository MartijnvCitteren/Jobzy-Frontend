import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { categoryLabels, workplaceTypeLabels, formatSalary, type VacancyResponse } from '../../../entities/vacancy';
import {
  descriptionApi,
  type VacancyDescriptionResponse,
} from '../../../entities/vacancy-description';
import type { ApiError } from '../../../shared/api';
import { Button, Card, ErrorBanner, Skeleton, TextField } from '../../../shared/ui';
import styles from './ReviewVacancy.module.css';

export type ReviewVacancyGenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';
export type ReviewVacancyRegeneratableSection = 'summary' | 'jobDescription' | 'tasks';

export interface ReviewVacancyProps {
  vacancyId: string;
  vacancy: VacancyResponse;
  description?: VacancyDescriptionResponse;
  mode: 'manual' | 'ai' | null;
  phase?: ReviewVacancyGenerationPhase;
  onDescriptionSaved: (description: VacancyDescriptionResponse) => void;
  onRegenerate?: (section: ReviewVacancyRegeneratableSection) => void;
  onNavigateToStep: (step: number) => void;
  onViewPreview: () => void;
}

const emptyDescription: Required<Pick<VacancyDescriptionResponse, 'summary' | 'jobDescription' | 'tasks'>> = {
  summary: '',
  jobDescription: '',
  tasks: '',
};

export function ReviewVacancy({
  vacancyId,
  vacancy,
  description,
  mode,
  phase = 'idle',
  onDescriptionSaved,
  onRegenerate,
  onNavigateToStep,
  onViewPreview,
}: ReviewVacancyProps) {
  const [values, setValues] = useState({ ...emptyDescription, ...description });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (description) {
      setValues((prev) => ({ ...prev, ...description }));
    }
  }, [description]);

  const stillGenerating = mode === 'ai' && phase === 'generating' && !description;

  function setField(key: keyof typeof emptyDescription, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleViewPreview() {
    setError(undefined);
    setSaving(true);
    try {
      const saved = await descriptionApi.saveDescription(vacancyId, values);
      onDescriptionSaved(saved);
      onViewPreview();
    } catch (caught) {
      const apiError = caught as ApiError;
      setError(apiError.detail ?? apiError.title ?? 'Opslaan van de vacaturetekst is mislukt.');
    } finally {
      setSaving(false);
    }
  }

  function renderSectionHeader(label: string, section: ReviewVacancyRegeneratableSection) {
    return (
      <div className={styles.sectionHeader}>
        <span>{label}</span>
        {mode === 'ai' && onRegenerate && (
          <button
            type="button"
            className={styles.regenerateButton}
            onClick={() => onRegenerate(section)}
          >
            <RefreshCw size={13} aria-hidden="true" />
            Opnieuw
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <Card>
        <h2>Overzicht</h2>
        <p>Alles staat er. Pas aan wat nog niet klopt — elk onderdeel blijft bewerkbaar tot je publiceert.</p>

        <div className={styles.header}>
          <div>
            <div className={styles.title}>{vacancy.jobTitle}</div>
            <div className={styles.meta}>
              {categoryLabels[vacancy.category]} · {vacancy.location.city} ·{' '}
              {workplaceTypeLabels[vacancy.workplaceType]}
            </div>
          </div>
          <button type="button" className={styles.linkButton} onClick={() => onNavigateToStep(1)}>
            Aanpassen
          </button>
        </div>

        {stillGenerating ? (
          <div className={styles.skeletons}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="100%" height={10} />
            <Skeleton width="88%" height={10} />
            <Skeleton width="94%" height={10} />
          </div>
        ) : (
          <>
            <ErrorBanner message={error} />
            <div>
              {renderSectionHeader('Samenvatting', 'summary')}
              <TextField label="Samenvatting" value={values.summary} onChange={(v) => setField('summary', v)} />
            </div>
            <div>
              {renderSectionHeader('Over de rol', 'jobDescription')}
              <TextField
                label="Over de rol"
                value={values.jobDescription}
                onChange={(v) => setField('jobDescription', v)}
                multiline
              />
            </div>
            <div>
              {renderSectionHeader('Taken', 'tasks')}
              <TextField label="Taken" value={values.tasks} onChange={(v) => setField('tasks', v)} multiline />
            </div>
          </>
        )}

        <hr />
        <div className={styles.header}>
          <h3>Contact en voorwaarden</h3>
          <button type="button" className={styles.linkButton} onClick={() => onNavigateToStep(3)}>
            Aanpassen
          </button>
        </div>
        {vacancy.contactPerson && (
          <p className={styles.contactLine}>
            {vacancy.contactPerson.name}
            {vacancy.contactPerson.role ? ` · ${vacancy.contactPerson.role}` : ''} ·{' '}
            {vacancy.contactPerson.email}
          </p>
        )}
        <p className={styles.salaryLine}>{formatSalary(vacancy.offer)}</p>
      </Card>
      <Button type="button" disabled={saving || stillGenerating} onClick={handleViewPreview}>
        Bekijk je vacature
      </Button>
    </div>
  );
}
