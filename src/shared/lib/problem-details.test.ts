import { describe, expect, it } from 'vitest';
import { toFieldErrors } from './problem-details';

describe('toFieldErrors', () => {
  it('turns an array of field errors into a field-keyed message map', () => {
    const result = toFieldErrors([
      { field: 'jobTitle', message: 'is verplicht' },
      { field: 'category', message: 'is ongeldig' },
    ]);

    expect(result).toEqual({
      jobTitle: 'is verplicht',
      category: 'is ongeldig',
    });
  });

  it('returns an empty object for undefined input', () => {
    expect(toFieldErrors(undefined)).toEqual({});
  });

  it('returns an empty object for an empty array', () => {
    expect(toFieldErrors([])).toEqual({});
  });

  it('keeps the last message when the same field appears twice', () => {
    const result = toFieldErrors([
      { field: 'jobTitle', message: 'first' },
      { field: 'jobTitle', message: 'second' },
    ]);

    expect(result).toEqual({ jobTitle: 'second' });
  });
});
