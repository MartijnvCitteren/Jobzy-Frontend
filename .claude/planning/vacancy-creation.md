# Plan: Vacancy creation frontend (feature slug: `vacancy-creation`)

Status: FINAL — ready for `jobzy-frontend-developer`.
Source spec: `specs/spec.md` (GitHub issue #4). Design source: `specs/design-notes.md`.
Contract: `specs/vacancy.yml` (OpenAPI 3.1.1, `jobzy-contracts` VacancyApi, copied as-of 2026-09-19).
Task list: `specs/tasks.md` (Speckit-style task IDs T001-T019, this plan is their source of truth).
Companion ADRs: `.claude/adr/0001-runtime-config-mechanism.md`,
`.claude/adr/0002-hours-per-week-edit-after-creation.md`.

This file is also mirrored at `.claude/planning/vacancy-creation.md` for
`jobzy-frontend-developer`'s workflow, which reads plans from that fixed path. If the two
ever diverge, `specs/plan.md` is the source of truth — copy forward into the mirror.

---

## 1. Contract findings that shape this plan (read this first)

Before laying out FSD slices: `specs/vacancy.yml` has two things that change what's
buildable in this pass. Both are cross-team contract issues, not FE bugs — flag upstream
to `jobzy-contracts`/backend, don't try to route around them cleverly client-side.

1. **`VacancyUpdateRequest` (the `PATCH /vacancy/{id}` body) cannot carry hours-per-week.**
   `VacancyCoreRequest` and `VacancyResponse` both use `minHoursPerWeek`/`maxHoursPerWeek`,
   but `VacancyUpdateRequest` only has a single `hoursPerWeek` field that doesn't exist
   anywhere else in the schema (`required` on `VacancyCoreRequest`/`VacancyResponse` also
   lists a nonexistent `hoursPerWeek` alongside the real min/max properties — almost
   certainly a copy-paste leftover across three schemas). Practical effect: once a
   vacancy is created via `POST /vacancy`, there is no contract-valid way to change its
   hours-per-week afterward. See ADR-0002 for the resolution.
2. **`SalaryPeriod` enum has no `DAILY`** (`HOURLY`/`MONTHLY`/`ANNUAL` only), but the
   design notes describe a "per-dag" option in the Salarisperiode dropdown. Resolution:
   build the Step 3 dropdown from the API enum (source of truth), i.e. 3 options, not 4.
   Flagged in `specs/open-questions.md` for a human to confirm with design.

Everything below assumes these two resolutions.

## 2. Tech setup (new repo, nothing exists yet)

- Vite + React 19 + TypeScript strict, `src/` houses all FSD layers.
- `openapi-typescript` generates types (types only, no runtime client) from
  `specs/vacancy.yml` into `src/shared/api/generated/vacancy-api.ts`, via an
  `npm run generate:api` script. Generated output is committed (so CI/other devs don't
  need to regenerate to build) and regenerated whenever `specs/vacancy.yml` changes.
- Vitest + React Testing Library for unit/component tests; Playwright for exactly one
  flow (see §7).
- Steiger (`npx steiger ./src`) + an FSD ESLint plugin (`eslint-plugin-boundaries` or
  `@feature-sliced/eslint-config`, developer's choice at implementation time) wired into
  `npm run lint` and CI, enforcing layer-import direction and public-API-only imports
  mechanically. This repo has neither yet — T001 sets both up as one of the first tasks,
  since nothing else should land before the guardrail exists to catch it landing wrong.
- Runtime config: `public/config.json`, fetched once at boot before the app renders.
  See ADR-0001 for why this over `window.__ENV__`. Default committed
  `public/config.json` points at `http://localhost:8080` per the spec's local-dev-only
  scope; the mechanism itself (fetch + fail-fast validation) is real, not a stub.

## 3. FSD layer plan

```
src/
  app/
  pages/
    vacancy-create/
  widgets/
    app-shell/
  features/
    create-vacancy-core/
    generate-vacancy-description/
    edit-vacancy-description/
    edit-vacancy-contact-offer/
    review-vacancy/
  entities/
    vacancy/
    vacancy-description/
    location/
  shared/
    api/
    config/
    lib/
    ui/
```

Import direction is strictly `app → pages → widgets → features → entities → shared`.
Note deliberately: this app has exactly one real page in scope, so most cross-page-reuse
widgets don't exist yet. Only `app-shell` (navbar) earns widget status — it's plausibly
reused once the dashboard/vacancies-list pages exist (out of scope here, but the shell
chrome is already fully specified in the design notes as a global element, not
page-specific). The wizard stepper is **not** promoted to a widget (see §3.4) — that's
the pragmatic call, named explicitly.

### 3.1 `shared/`

- `shared/api/generated/vacancy-api.ts` — openapi-typescript output. Never hand-edited;
  regenerated only.
- `shared/api/http-client.ts` — thin typed fetch wrapper. Reads the resolved base URL
  from `shared/config`, attaches `Authorization` header when a token is available
  (auth itself is out of scope for issue #4 — leave a `getAuthToken(): string | null`
  seam returning `null` for now, don't stub a fake login), parses
  `application/problem+json` bodies into a typed `ApiError` (fields: `title`, `status`,
  `detail`, `errors?: {field, message}[]`) on non-2xx, and rejects with that `ApiError`
  for every non-2xx response including network failures (mapped to a synthetic
  `ApiError` with `status: 0`, `title: "Netwerkfout"` or similar) — this is what makes
  "backend unreachable" a visible, catchable state everywhere instead of an unhandled
  promise rejection.
- `shared/config/runtime-config.ts` — `loadRuntimeConfig(): Promise<RuntimeConfig>` fetches
  `/config.json`, validates shape (`apiBaseUrl: string`, non-empty, parseable as a URL)
  with a small manual check (no need for a schema library for one field), throws a typed
  `RuntimeConfigError` on missing/malformed/unreachable config. `getRuntimeConfig()`
  synchronous accessor for already-resolved config, throws if called before boot
  resolves (programmer error, not a runtime path).
- `shared/lib/polling.ts` — `pollUntil<T>(fn, isDone, { intervalMs, timeoutMs })` generic
  async polling utility (or a `usePolling` hook, developer's call at implementation time,
  document the choice in the task's summary) — used only by
  `generate-vacancy-description`, but generic and worth sharing since retry/poll needs
  recur.
- `shared/lib/problem-details.ts` — `toFieldErrors(errors: ApiError['errors']): Record<string, string>`
  helper turning `ProblemDetails.errors[]` into a `{field: message}` map forms can key
  off directly.
- `shared/ui/` — `Button`, `TextField`, `NumberField`, `Select`, `SegmentedControl`,
  `Card`, `ErrorBanner`, `Stepper` (generic: `steps: {label: string}[]`, `currentIndex:
  number` — no business knowledge of "Basisgegevens" etc., that's supplied by the page).
  Approximate the design tokens (dark green primary, warm off-white background, violet
  `--surface-advice`) as CSS custom properties in `app/styles/tokens.css`, consumed by
  these components — see ADR note in open-questions.md, exact hex/spacing values are a
  pragmatic approximation this pass, flagged for a later pass against the real
  `_ds` token files.

### 3.2 `entities/`

- `entities/vacancy/`
  - `model/types.ts` — re-exports/aliases the generated `VacancyResponse`,
    `VacancyCoreRequest`, `VacancyUpdateRequest`, `VacancyCategory`, `WorkplaceType`,
    `Location` types from `shared/api/generated`. Nothing hand-written here — this file
    exists only to give the rest of the app one stable import path independent of
    codegen output naming.
  - `lib/labels.ts` — Dutch display-label maps for `VacancyCategory`, `WorkplaceType`,
    driven off the API enum (21 categories, not the design note's 13 — API is source of
    truth per spec). A **flat** select for category, not the design's "Software ·
    Backend development" grouped display — see ADR-worthiness note in
    open-questions.md; this is a named pragmatic simplification, not an oversight.
  - `api/vacancyApi.ts` — the only place that calls `http-client` for vacancy core
    concerns: `createVacancy(body: VacancyCoreRequest): Promise<VacancyResponse>`,
    `patchVacancyCore(id, body: Pick<VacancyUpdateRequest, 'jobTitle'|'category'|'location'|'workplaceType'>): Promise<VacancyResponse>`
    (deliberately excludes hours — see ADR-0002),
    `patchVacancyContactOffer(id, body: Pick<VacancyUpdateRequest, 'contactPerson'|'offer'>): Promise<VacancyResponse>`.
  - `index.ts` — public API: exported types, `labels`, `vacancyApi`. Nothing else is
    reachable from outside this slice.
- `entities/vacancy-description/`
  - `model/types.ts` — aliases `VacancyDescriptionRequest`, `VacancyDescriptionResponse`,
    `GenerateVacancyDescriptionRequest`, `VacancyDescriptionGeneration`,
    `VacancyDescriptionGenerationStatus`.
  - `api/descriptionApi.ts` — `generateDescription(vacancyId, body): Promise<VacancyDescriptionGeneration>`,
    `getGenerationStatus(vacancyId, generationId): Promise<VacancyDescriptionGeneration>`,
    `saveDescription(vacancyId, body: VacancyDescriptionRequest): Promise<VacancyDescriptionResponse>`.
  - `index.ts` — public API.
- `entities/location/`
  - `model/countries.ts` — static list, EU27 + United Kingdom + Switzerland, each
    `{ code: string (ISO 3166-1 alpha-2), labelNl: string }`, Dutch-sorted. Source this
    list by hand once (not generated) — it's static reference data, not part of the API
    contract.
  - `index.ts` — exports `countries`.

### 3.3 `features/` (one verb-noun feature per wizard step's action, plus generation)

- `features/create-vacancy-core/` — Step 1 form (Functietitel, Categorie, Land, Stad,
  Type werkplek segmented control, Uren per week min/max). Owns field-level validation
  (required, `minLength`/`maxLength`/range per the schema) and submit: calls
  `entities/vacancy`'s `createVacancy` on first submit (no `vacancyId` yet in wizard
  state) or `patchVacancyCore` on a later resubmission (`vacancyId` already exists).
  Surfaces `ApiError.errors` via `toFieldErrors` per-field, and a top-level
  `ErrorBanner` for non-field errors (backend unreachable, 5xx). Exposes
  `<VacancyCoreForm>` taking `vacancyId`, initial values, and `onSaved(vacancy)`.
  Owns the "Concept opgeslagen \<timestamp\>" label logic (shown only after first
  successful save, not on initial render — per the design's comment-log note).
- `features/generate-vacancy-description/` — the "AI-kaart" advice-styled panel: form
  for `mostImportantTasks`/`team`/`whyNiceJob` (each `maxLength: 1000`), a "Genereer met
  AI" action calling `generateDescription`, then polling `getGenerationStatus` via
  `shared/lib/polling` until `COMPLETED` or `FAILED`. On `COMPLETED`, hands the draft
  `VacancyDescriptionResponse` up via `onGenerated(draft)` for
  `edit-vacancy-description` to pre-fill. On `FAILED` or a start-call error, shows a
  visible failure state inline in the card (never a silent stall) and does **not** block
  the manual path below.
- `features/edit-vacancy-description/` — manual fields (`summary`, `jobDescription`,
  `tasks`, `whatWeOffer`, `aboutUs`), pre-filled from a completed generation when
  present, otherwise empty for hand-written entry. Validates `maxLength` per field.
  Saves via `entities/vacancy-description`'s `saveDescription`. This feature and
  `generate-vacancy-description` are composed together on the page (Step 2), not nested
  inside each other — the page passes the generated draft from one to the other's
  initial-values prop. Neither feature imports the other directly (FSD: features don't
  import sideways from other features).
- `features/edit-vacancy-contact-offer/` — Step 3 form: `ContactPerson` (name, role,
  phone, email) + `Offer` (salaryMin, salaryMax, currency, salaryPeriod — 3-option
  dropdown per the real enum, numberOfHolidays). Enforces the documented-but-not-schema
  rule "currency and salaryPeriod required once either salary field is present" as
  client-side validation (the contract explicitly says this is enforced at the
  application layer, not the schema). Saves via `patchVacancyContactOffer`.
- `features/review-vacancy/` — Step 4: read-only summary assembled from the wizard's
  already-in-memory state (no new GET call needed — every section was already persisted
  incrementally by the prior steps' PATCH/POST calls, and the wizard holds the
  latest-known `VacancyResponse` after each step). A "Voltooien" action that simply
  confirms and navigates away (still `DRAFT` — publishing is out of scope). If the
  in-memory state and a defensive re-fetch (`vacancyApi` doesn't expose `getVacancy` in
  this pass — not needed since nothing else can mutate the vacancy concurrently in this
  single-user flow) ever needs reconciling, that's a future concern, not this pass's.

Each feature's `index.ts` exports only its top-level component(s) and the hook if the
page needs to orchestrate step transitions around it (e.g.
`useGenerateVacancyDescription` if the page needs to know generation is in-flight to
disable "Volgende"). No feature reaches into another feature's or entity's internals
beyond its `index.ts`.

### 3.4 `widgets/`

- `widgets/app-shell/` — navbar per design notes: logo, nav items (Dashboard, Vacatures
  active, Kandidaten, Statistieken — all but "Vacatures" link to stub/placeholder routes
  since only vacancy creation is in scope), avatar chip with initials. The account menu
  (Account/Instellingen/Support) was never directly observed — build it as a static,
  non-functional dropdown (renders the three labels, no navigation) rather than
  inventing behavior; flagged in open-questions.md.

**Pragmatic call, named explicitly:** the 4-step stepper is *not* its own widget. It's
used on exactly one page in this pass, and promoting single-use UI to a widget slice
just to satisfy layer ceremony is the kind of ritual FSD explicitly doesn't require —
`shared/ui/Stepper` (generic, presentational) composed directly inside
`pages/vacancy-create` with this page's own step labels is the pragmatic variant.
**Strict/academic variant:** introduce `widgets/vacancy-wizard-stepper` now, wrapping
`shared/ui/Stepper` with the 4 fixed Dutch labels, on the reasoning that any future
multi-step flow (e.g. candidate pipeline stages) would reuse the *pattern* even if not
this exact widget. Consequence of the strict variant: an extra empty-feeling slice for
one caller, more indirection for the developer to trace through for zero present
benefit. **Recommendation: pragmatic** — momentum over ceremony; revisit if/when a
second wizard actually appears.

### 3.5 `pages/vacancy-create/`

- `ui/VacancyCreatePage.tsx` — the only piece holding cross-step wizard state:
  `{ vacancyId: string | null, currentStep: 1|2|3|4, core: ..., description: ...,
  contactOffer: ... }` as local `useState`/`useReducer` (no external store — this state
  is genuinely page-local and doesn't need to survive a route change or be shared
  outside this page). Renders `widgets/app-shell`, breadcrumb + title (page-level
  markup, not worth their own slice), `shared/ui/Stepper` with this page's 4 labels, the
  active step's feature component, and step footer actions ("Bewaren als concept" /
  "Volgende", wired to each step feature's save handler). Advancing a step requires the
  current step's save to have succeeded — "Volgende" is disabled while a save is
  in-flight or the step is invalid, per the unhappy-flow requirement that failures must
  be visible, not silently skipped.
- `index.ts` — exports the route element only.

### 3.6 `app/`

- `app/main.tsx` — entry point: calls `loadRuntimeConfig()` before rendering
  `<App />`; on failure, renders a minimal fail-fast error screen directly (not the full
  app shell, since the app shell itself may depend on config) with the error detail
  visible, no silent fallback URL, per the spec's explicit requirement.
- `app/App.tsx` — top-level `ErrorBoundary` (catches render-time exceptions anywhere in
  the tree, shows a visible fallback, never a blank screen — this is the "backend
  unreachable" catch-all for anything the per-feature error handling doesn't already
  cover) wrapping a minimal router.
- `app/router.tsx` — two routes: `/` (redirects to `/vacancies/new` — no dashboard/list
  page exists yet, stub only per spec's out-of-scope note) and `/vacancies/new`
  (`pages/vacancy-create`). `react-router-dom`, minimal config, no nested layouts beyond
  what `app-shell` already provides per-page.
- `app/styles/tokens.css` — CSS custom properties approximating the design notes'
  tokens (`--color-primary` dark green, `--color-bg` warm off-white, `--surface-advice`
  violet, `--content-max`, `--radius-card` ~12px). Exact values are the developer's
  pragmatic pick within the described palette — see open-questions.md for values that
  need later confirmation against the real design-system files.

## 4. API boundary summary

| Concern | Adapter method | Endpoint | Contract status |
|---|---|---|---|
| Create vacancy (Step 1, first save) | `vacancyApi.createVacancy` | `POST /vacancy` | Covered |
| Edit core fields (Step 1, resubmit) | `vacancyApi.patchVacancyCore` | `PATCH /vacancy/{id}` | Covered *except hours* — ADR-0002 |
| Start AI generation (Step 2) | `descriptionApi.generateDescription` | `POST /vacancy/{id}/generate-description` | Covered |
| Poll generation status (Step 2) | `descriptionApi.getGenerationStatus` | `GET /vacancy/{id}/generate-description/{generationId}` | Covered |
| Save manual/edited description (Step 2) | `descriptionApi.saveDescription` | `POST /vacancy/{id}/description` | Covered |
| Save contact + offer (Step 3) | `vacancyApi.patchVacancyContactOffer` | `PATCH /vacancy/{id}` | Covered |
| Review (Step 4) | none — reads in-memory wizard state | — | N/A |

No endpoint needed by this feature is missing from `specs/vacancy.yml` outright — the
one gap (hours-per-week on PATCH) is a same-endpoint field gap, not a missing endpoint,
handled per ADR-0002. All calls above route through `entities/vacancy` or
`entities/vacancy-description`'s adapters — never `fetch`/the generated client directly
from a feature, widget, or page. Auth (`Authorization: Bearer`) is out of scope for
issue #4; `http-client` leaves the seam but doesn't fabricate a login flow.

## 5. State management

Local/component state only, as decided. The only state worth naming explicitly:

- Wizard cross-step state lives in `pages/vacancy-create` (React `useState`/
  `useReducer`), not a store library — it's single-page, single-user, doesn't need to
  survive navigation away, and PII (contact name/email) living in it must never be
  written to `localStorage`/`sessionStorage` (see §6) or a store's dev-tools-visible
  global state. Component state that unmounts cleanly is the safer default here, not
  just the simpler one.
- Runtime config is the one genuinely cross-cutting piece of "global" data (needed by
  every API call, resolved once at boot, never changes during a session) — that's
  exactly the case that earns a module-level singleton (`shared/config/runtime-config`'s
  `getRuntimeConfig()`) instead of prop-drilling or a store library. Not a precedent for
  reaching for global state elsewhere.

## 6. PII handling

`ContactPerson` (name, email, phone) is the only candidate/personal-data-shaped input in
this feature (no CV, no candidate data yet — that's phase 2). Explicit rules for this
pass:

- Never log `ContactPerson` fields, full request/response bodies, or `ApiError.detail`
  (which could echo submitted field values) to the console beyond what's needed for a
  visible on-screen error — no `console.log(response)` debugging left in, no analytics
  event carrying form values.
- Do not persist wizard state (including Step 3's contact person) to `localStorage` or
  `sessionStorage`. This pass has no "resume draft after refresh" requirement — don't
  add draft-persistence as a bonus; it would silently create a PII-at-rest concern in
  browser storage that isn't in scope to secure/clear properly yet.
- `http-client` error logging (for genuine developer-facing diagnostics) must log status
  codes and `title`/`type`, never `errors[].message` verbatim if those could echo
  submitted PII back (unlikely per this schema's validation messages, but the rule is
  cheap to hold to regardless).

## 7. Test plan

**Vitest + RTL** (the default, every feature/entity/shared piece with real logic):

- `shared/config/runtime-config` — boot succeeds with valid config; fails fast (visible
  error, no fallback URL) on missing file, malformed JSON, and missing `apiBaseUrl`.
- `shared/api/http-client` — success path typing, `ProblemDetails` parsing into
  `ApiError` on 400/401/403/404/409/500, network-failure-to-`ApiError` mapping.
- `shared/lib/polling` — resolves on `isDone`, times out per `timeoutMs`, stops polling
  after resolution/timeout (no dangling interval).
- `entities/vacancy/api`, `entities/vacancy-description/api` — each adapter method
  against a mocked `http-client` (or `msw`, developer's call): correct method/path/body,
  correct return shape.
- `features/create-vacancy-core` — required-field validation, first-save calls
  `createVacancy`, resubmit calls `patchVacancyCore`, field errors from a mocked 400
  render per-field, "Concept opgeslagen" label absent on first render / present after a
  successful save.
- `features/generate-vacancy-description` — start → `PENDING` → poll → `COMPLETED` hands
  the draft up; `FAILED` (and a start-call error) render a visible failure and leave the
  manual path usable (assert the manual-fields feature isn't disabled/hidden by a
  failure — test this at the page-integration level if that's a cleaner seam than
  reaching across features).
- `features/edit-vacancy-description` — `maxLength` validation, pre-fill from a passed
  draft, save calls `saveDescription`.
- `features/edit-vacancy-contact-offer` — the "currency+salaryPeriod required once a
  salary field is present" client-side rule, save calls `patchVacancyContactOffer`.
- `features/review-vacancy` — renders the assembled summary from given wizard state.
- `pages/vacancy-create` — integration-level: step navigation gated on successful save,
  a simulated backend-unreachable response at any step shows a visible error (not a
  blank screen), full happy-path click-through reaches Step 4.
- `widgets/app-shell` — active nav item styling, avatar chip renders initials.
- `shared/ui` — cheap smoke/interaction tests for components with real logic
  (`SegmentedControl` selection, `Select`, `Stepper` active/inactive rendering,
  `ErrorBanner` visibility); purely presentational wrappers (e.g. `Card`) don't need a
  dedicated test — note this explicitly so the developer doesn't over-test styling.

**Playwright** — exactly one flow earns it, per the architect guidance of a handful of
genuinely critical flows, not one per screen:

- **`create-vacancy` happy path**: open "Nieuwe vacature" → fill Step 1 → Volgende →
  fill Step 2 manually (skip AI to keep the test deterministic and fast — AI generation
  is already covered at the Vitest/RTL level with mocked polling) → Volgende → fill Step
  3 → Volgende → Step 4 → Voltooien. Run against a mocked backend (Playwright route
  interception or `msw` in the browser) — no real backend dependency in CI. This is the
  one flow explicitly named as canonical in the architect's own tech-context guidance
  ("create-vacancy" is listed as an example critical flow), and it's the entire scope of
  this feature end to end, so it's the right (and only) candidate here.

No other flow in this feature earns a second Playwright test — the unhappy paths
(backend unreachable, generation failure, field validation) are cheaper and more
precisely asserted at the Vitest/RTL level already.

## 8. Architectural risks (explicit)

- **Contract gap (hours-per-week on PATCH)** — real risk if a future task assumes
  Step-1 fields are fully re-editable after creation; ADR-0002 documents the workaround
  and the upstream fix needed. Severity: low for this pass (creation-then-forward flow
  doesn't require going back), but will resurface the moment a "go back and edit
  everything" UX is requested — flag now so it isn't rediscovered mid-implementation of
  a future edit-vacancy feature.
- **Steiger/FSD-lint not yet configured in this repo** — until T001 lands, every
  subsequent task is a chance for an import-direction violation to go unnoticed until
  the single end-of-feature review. Sequencing T001 first is the mitigation; if it slips
  behind other tasks, the guardrail arrives too late to catch anything.
- **Design notes are only fully observed for Step 1** — Steps 2-4 are contract- and
  stepper-label-inferred, not pixel-verified. Risk is cosmetic/layout mismatch on
  rebuild against the real design file, not a functional risk (the underlying data/API
  wiring is contract-driven, not design-driven). Acceptable to proceed — flagged in
  open-questions.md for a later visual pass.
- **`public/config.json` is a static file Vite serves as-is from `public/`** — if a
  developer instead puts config values in `.env`/`import.meta.env` out of habit (very
  common Vite reflex), that silently reintroduces build-time config and defeats the
  entire point of this mechanism (one build artifact promoted across environments).
  Worth the developer explicitly not reaching for `.env` here; called out in T002.

## 9. Task list

See `specs/tasks.md` for the ordered, ID-tagged breakdown
(`jobzy-frontend-developer` works from that file one task at a time). It ends with a
single `[review-gate]` task depending on every implementation task, per this team's
end-of-feature review cadence.
