import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../../widgets/app-shell';
import { VacancyCoreForm } from '../../../features/create-vacancy-core';
import { GenerateVacancyDescriptionCard } from '../../../features/generate-vacancy-description';
import { VacancyDescriptionEditor } from '../../../features/edit-vacancy-description';
import { VacancyContactOfferForm } from '../../../features/edit-vacancy-contact-offer';
import { ReviewVacancy } from '../../../features/review-vacancy';
import { Stepper } from '../../../shared/ui';
import type { VacancyDescriptionResponse } from '../../../entities/vacancy-description';
import type { VacancyResponse } from '../../../entities/vacancy';

const stepLabels = [
  { label: 'Basisgegevens' },
  { label: 'Vacaturetekst' },
  { label: 'Contact en voorwaarden' },
  { label: 'Overzicht' },
];

export function VacancyCreatePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [vacancy, setVacancy] = useState<VacancyResponse | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<VacancyDescriptionResponse | undefined>(undefined);

  return (
    <AppShell>
      <p>Vacatures / Nieuwe vacature</p>
      <h1>Nieuwe vacature</h1>
      <Stepper steps={stepLabels} currentIndex={currentStep - 1} />

      {currentStep === 1 && (
        <VacancyCoreForm
          vacancyId={vacancy?.id ?? null}
          initialValues={
            vacancy
              ? {
                  jobTitle: vacancy.jobTitle,
                  category: vacancy.category,
                  country: vacancy.location.country,
                  city: vacancy.location.city,
                  workplaceType: vacancy.workplaceType,
                  minHoursPerWeek: vacancy.minHoursPerWeek,
                  maxHoursPerWeek: vacancy.maxHoursPerWeek,
                }
              : undefined
          }
          onSaved={setVacancy}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && vacancy && (
        <>
          <GenerateVacancyDescriptionCard vacancyId={vacancy.id} onGenerated={setGeneratedDraft} />
          <VacancyDescriptionEditor
            vacancyId={vacancy.id}
            draft={generatedDraft}
            onSaved={(description) => {
              setVacancy((prev) => (prev ? { ...prev, description } : prev));
              setCurrentStep(3);
            }}
          />
        </>
      )}

      {currentStep === 3 && vacancy && (
        <VacancyContactOfferForm
          vacancyId={vacancy.id}
          onSaved={(updated) => {
            setVacancy(updated);
            setCurrentStep(4);
          }}
        />
      )}

      {currentStep === 4 && vacancy && (
        <ReviewVacancy
          vacancy={vacancy}
          onComplete={() => {
            // No dashboard/list page exists yet in this pass (out of scope) — navigating
            // to "/" redirects back into a fresh "Nieuwe vacature" flow, per the plan's
            // explicit "link targets may be stubbed" note.
            navigate('/');
          }}
        />
      )}
    </AppShell>
  );
}
