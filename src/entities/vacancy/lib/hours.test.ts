import { describe, expect, it } from 'vitest';
import { formatHoursPerWeek } from './hours';

describe('formatHoursPerWeek', () => {
  it('collapses to a single figure when min and max are equal', () => {
    expect(formatHoursPerWeek(40, 40)).toBe('40 uur per week');
  });

  it('renders a range when min and max differ', () => {
    expect(formatHoursPerWeek(32, 40)).toBe('32–40 uur per week');
  });
});
