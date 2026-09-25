import type { ApiErrorDetail } from '../api/http-client';

export function toFieldErrors(errors: ApiErrorDetail[] | undefined): Record<string, string> {
  if (!errors) {
    return {};
  }
  return errors.reduce<Record<string, string>>((acc, { field, message }) => {
    acc[field] = message;
    return acc;
  }, {});
}
