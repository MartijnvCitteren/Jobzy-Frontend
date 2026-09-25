import { describe, expect, it } from 'vitest';
import { fromAnnualHolidayDays, formatHolidayDays, holidayPeriodOptions, toAnnualHolidayDays } from './holidays';

describe('holidayPeriodOptions', () => {
  it('has exactly the 3 supported periods', () => {
    expect(holidayPeriodOptions.map((o) => o.value).sort()).toEqual(['ANNUAL', 'MONTHLY', 'WEEKLY']);
  });
});

describe('toAnnualHolidayDays', () => {
  it('multiplies a weekly amount by 52', () => {
    expect(toAnnualHolidayDays(5, 'WEEKLY')).toBe(260);
  });

  it('multiplies a monthly amount by 12', () => {
    expect(toAnnualHolidayDays(2, 'MONTHLY')).toBe(24);
  });

  it('leaves an annual amount unchanged', () => {
    expect(toAnnualHolidayDays(20, 'ANNUAL')).toBe(20);
  });
});

describe('fromAnnualHolidayDays', () => {
  it('divides an annual amount by 52 for weekly redisplay', () => {
    expect(fromAnnualHolidayDays(260, 'WEEKLY')).toBe(5);
  });

  it('divides an annual amount by 12 for monthly redisplay', () => {
    expect(fromAnnualHolidayDays(24, 'MONTHLY')).toBe(2);
  });

  it('leaves an annual amount unchanged', () => {
    expect(fromAnnualHolidayDays(20, 'ANNUAL')).toBe(20);
  });
});

describe('formatHolidayDays', () => {
  it('formats an annual amount', () => {
    expect(formatHolidayDays(20, 'ANNUAL')).toBe('20 dagen per jaar');
  });

  it('formats a weekly amount', () => {
    expect(formatHolidayDays(5, 'WEEKLY')).toBe('5 dagen per week');
  });

  it('formats a monthly amount', () => {
    expect(formatHolidayDays(2, 'MONTHLY')).toBe('2 dagen per maand');
  });
});
