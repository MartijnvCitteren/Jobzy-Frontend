import { useState } from 'react';
import { Sparkles, CircleCheck } from 'lucide-react';
import {
  holidayPeriodOptions,
  salaryPeriodOptions,
  toAnnualHolidayDays,
  vacancyApi,
  type ContactPerson,
  type HolidayPeriod,
  type Offer,
  type SalaryPeriod,
  type VacancyResponse,
} from '../../../entities/vacancy';
import type { ApiError } from '../../../shared/api';
import { Button, Card, Checkbox, ErrorBanner, NumberField, Select, TextField } from '../../../shared/ui';
import { currencyOptions } from '../lib/currencies';
import styles from './VacancyContactOfferForm.module.css';

/**
 * Deliberately not imported from `features/generate-vacancy-description` — features
 * don't import each other's internals (§10.3). The page threads the same phase value
 * from its single `useGenerateVacancyDescription()` instance via this prop.
 */
export type VacancyContactOfferGenerationPhase = 'idle' | 'generating' | 'ready' | 'failed';

export interface HolidayInput {
  amount: number;
  period: HolidayPeriod;
}

export interface VacancyContactOfferFormProps {
  vacancyId: string;
  onSaved: (vacancy: VacancyResponse) => void;
  mode?: 'manual' | 'ai';
  phase?: VacancyContactOfferGenerationPhase;
  initialValues?: {
    contactPerson?: ContactPerson;
    offer?: Offer;
  };
  /**
   * The vakantiedagen amount/period the user actually entered earlier this session
   * (ADR-0005, page-local `holidayInput` state), preferred over reconstructing from the
   * converted annual `offer.numberOfHolidays` figure when redisplaying this form (e.g.
   * navigating back to step 3 from Overzicht's "Aanpassen").
   */
  initialHolidayInput?: HolidayInput;
  /** Surfaces the raw entered vakantiedagen amount + period (ADR-0005) for §11.3's page-local `holidayInput` state. */
  onHolidayInputChange?: (input: HolidayInput | undefined) => void;
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

function toFormValues(
  initialValues: VacancyContactOfferFormProps['initialValues'],
  initialHolidayInput: HolidayInput | undefined,
): FormValues {
  const { contactPerson, offer } = initialValues ?? {};
  return {
    name: contactPerson?.name ?? '',
    role: contactPerson?.role ?? '',
    phone: contactPerson?.phone ?? '',
    email: contactPerson?.email ?? '',
    salaryMin: offer?.salaryMin ?? '',
    salaryMax: offer?.salaryMax ?? '',
    currency: offer?.currency ?? '',
    salaryPeriod: offer?.salaryPeriod ?? '',
    numberOfHolidays: initialHolidayInput?.amount ?? offer?.numberOfHolidays ?? '',
  };
}

function validate(values: FormValues, hideSalary: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.name.trim().length < 2) {
    errors.name = 'Naam is verplicht.';
  }
  if (!values.email.trim()) {
    errors.email = 'E-mailadres is verplicht.';
  }

  if (!hideSalary) {
    const hasSalary = values.salaryMin !== '' || values.salaryMax !== '';
    if (hasSalary && !values.currency) {
      errors.currency = 'Valuta is verplicht bij een ingevuld salaris.';
    }
    if (hasSalary && !values.salaryPeriod) {
      errors.salaryPeriod = 'Salarisperiode is verplicht bij een ingevuld salaris.';
    }
  }

  return errors;
}

function GenerationBanner({ phase }: { phase: VacancyContactOfferGenerationPhase }) {
  if (phase === 'ready') {
    return (
      <div className={styles.bannerReady}>
        <CircleCheck size={18} aria-hidden="true" />
        Je concepttekst staat klaar — je ziet hem in het overzicht bij de volgende stap.
      </div>
    );
  }

  return (
    <div className={styles.bannerGenerating}>
      <Sparkles size={18} aria-hidden="true" />
      We stellen je vacaturetekst op — ga jij alvast verder met contact en voorwaarden.
    </div>
  );
}

