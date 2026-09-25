export function formatHoursPerWeek(min: number, max: number): string {
  const range = min === max ? `${min}` : `${min}–${max}`;
  return `${range} uur per week`;
}
