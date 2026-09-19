import { useState } from 'react';
import { salaryPeriodOptions, vacancyApi, type SalaryPeriod, type VacancyResponse } from '../../../entities/vacancy';
import type { ApiError } from '../../../shared/api';
import { Button, Card, ErrorBanner, NumberField, Select, TextField } from '../../../shared/ui';
import { currencyOptions } from '../lib/currencies';

export interface VacancyContactOfferFormProps {
  vacancyId: string;
  onSaved: (vacancy: VacancyResponse) => void;
}

interface FormValues {
  name: string;
  role: string;
  phone: string;
  email: string;
  salaryMin: number | '';
  salaryMax: number | '';
  currency: string;
  salaryPeriod: SalaryPeriod | '';
  numberOfHolidays: number | '';
}

const emptyValues: FormValues = {
  name: '',
  role: '',
  phone: '',
  email: '',
  salaryMin: '',
  salaryMax: '',
  currency: '',
  salaryPeriod: '',
  numberOfHolidays: '',
};

function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.name.trim().length < 2) {
    errors.name = 'Naam is verplicht.';
  }
  if (!values.email.trim()) {
    errors.email = 'E-mailadres is verplicht.';
  }

  const hasSalary = values.salaryMin !== '' || values.salaryMax !== '';
  if (hasSalary && !values.currency) {
    errors.currency = 'Valuta is verplicht bij een ingevuld salaris.';
  }
  if (hasSalary && !values.salaryPeriod) {
    errors.salaryPeriod = 'Salarisperiode is verplicht bij een ingevuld salaris.';
  }

  return errors;
}

export function VacancyContactOfferForm({ vacancyId, onSaved }: VacancyContactOfferFormProps) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [topLevelError, setTopLevelError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const errors = validate(values);
    setFieldErrors(errors);
    setTopLevelError(undefined);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const vacancy = await vacancyApi.patchVacancyContactOffer(vacancyId, {
        contactPerson: {
          name: values.name,
          role: values.role || undefined,
          phone: values.phone || undefined,
          email: values.email,
        },
        offer: {
          salaryMin: values.salaryMin === '' ? null : values.salaryMin,
          salaryMax: values.salaryMax === '' ? null : values.salaryMax,
          currency: values.currency || undefined,
          salaryPeriod: values.salaryPeriod || undefined,
          numberOfHolidays: values.numberOfHolidays === '' ? null : values.numberOfHolidays,
        },
      });
      onSaved(vacancy);
    } catch (caught) {
      const apiError = caught as ApiError;
      if (apiError.status === 400 && apiError.errors?.length) {
        setFieldErrors(Object.fromEntries(apiError.errors.map((e) => [e.field, e.message])));
      } else {
        setTopLevelError(apiError.detail ?? apiError.title ?? 'Opslaan is mislukt.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2>Contact en voorwaarden</h2>
      <ErrorBanner message={topLevelError} />
      <TextField label="Naam" value={values.name} onChange={(v) => setField('name', v)} error={fieldErrors.name} maxLength={50} />
      <TextField label="Rol" value={values.role} onChange={(v) => setField('role', v)} maxLength={100} />
      <TextField label="Telefoon" value={values.phone} onChange={(v) => setField('phone', v)} maxLength={20} />
      <TextField label="E-mailadres" value={values.email} onChange={(v) => setField('email', v)} error={fieldErrors.email} />

      <NumberField label="Salaris minimum" value={values.salaryMin} onChange={(v) => setField('salaryMin', v)} />
      <NumberField label="Salaris maximum" value={values.salaryMax} onChange={(v) => setField('salaryMax', v)} />
      <Select
        label="Valuta"
        value={values.currency}
        onChange={(v) => setField('currency', v)}
        options={currencyOptions}
        placeholder="Kies een valuta"
        error={fieldErrors.currency}
      />
      <Select
        label="Salarisperiode"
        value={values.salaryPeriod}
        onChange={(v) => setField('salaryPeriod', v as SalaryPeriod)}
        options={salaryPeriodOptions}
        placeholder="Kies een periode"
        error={fieldErrors.salaryPeriod}
      />
      <NumberField
        label="Aantal vakantiedagen"
        value={values.numberOfHolidays}
        onChange={(v) => setField('numberOfHolidays', v)}
      />

      <Button type="button" disabled={saving} onClick={save}>
        Volgende
      </Button>
    </Card>
  );
}
