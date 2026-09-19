# Design notes — Jobzy Nieuwe Vacature (vacancy creation)

Source: claude.ai/design project "Jobzy vacancy creation wireframe", file
`Jobzy Nieuwe Vacature - Webpagina.dc.html` (the file named in issue #4 as the one to implement).
Captured via interactive present-mode screenshot on 2026-09-19 (browser session, user's own login).
Only the step-1 frame is mocked in this file — steps 2-4 are inferred from the stepper labels,
the API contract, and the in-canvas design-change comment log (also captured below). This is
called out explicitly in `open-questions.md`.

## Global shell / navbar
- Logo: small rounded-square icon (dark green `Jobzy` wordmark), 30px per design-system spec, with a
  small violet/purple notification dot top-right of the icon.
- Nav items, right-aligned: Dashboard, Vacatures, Kandidaten, Statistieken. Active item ("Vacatures")
  has a light green pill background and dark green icon/text.
- Far right: circular avatar chip with initials ("MJ"), light green background. Opens an
  account menu with Account / Instellingen / Support (per design comment log — not directly observed).
- Header content width is constrained to a `--content-max` design token (not a fixed 1160px).
- Background: warm off-white (approx `#faf9f7`). Header has a thin bottom border, no shadow.

## Page chrome
- Breadcrumb: "Vacatures / Nieuwe vacature" (gray, current segment darker).
- Page title: "Nieuwe vacature", large bold.
- 4-step stepper, numbered circles connected by thin horizontal lines:
  1. Basisgegevens (Basic info)
  2. Vacaturetekst (Job description / text — this is the AI-generation + manual-edit step)
  3. Contact en voorwaarden (Contact person + offer/terms)
  4. Overzicht (Overview / review & save)
  - Active step: circle has a green outline + green number, label bold/dark.
  - Inactive step: circle is filled light gray with gray number, label gray.

## Step 1 — Basisgegevens (fully observed)
Card: white background, rounded corners (~12px), subtle 1px border, generous padding.
Heading "Basisgegevens" + helper text "Deze velden bepalen waar je vacature terechtkomt en hoe
kandidaten hem vinden."

Fields, in order:
1. **Functietitel** (job title) — text input. Example value shown: "Senior Backend Developer".
2. **Categorie** (category) — select dropdown. NOT a free-text field — bound to the internal Jobzy
   `VacancyCategory` enum (13 values in the design note, though the current API spec enum has 21
   values — use the API enum as source of truth, not the design note's count). Example shown:
   "Software · Backend development" (design-only grouping label — the API enum has no "Software"
   parent grouping, so this is likely a display convenience the FE builds, e.g. grouping engineering
   categories under a friendly label; a plain flat select is an acceptable simplification with a
   9/10 note).
3. **Land** (country) + **Stad** (city) — side by side. Land is a dropdown: EU27 + United Kingdom +
   Switzerland, Dutch labels, with the ISO 3166-1 alpha-2 code shown right-aligned inside the closed
   field (e.g. "NL"). The ISO2 code is what's stored in state / sent to the API (`Location.country`).
   Stad is a free-text input.
4. **Type werkplek** (workplace type) — 3-option segmented control: On-site / Hybride / Remote.
   Selected pill: solid dark green background, white text, fully rounded. Unselected: white bg,
   gray border, gray text. Maps to `WorkplaceType` enum (`ONSITE`/`HYBRID`/`REMOTE`).
5. **Uren per week — minimum / maximum** — two number inputs side by side. Example: 24 / 36.
   Maps to `minHoursPerWeek` / `maxHoursPerWeek`.

Footer actions (outside the card, bottom-right): "Bewaren als concept" (text/link button, save as
draft) and "Volgende" (primary filled dark-green button, go to next step).

Per the design-change comment log: a "Concept opgeslagen" (draft saved) label + real timestamp
appears next to the footer actions, but only *after* the first "Volgende" or "Bewaren als concept"
click — it is not shown on first load of step 1.

## Step 2 — Vacaturetekst (inferred; not mocked in this file)
Per the issue's happy flow and the API contract (`generate-description` / `description` endpoints),
this step must offer both:
- An **AI-generation card** ("AI-kaart"): per the design-change log, this card is *permanently*
  styled as an "advice" surface — violet border, `--surface-advice` background token, a white
  icon chip, violet title text. When selected/active it gets a violet focus ring. This strongly
  suggests the AI path is presented as a distinct, visually flagged panel (not just a button),
  consistent with `GenerateVacancyDescriptionRequest`'s three short inputs:
  - `mostImportantTasks` (max 1000 chars)
  - `team` (max 1000 chars)
  - `whyNiceJob` (max 1000 chars)
  A "Genereer met AI" action starts the job (`POST generate-description`), the FE then polls
  `GET generate-description/{generationId}` until `COMPLETED`/`FAILED`.
- A **manual editing path**: free-text fields for `summary` (max 1000), `jobDescription` (max 5000),
  `tasks` (max 5000), `whatWeOffer` (max 2500), `aboutUs` (max 2500) — either filled directly, or
  pre-filled from a completed AI generation and then edited before saving
  (`POST /vacancy/{id}/description`).
- Unhappy path per the issue: if generation fails, show the failure and let the user fall back to
  the manual fields — never a dead end.

## Step 3 — Contact en voorwaarden (inferred; not mocked in this file)
Maps to `ContactPerson` (name, role, phone, email) and `Offer` (salaryMin, salaryMax, currency,
salaryPeriod, numberOfHolidays). Design note confirms a **Salarisperiode** dropdown next to
min/max salary fields with values per-uur / per-dag / per-maand / per-jaar (`HOURLY`/`DAILY`/
`MONTHLY`/`ANNUAL` — note the API's `SalaryPeriod` enum only has `HOURLY`/`MONTHLY`/`ANNUAL`, no
`DAILY`; flagged in open-questions.md).

## Step 4 — Overzicht (inferred; not mocked in this file)
Review/summary of all entered sections before final save, consistent with staged creation
(`POST /vacancy` for core, then `PATCH /vacancy/{id}` for description/contact/offer sections).

## Color / token hints
- Primary/brand: dark green (buttons, active stepper, selected segmented-control pill, active nav).
- Advice/AI accent: violet, via a `--surface-advice` design token — reserved specifically for
  AI-related surfaces, not used elsewhere.
- Background: warm off-white, not pure white.
- Cards: white, subtle border, rounded corners, no heavy shadow.
- A `--content-max` spacing/layout token bounds the header/content width (exact px unknown — treat
  as a CSS custom property to be confirmed against the actual design-system tokens files listed in
  the issue, which this session could not reach — see open-questions.md).

## Not accessible this session
The issue also names an `_ds` bundle of design-system CSS/token files (colors, fonts, motion,
radius, semantic, spacing, typography) and a `support.js`, to be read alongside the page. These
files live inside the design canvas project and were not reachable as raw text through the tools
available in this session (only rendered screenshots). The architect/developer should treat the
above as a close approximation and pick concrete hex/spacing values pragmatically, flagged as a
follow-up to verify against the real tokens later.
