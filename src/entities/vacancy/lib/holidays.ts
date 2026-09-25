/**
 * `Offer.numberOfHolidays` is a bare, period-less annual-FTE number on the wire — see
 * ADR-0005. The UI offers a week/month/year input for convenience and converts to/from
 * the annual figure client-side; no `holidayPeriod` field exists on the contract.
 */
export type HolidayPeriod = 'WEEKLY' | 'MONTHLY' | 'ANNUAL';

const multiplierPerYear: Record<HolidayPeriod, number> = {
  WEEKLY: 52,
  MONTHLY: 12,
  ANNUAL: 1,
};

const holidayPeriodSuffixes: Record<HolidayPeriod, string> = {
  WEEKLY: 'per week',
  MONTHLY: 'per maand',
  ANNUAL: 'per jaar',
};

export const holidayPeriodLabels: Record<HolidayPeriod, string> = {
  WEEKLY: 'Per week',
  MONTHLY: 'Per maand',
  ANNUAL: 'Per jaar',
};

export const holidayPeriodOptions = (Object.keys(holidayPeriodLabels) as HolidayPeriod[]).map((value) => ({
  value,
  label: holidayPeriodLabels[value],
}));

export function toAnnualHolidayDays(amount: number, period: HolidayPeriod): number {
  return amount * multiplierPerYear[period];
}

export function fromAnnualHolidayDays(annual: number, period: HolidayPeriod): number {
  return annual / multiplierPerYear[period];
}

export function formatHolidayDays(amount: number, period: HolidayPeriod): string {
  return `${amount} dagen ${holidayPeriodSuffixes[period]}`;
}
