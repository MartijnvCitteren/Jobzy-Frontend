import type { Offer } from '../model/types';

const salaryPeriodSuffixes: Record<NonNullable<Offer['salaryPeriod']>, string> = {
  HOURLY: 'per uur',
  MONTHLY: 'per maand',
  ANNUAL: 'per jaar',
};

function formatAmount(amount: number): string {
  return `€${amount.toLocaleString('nl-NL')}`;
}

export function formatSalary(offer: Offer | null | undefined): string {
  if (!offer || (offer.salaryMin == null && offer.salaryMax == null)) {
    return 'Salaris in overleg';
  }

  const amount =
    offer.salaryMin != null && offer.salaryMax != null
      ? `${formatAmount(offer.salaryMin)} – ${formatAmount(offer.salaryMax)}`
      : formatAmount(offer.salaryMin ?? offer.salaryMax!);

  const suffix = offer.salaryPeriod ? ` ${salaryPeriodSuffixes[offer.salaryPeriod]}` : '';

  return `${amount}${suffix}`;
}