export function VacancyContactOfferForm({
  vacancyId,
  onSaved,
  mode = 'manual',
  phase = 'generating',
  initialValues,
  initialHolidayInput,
  onHolidayInputChange,
}: VacancyContactOfferFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initialValues, initialHolidayInput));
  const [holidayPeriod, setHolidayPeriod] = useState<HolidayPeriod>(initialHolidayInput?.period ?? 'ANNUAL');
  const [hideSalary, setHideSalary] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [topLevelError, setTopLevelError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const errors = validate(values, hideSalary);
    setFieldErrors(errors);
    setTopLevelError(undefined);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const submittedContactPerson: ContactPerson = {
        name: values.name,
        role: values.role || undefined,
        phone: values.phone || undefined,
        email: values.email,
      };
      const submittedOffer: Offer = {
        salaryMin: hideSalary || values.salaryMin === '' ? null : values.salaryMin,
        salaryMax: hideSalary || values.salaryMax === '' ? null : values.salaryMax,
        currency: hideSalary ? undefined : values.currency || undefined,
        salaryPeriod: hideSalary ? undefined : values.salaryPeriod || undefined,
        numberOfHolidays:
          values.numberOfHolidays === '' ? null : toAnnualHolidayDays(values.numberOfHolidays, holidayPeriod),
      };
      const response = await vacancyApi.patchVacancyContactOffer(vacancyId, {
        contactPerson: submittedContactPerson,
        offer: submittedOffer,
      });
      // §11.2: `VacancyResponse` doesn't require contactPerson/offer — a response that
      // omits a section the user just submitted is contract-legal, so fall back to what
      // was sent rather than silently dropping it from what the page trusts as "saved".
      onSaved({
        ...response,
        contactPerson: response.contactPerson ?? submittedContactPerson,
        offer: response.offer ?? submittedOffer,
      });
      onHolidayInputChange?.(
        values.numberOfHolidays === '' ? undefined : { amount: values.numberOfHolidays, period: holidayPeriod },
      );
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
    <>
      {mode === 'ai' && <GenerationBanner phase={phase} />}
      <Card>
        <h2>Contact en voorwaarden</h2>
        <ErrorBanner message={topLevelError} />
        <div className={styles.contactGrid}>
          <TextField label="Naam" value={values.name} onChange={(v) => setField('name', v)} error={fieldErrors.name} maxLength={50} />
          <TextField label="Rol" value={values.role} onChange={(v) => setField('role', v)} maxLength={100} />
        </div>
        <div className={styles.contactGrid}>
          <TextField label="Telefoon" value={values.phone} onChange={(v) => setField('phone', v)} maxLength={20} />
          <TextField label="E-mailadres" value={values.email} onChange={(v) => setField('email', v)} error={fieldErrors.email} />
        </div>

        <div className={styles.salaryHeader}>
          <h3>Salaris en voorwaarden</h3>
          <Checkbox label="Liever niet delen" checked={hideSalary} onChange={setHideSalary} />
        </div>

        <div className={styles.salaryGrid}>
          {!hideSalary && (
            <>
              <NumberField label="Salaris minimum" value={values.salaryMin} onChange={(v) => setField('salaryMin', v)} />
              <NumberField label="Salaris maximum" value={values.salaryMax} onChange={(v) => setField('salaryMax', v)} />
              <Select
                label="Salarisperiode"
                value={values.salaryPeriod}
                onChange={(v) => setField('salaryPeriod', v as SalaryPeriod)}
                options={salaryPeriodOptions}
                placeholder="Kies een periode"
                error={fieldErrors.salaryPeriod}
              />
            </>
          )}
          <div className={styles.holidaysRow}>
            <NumberField
              label="Aantal vakantiedagen"
              value={values.numberOfHolidays}
              onChange={(v) => setField('numberOfHolidays', v)}
            />
            <Select
              label="Periode vakantiedagen"
              value={holidayPeriod}
              onChange={(v) => setHolidayPeriod(v as HolidayPeriod)}
              options={holidayPeriodOptions}
            />
          </div>
        </div>
        {!hideSalary && (
          <Select
            label="Valuta"
            value={values.currency}
            onChange={(v) => setField('currency', v)}
            options={currencyOptions}
            placeholder="Kies een valuta"
            error={fieldErrors.currency}
          />
        )}

        <Button type="button" disabled={saving} onClick={save}>
          Volgende
        </Button>
      </Card>
    </>
  );
}
