import { describe, expect, it } from 'vitest';
import { formatSalary } from './salary';

describe('formatSalary', () => {
  it('formats a min/max range with the nl-NL thousands separator and period', () => {
    expect(formatSalary({ salaryMin: 4200, salaryMax: 5500, currency: 'EUR', salaryPeriod: 'MONTHLY' })).toBe(
      '€4.200 – €5.500 per maand',
    );
  });

  it('falls back to "Salaris in overleg" when no salary is set', () => {
    expect(formatSalary(undefined)).toBe('Salaris in overleg');
    expect(formatSalary({})).toBe('Salaris in overleg');
  });

  it('formats a single bound without a dash when only one of min/max is set', () => {
    expect(formatSalary({ salaryMin: 3000, currency: 'EUR', salaryPeriod: 'HOURLY' })).toBe('€3.000 per uur');
  });

  it('omits the period suffix when no salaryPeriod is set', () => {
    expect(formatSalary({ salaryMin: 3000, salaryMax: 4000 })).toBe('€3.000 – €4.000');
  });
});
