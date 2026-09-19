import { describe, expect, it } from 'vitest';
import { countries } from './countries';

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
