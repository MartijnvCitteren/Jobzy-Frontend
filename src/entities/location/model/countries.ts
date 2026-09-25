export interface Country {
  code: string;
  labelNl: string;
}

/**
 * Static reference data (EU27 + United Kingdom + Switzerland), hand-sourced once per the
 * plan — not derived from the API contract. Dutch-sorted.
 */
const unsorted: Country[] = [
  { code: 'AT', labelNl: 'Oostenrijk' },
  { code: 'BE', labelNl: 'België' },
  { code: 'BG', labelNl: 'Bulgarije' },
  { code: 'HR', labelNl: 'Kroatië' },
  { code: 'CY', labelNl: 'Cyprus' },
  { code: 'CZ', labelNl: 'Tsjechië' },
  { code: 'DK', labelNl: 'Denemarken' },
  { code: 'EE', labelNl: 'Estland' },
  { code: 'FI', labelNl: 'Finland' },
  { code: 'FR', labelNl: 'Frankrijk' },
  { code: 'DE', labelNl: 'Duitsland' },
  { code: 'GR', labelNl: 'Griekenland' },
  { code: 'HU', labelNl: 'Hongarije' },
  { code: 'IE', labelNl: 'Ierland' },
  { code: 'IT', labelNl: 'Italië' },
  { code: 'LV', labelNl: 'Letland' },
  { code: 'LT', labelNl: 'Litouwen' },
  { code: 'LU', labelNl: 'Luxemburg' },
  { code: 'MT', labelNl: 'Malta' },
  { code: 'NL', labelNl: 'Nederland' },
  { code: 'PL', labelNl: 'Polen' },
  { code: 'PT', labelNl: 'Portugal' },
  { code: 'RO', labelNl: 'Roemenië' },
  { code: 'SK', labelNl: 'Slowakije' },
  { code: 'SI', labelNl: 'Slovenië' },
  { code: 'ES', labelNl: 'Spanje' },
  { code: 'SE', labelNl: 'Zweden' },
  { code: 'GB', labelNl: 'Verenigd Koninkrijk' },
  { code: 'CH', labelNl: 'Zwitserland' },
];

export const countries: Country[] = [...unsorted].sort((a, b) => a.labelNl.localeCompare(b.labelNl, 'nl'));

/**
 * `Select`-ready country list for `VacancyCoreForm`'s Land field: the PO's most-used
 * countries first in a fixed (not alphabetical) order, then a visual separator, then the
 * rest Dutch-alphabetically — see plan §12 item 2. `countries` above stays the flat,
 * Dutch-sorted full list for code-to-label lookups (e.g. `VacancyPreview`).
 */
const preferredCountryCodes = ['NL', 'BE', 'FR', 'DE'];

const preferredCountries = preferredCountryCodes.map(
  (code) => countries.find((country) => country.code === code)!,
);

const remainingCountries = countries.filter((country) => !preferredCountryCodes.includes(country.code));

export const countrySelectOptions: (Country | { type: 'separator' })[] = [
  ...preferredCountries,
  { type: 'separator' },
  ...remainingCountries,
];
