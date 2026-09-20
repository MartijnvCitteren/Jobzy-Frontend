import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { AppShell } from '../../../widgets/app-shell';
import { VacancyCoreForm } from '../../../features/create-vacancy-core';
import { VacancyTextModeChoice, type VacancyTextMode } from '../../../features/choose-vacancy-text-mode';
import { ThreeQuestionsModal, useGenerateVacancyDescription } from '../../../features/generate-vacancy-description';
import { VacancyDescriptionEditor } from '../../../features/edit-vacancy-description';
import { VacancyContactOfferForm } from '../../../features/edit-vacancy-contact-offer';
import { ReviewVacancy } from '../../../features/review-vacancy';
import { VacancyPreview } from '../../../features/preview-vacancy';
import { PublishConfirmModal, PublishedConfirmation } from '../../../features/publish-vacancy';
import { Stepper } from '../../../shared/ui';
import type { VacancyDescriptionResponse } from '../../../entities/vacancy-description';
import type { VacancyResponse } from '../../../entities/vacancy';
import styles from './VacancyCreatePage.module.css';

const stepLabels = [
  { label: 'Basisgegevens' },
  { label: 'Vacaturetekst' },
  { label: 'Contact en voorwaarden' },
  { label: 'Overzicht' },
];

type View = 'wizard' | 'preview' | 'published';

export function VacancyCreatePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [vacancy, setVacancy] = useState<VacancyResponse | null>(null);
  const [view, setView] = useState<View>('wizard');
  const [mode, setMode] = useState<VacancyTextMode | null>(null);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedAt, setSavedAt] = useState<string | undefined>(undefined);
  const [manualDraft, setManualDraft] = useState<VacancyDescriptionResponse | undefined>(undefined);

  const generation = useGenerateVacancyDescription(vacancy?.id ?? '');

  function handleCoreSaved(saved: VacancyResponse) {
    setVacancy(saved);
    setHasSaved(true);
    setSavedAt(new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }));
  }

  function handleDescriptionSaved(description: VacancyDescriptionResponse) {
    setManualDraft(description);
    setVacancy((prev) => (prev ? { ...prev, description } : prev));
  }

  function handleModeChoiceNext() {
    if (mode === 'ai') {
      setQuestionsOpen(true);
    } else {
      setCurrentStep(3);
    }
  }

  const description = manualDraft ?? vacancy?.description ?? generation.result;

  return (
    <AppShell>
      {view === 'wizard' && (
        <>
          <div className={styles.header}>
            <h1>Nieuwe vacature</h1>
            {hasSaved && (
              <span className={styles.savedIndicator}>
                <CircleCheck size={15} aria-hidden="true" /> Concept opgeslagen om {savedAt}
              </span>
            )}
          </div>
          <Stepper
            steps={stepLabels}
            currentIndex={currentStep - 1}
            onStepClick={(index) => setCurrentStep((index + 1) as 1 | 2 | 3 | 4)}
            isReachable={(index) => index <= 1 || mode !== null}
          />

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
              onSaved={handleCoreSaved}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && vacancy && (
            <>
              <VacancyTextModeChoice mode={mode} onModeChange={setMode} onNext={handleModeChoiceNext} />
              <ThreeQuestionsModal
                open={questionsOpen}
                onClose={() => setQuestionsOpen(false)}
                onSubmit={(inputs) => {
                  generation.start(inputs);
                  setCurrentStep(3);
                }}
              />
            </>
          )}

          {currentStep === 3 && vacancy && mode === 'manual' && (
            <>
              <VacancyDescriptionEditor
                vacancyId={vacancy.id}
                draft={description}
                onSaved={handleDescriptionSaved}
              />
              <VacancyContactOfferForm
                vacancyId={vacancy.id}
                mode="manual"
                initialValues={{ contactPerson: vacancy.contactPerson, offer: vacancy.offer }}
                onSaved={(updated) => {
                  setVacancy(updated);
                  setCurrentStep(4);
                }}
              />
            </>
          )}

          {currentStep === 3 && vacancy && mode === 'ai' && (
            <VacancyContactOfferForm
              vacancyId={vacancy.id}
              mode="ai"
              phase={generation.phase}
              initialValues={{ contactPerson: vacancy.contactPerson, offer: vacancy.offer }}
              onSaved={(updated) => {
                setVacancy(updated);
                setCurrentStep(4);
              }}
            />
          )}

          {currentStep === 4 && vacancy && (
            <ReviewVacancy
              vacancyId={vacancy.id}
              vacancy={vacancy}
              description={description}
              mode={mode}
              phase={generation.phase}
              onDescriptionSaved={handleDescriptionSaved}
              onRegenerate={mode === 'ai' ? generation.regenerate : undefined}
              onNavigateToStep={(step) => setCurrentStep(step as 1 | 2 | 3 | 4)}
              onViewPreview={() => setView('preview')}
            />
          )}
        </>
      )}

      {view === 'preview' && vacancy && (
        <VacancyPreview
          vacancy={vacancy}
          description={description}
          onBack={() => setView('wizard')}
          onSaveDraft={() => setView('wizard')}
          onRequestPublish={() => setConfirmOpen(true)}
        />
      )}

      {vacancy && (
        <PublishConfirmModal
          open={confirmOpen}
          vacancyId={vacancy.id}
          vacancyTitle={vacancy.jobTitle}
          onClose={() => setConfirmOpen(false)}
          onPublished={(published) => {
            setVacancy(published);
            setConfirmOpen(false);
            setView('published');
          }}
        />
      )}

      {view === 'published' && vacancy && (
        <PublishedConfirmation
          vacancyTitle={vacancy.jobTitle}
          onBackToOverview={() => navigate('/')}
          onViewVacancy={() => setView('preview')}
        />
      )}
    </AppShell>
  );
}
