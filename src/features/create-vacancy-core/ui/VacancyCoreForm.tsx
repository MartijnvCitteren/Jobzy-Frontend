import { useState } from 'react';
import {
  categoryOptions,
  vacancyApi,
  workplaceTypeOptions,
  type VacancyCategory,
  type VacancyResponse,
  type WorkplaceType,
} from '../../../entities/vacancy';
import { countries } from '../../../entities/location';
import { toFieldErrors } from '../../../shared/lib/problem-details';
import type { ApiError } from '../../../shared/api';
import { Button, Card, ErrorBanner, NumberField, Select, SegmentedControl, TextField } from '../../../shared/ui';
import styles from './VacancyCoreForm.module.css';

export interface VacancyCoreFormValues {
  jobTitle: string;
  category: VacancyCategory | '';
  country: string;
  city: string;
  workplaceType: WorkplaceType;
  minHoursPerWeek: number | '';
  maxHoursPerWeek: number | '';
}

export interface VacancyCoreFormProps {
  vacancyId: string | null;
  initialValues?: Partial<VacancyCoreFormValues>;
  onSaved: (vacancy: VacancyResponse) => void;
  /** Called in addition to onSaved when the user clicks "Volgende" (not "Bewaren als concept"). */
  onNext?: (vacancy: VacancyResponse) => void;
}

const emptyValues: VacancyCoreFormValues = {
  jobTitle: '',
  category: '',
  country: '',
  city: '',
  workplaceType: 'ONSITE',
  minHoursPerWeek: '',
  maxHoursPerWeek: '',
};

function validate(values: VacancyCoreFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.jobTitle.trim().length < 2) {
    errors.jobTitle = 'Functietitel is verplicht.';
  }
  if (!values.category) {
    errors.category = 'Categorie is verplicht.';
  }
  if (!values.country) {
    errors.country = 'Land is verplicht.';
  }
  if (!values.city.trim()) {
    errors.city = 'Stad is verplicht.';
  }
  if (values.minHoursPerWeek === '' || values.minHoursPerWeek < 0 || values.minHoursPerWeek > 60) {
    errors.minHoursPerWeek = 'Vul een geldig minimum aantal uren in (0-60).';
  }
  if (values.maxHoursPerWeek === '' || values.maxHoursPerWeek <= 1 || values.maxHoursPerWeek > 60) {
    errors.maxHoursPerWeek = 'Vul een geldig maximum aantal uren in (>1-60).';
  }
  return errors;
}

export function VacancyCoreForm({ vacancyId, initialValues, onSaved, onNext }: VacancyCoreFormProps) {
  const [values, setValues] = useState<VacancyCoreFormValues>({ ...emptyValues, ...initialValues });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [topLevelError, setTopLevelError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const hoursReadOnly = vacancyId !== null;

  function setField<K extends keyof VacancyCoreFormValues>(key: K, value: VacancyCoreFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save(advance: boolean) {
    const errors = validate(values);
    setFieldErrors(errors);
    setTopLevelError(undefined);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const location = { country: values.country, city: values.city };
      let vacancy: VacancyResponse;
      if (!vacancyId) {
        vacancy = await vacancyApi.createVacancy({
          jobTitle: values.jobTitle,
          category: values.category as VacancyCategory,
          location,
          workplaceType: values.workplaceType,
          minHoursPerWeek: values.minHoursPerWeek as number,
          maxHoursPerWeek: values.maxHoursPerWeek as number,
        });
      } else {
        vacancy = await vacancyApi.patchVacancyCore(vacancyId, {
          jobTitle: values.jobTitle,
          category: values.category as VacancyCategory,
          location,
          workplaceType: values.workplaceType,
        });
      }
      onSaved(vacancy);
      if (advance) {
        onNext?.(vacancy);
      }
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 400 && apiError.errors?.length) {
        setFieldErrors(toFieldErrors(apiError.errors));
      } else {
        setTopLevelError(apiError.detail ?? apiError.title ?? 'Er is een onbekende fout opgetreden.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2>Basisgegevens</h2>
      <p>Deze velden bepalen waar je vacature terechtkomt en hoe kandidaten hem vinden.</p>
      <ErrorBanner message={topLevelError} />
      <TextField
        label="Functietitel"
        value={values.jobTitle}
        onChange={(value) => setField('jobTitle', value)}
        error={fieldErrors.jobTitle}
        maxLength={100}
      />
      <Select
        label="Categorie"
        value={values.category}
        onChange={(value) => setField('category', value as VacancyCategory)}
        options={categoryOptions}
        placeholder="Kies een categorie"
        error={fieldErrors.category}
      />
      <div className={styles.grid}>
        <Select
          label="Land"
          value={values.country}
          onChange={(value) => setField('country', value)}
          options={countries.map((c) => ({ value: c.code, label: c.labelNl }))}
          placeholder="Kies een land"
          error={fieldErrors.country}
          suffix={values.country || undefined}
        />
        <TextField
          label="Stad"
          value={values.city}
          onChange={(value) => setField('city', value)}
          error={fieldErrors.city}
          maxLength={200}
        />
      </div>
      <SegmentedControl
        label="Type werkplek"
        value={values.workplaceType}
        onChange={(value) => setField('workplaceType', value)}
        options={workplaceTypeOptions}
      />
      <div className={styles.grid}>
        <NumberField
          label="Uren per week (minimum)"
          value={values.minHoursPerWeek}
          onChange={(value) => setField('minHoursPerWeek', value)}
          error={fieldErrors.minHoursPerWeek}
          min={0}
          max={60}
          disabled={hoursReadOnly}
        />
        <NumberField
          label="Uren per week (maximum)"
          value={values.maxHoursPerWeek}
          onChange={(value) => setField('maxHoursPerWeek', value)}
          error={fieldErrors.maxHoursPerWeek}
          min={1}
          max={60}
          disabled={hoursReadOnly}
        />
      </div>
      {hoursReadOnly && <p>Uren per week kunnen na aanmaken niet meer worden aangepast.</p>}

      <div className={styles.footer}>
        <Button
          variant="text"
          type="button"
          className={styles.saveDraftButton}
          disabled={saving}
          onClick={() => save(false)}
        >
          Bewaren als concept
        </Button>
        <Button variant="primary" type="button" disabled={saving} onClick={() => save(true)}>
          Volgende
        </Button>
      </div>
    </Card>
  );
}
