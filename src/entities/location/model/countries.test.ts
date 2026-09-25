import { describe, expect, it } from 'vitest';
import { countries, countrySelectOptions, type Country } from './countries';

describe('countries', () => {
  it('has one entry per EU27 + United Kingdom + Switzerland (29 total)', () => {
    expect(countries).toHaveLength(29);
  });

  it('has valid ISO 3166-1 alpha-2 codes only', () => {
    for (const country of countries) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('has no duplicate codes', () => {
    const codes = countries.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('is sorted by the Dutch label', () => {
    const labels = countries.map((c) => c.labelNl);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, 'nl'));
    expect(labels).toEqual(sorted);
  });

  it('includes Nederland, United Kingdom and Switzerland', () => {
    const codes = countries.map((c) => c.code);
    expect(codes).toContain('NL');
    expect(codes).toContain('GB');
    expect(codes).toContain('CH');
  });
});

describe('countrySelectOptions', () => {
  it('leads with NL, BE, FR, DE in that fixed order (not alphabetical)', () => {
    const leadingCodes = countrySelectOptions
      .slice(0, 4)
      .map((item) => ('code' in item ? item.code : undefined));

    expect(leadingCodes).toEqual(['NL', 'BE', 'FR', 'DE']);
  });

  it('has exactly one separator entry, right after the preferred 4', () => {
    const separatorIndex = countrySelectOptions.findIndex((item) => !('code' in item));

    expect(separatorIndex).toBe(4);
    expect(countrySelectOptions.filter((item) => !('code' in item))).toHaveLength(1);
  });

  it('Dutch-alphabetically sorts the remaining 25 countries after the separator', () => {
    const rest = countrySelectOptions.slice(5) as Country[];
    const restCodes = rest.map((item) => item.code);

    expect(restCodes).not.toContain('NL');
    expect(restCodes).not.toContain('BE');
    expect(restCodes).not.toContain('FR');
    expect(restCodes).not.toContain('DE');
    expect(rest).toHaveLength(25);

    const labels = rest.map((item) => item.labelNl);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, 'nl'));
    expect(labels).toEqual(sorted);
  });

  it('has one entry per country plus one separator (30 total)', () => {
    expect(countrySelectOptions).toHaveLength(30);
  });
});
