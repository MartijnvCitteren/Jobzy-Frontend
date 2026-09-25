import { describe, expect, it } from 'vitest';
import { categoryOptions, salaryPeriodOptions, workplaceTypeOptions } from './labels';

describe('categoryOptions', () => {
  it('has one Dutch-labelled option per API VacancyCategory value (21 total)', () => {
    expect(categoryOptions).toHaveLength(21);
    for (const option of categoryOptions) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });
});

describe('workplaceTypeOptions', () => {
  it('has one option per WorkplaceType value', () => {
    expect(workplaceTypeOptions.map((o) => o.value).sort()).toEqual(['HYBRID', 'ONSITE', 'REMOTE']);
  });
});

describe('salaryPeriodOptions', () => {
  it('has exactly the 3 API enum values, no DAILY', () => {
    expect(salaryPeriodOptions.map((o) => o.value).sort()).toEqual(['ANNUAL', 'HOURLY', 'MONTHLY']);
  });
});
