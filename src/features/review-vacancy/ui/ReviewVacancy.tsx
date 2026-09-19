import { categoryLabels, workplaceTypeLabels, type VacancyResponse } from '../../../entities/vacancy';
import { Button, Card } from '../../../shared/ui';

export interface ReviewVacancyProps {
  vacancy: VacancyResponse;
  onComplete: () => void;
}

export function ReviewVacancy({ vacancy, onComplete }: ReviewVacancyProps) {
  return (
    <div>
      <Card>
        <h2>Overzicht</h2>

        <section>
          <h3>Basisgegevens</h3>
          <p>{vacancy.jobTitle}</p>
          <p>{categoryLabels[vacancy.category]}</p>
          <p>{vacancy.location.city}</p>
          <p>{workplaceTypeLabels[vacancy.workplaceType]}</p>
          <p>
            {vacancy.minHoursPerWeek} - {vacancy.maxHoursPerWeek} uur per week
          </p>
        </section>

        {vacancy.description && (
          <section>
            <h3>Vacaturetekst</h3>
            <p>{vacancy.description.summary}</p>
          </section>
        )}

        {vacancy.contactPerson && (
          <section>
            <h3>Contactpersoon</h3>
            <p>{vacancy.contactPerson.name}</p>
            <p>{vacancy.contactPerson.email}</p>
          </section>
        )}

        {vacancy.offer && (
          <section>
            <h3>Aanbod</h3>
            <p>
              {vacancy.offer.salaryMin} - {vacancy.offer.salaryMax} {vacancy.offer.currency}
            </p>
          </section>
        )}
      </Card>
      <Button type="button" onClick={onComplete}>
        Voltooien
      </Button>
    </div>
  );
}
