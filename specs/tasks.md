# Tasks: Vacancy creation frontend (feature slug: `vacancy-creation`)

Source plan: `specs/plan.md` (read the referenced section before starting a task).
Work one task at a time, in order — later tasks depend on earlier slices existing.
Mark each task done and summarize (files touched, one line why) the moment it's green;
don't let several tasks' worth of work pile up unreported.

Every task is test-driven (failing Vitest+RTL test first) except where explicitly noted
as trivial wiring/config.

---

## T001 — Project scaffold + architecture guardrails
Plan: §2. Vite + React 19 + TS-strict scaffold at repo root (`src/` for FSD layers).
ESLint + Prettier. FSD import-direction lint (`eslint-plugin-boundaries` or
`@feature-sliced/eslint-config`) + Steiger (`npx steiger ./src`) wired into
`npm run lint`. Vitest + React Testing Library configured (`npm run test`). npm scripts:
`dev`, `build`, `test`, `lint`, `steiger`, `generate:api` (stub until T003 fills it in).
No failing-test-first requirement here — trivial wiring/config, explicitly exempted per
the plan's testing rules.

## T002 — Runtime config mechanism
Plan: §2, §3.1 (`shared/config/runtime-config.ts`), §8 (risk: don't reach for `.env`).
Implement `loadRuntimeConfig()` (fetches `/config.json`, validates `apiBaseUrl`, throws
`RuntimeConfigError` on missing/malformed/unreachable) and `getRuntimeConfig()`. Add
committed `public/config.json` defaulting to `http://localhost:8080`. Tests: valid
config resolves; missing file / malformed JSON / missing `apiBaseUrl` each throw and
produce a visible fail-fast state (test the error path, not just that it throws — assert
there's no silent fallback URL).

## T003 — Generated API types
Plan: §2, §3.1. Add `openapi-typescript` as a dev dependency, `npm run generate:api`
generating `src/shared/api/generated/vacancy-api.ts` from `specs/vacancy.yml`. Run it
and commit the output. No hand-written request/response interfaces anywhere else in the
codebase from this point forward — every other slice imports types from this file
(via `entities/*/model/types.ts` aliases, not directly).

## T004 — HTTP client + error mapping
Plan: §3.1 (`shared/api/http-client.ts`, `shared/lib/problem-details.ts`).
Typed fetch wrapper reading base URL from `shared/config`, parsing
`application/problem+json` into `ApiError`, mapping network failures to a synthetic
`ApiError` (`status: 0`). `toFieldErrors` helper. Tests: success path, each 4xx/5xx
`ProblemDetails` shape, network-failure mapping, `toFieldErrors` output shape.

## T005 — Shared UI primitives
Plan: §3.1. `Button`, `TextField`, `NumberField`, `Select`, `SegmentedControl`, `Card`,
`ErrorBanner`, `Stepper` under `shared/ui/`. Approximate tokens in
`app/styles/tokens.css` (can be created here or in T016 — developer's call, note which).
Tests for components with real interaction/logic (`SegmentedControl`, `Select`,
`Stepper`, `ErrorBanner`); skip dedicated tests for purely presentational wrappers
(`Card`, `Button`) per plan §7 — note this choice in the task summary rather than
silently skipping.

## T006 — `entities/vacancy`
Plan: §3.2. Type aliases, `lib/labels.ts` (flat category select, Dutch labels for all 21
`VacancyCategory` values + `WorkplaceType`), `api/vacancyApi.ts`
(`createVacancy`, `patchVacancyCore`, `patchVacancyContactOffer`), `index.ts` public API.
Tests: adapter methods call the right method/path/body against a mocked `http-client`;
`patchVacancyCore`'s type signature excludes hours (compile-time check via the type
itself, not a runtime test) per ADR-0002.

## T007 — `entities/vacancy-description`
Plan: §3.2. Type aliases, `api/descriptionApi.ts` (`generateDescription`,
`getGenerationStatus`, `saveDescription`), `index.ts`. Tests: adapter methods against a
mocked `http-client`.

## T008 — `entities/location`
Plan: §3.2. Static EU27 + UK + Switzerland country list (ISO2 code + Dutch label),
Dutch-sorted. Tests: list shape (every code matches `^[A-Z]{2}$`, no duplicates,
expected count).

## T009 — `widgets/app-shell`
Plan: §3.4. Navbar: logo, nav items (Dashboard/Vacatures/Kandidaten/Statistieken,
"Vacatures" active-styled, others stubbed routes), avatar chip with initials, static
non-functional account menu (Account/Instellingen/Support — no navigation, per plan's
explicit note not to invent behavior). Tests: active item styling, avatar initials
render, menu items render.

## T010 — `features/create-vacancy-core` (Step 1)
Plan: §3.3. Form: Functietitel, Categorie (flat select from `entities/vacancy` labels),
Land (from `entities/location`) + Stad, Type werkplek segmented control, Uren per week
min/max. Field validation per schema constraints. Submit: `createVacancy` when no
`vacancyId`, else `patchVacancyCore`. Per-field errors from `ApiError.errors` via
`toFieldErrors`; top-level `ErrorBanner` for non-field/unreachable-backend errors.
"Concept opgeslagen \<timestamp\>" label logic (absent until first successful save).
Tests per plan §7.

## T011 — `features/generate-vacancy-description` (Step 2, AI path)
Plan: §3.3. Advice-styled ("AI-kaart") form: `mostImportantTasks`/`team`/`whyNiceJob`
(maxLength 1000 each). "Genereer met AI" → `generateDescription` →
poll `getGenerationStatus` via `shared/lib/polling` until `COMPLETED`/`FAILED`.
`onGenerated(draft)` callback on completion. Visible failure state on `FAILED` or a
start-call error — does not block/disable the manual path. Tests per plan §7 (fake
timers for polling).

## T012 — `features/edit-vacancy-description` (Step 2, manual path)
Plan: §3.3. Manual fields (`summary`, `jobDescription`, `tasks`, `whatWeOffer`,
`aboutUs`), `maxLength` validation, pre-fill from a passed-in draft, save via
`saveDescription`. Composed alongside T011 on the page — does not import T011's
feature internals. Tests per plan §7.

## T013 — `features/edit-vacancy-contact-offer` (Step 3)
Plan: §3.3. `ContactPerson` + `Offer` fields, `salaryPeriod` dropdown built from the
real 3-value `SalaryPeriod` enum (no DAILY — see open-questions.md). Client-side rule:
currency + salaryPeriod required once a salary field is present. Save via
`patchVacancyContactOffer`. Tests per plan §7.

## T014 — `features/review-vacancy` (Step 4)
Plan: §3.3. Read-only summary from wizard state, "Voltooien" action (no new API call —
everything already persisted incrementally). Tests: renders assembled summary correctly
for given state.

## T015 — `pages/vacancy-create`
Plan: §3.5. `VacancyCreatePage` composing `app-shell`, breadcrumb/title, `Stepper` (page
supplies the 4 Dutch labels), the active step's feature, footer actions. Wizard state
(`vacancyId`, per-step data, `currentStep`) as page-local state. "Volgende" gated on
successful save of the current step. Tests: step navigation gating, simulated
backend-unreachable at any step shows a visible error, full click-through reaches Step
4.

## T016 — App wiring
Plan: §3.6. `app/main.tsx` (boot sequence: `loadRuntimeConfig()` before render, fail-fast
error screen on failure), `app/App.tsx` (top-level `ErrorBoundary`), `app/router.tsx`
(`/` → redirect to `/vacancies/new`, `/vacancies/new` → the page), `app/styles/tokens.css`
if not already created in T005. Smoke test: app boots and renders Step 1 given a valid
mocked runtime config; boot fails visibly given an invalid one.

## T017 — Playwright: `create-vacancy` happy path
Plan: §7. The one Playwright flow this feature earns: full 4-step click-through against
a mocked backend (route interception or `msw`), manual description path (not AI) to
keep it deterministic. No other flow gets a Playwright test this pass.

## T018 — Runtime-config swap proof + local-dev instructions
Plan: §2, acceptance criteria in `specs/spec.md`. Document (README or a short doc under
`specs/`) the local proof required by the spec: build once, run with the default
`public/config.json` (`localhost:8080`), then swap it to a second URL and confirm
requests target the new URL without rebuilding — verify this by hand once and record the
steps taken (and result) in the task summary. This is the concrete acceptance-criteria
proof, not just a description of the mechanism (already unit-tested in T002).

## T019 — [review-gate] Final review: vacancy-creation
Depends on: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012,
T013, T014, T015, T016, T017, T018.
Single end-of-feature review checkpoint. `jobzy-frontend-reviewer` runs against the full
accumulated diff — FSD boundaries (Steiger/lint clean), API-boundary discipline (no
direct `fetch`/generated-client calls outside adapters), PII handling per plan §6, test
coverage per plan §7, and the two contract-gap ADRs' resolutions actually implemented as
written. Do not mark this task complete except via the reviewer's
`Reviewed-by: jobzy-frontend-reviewer` sign-off.

**Reviewed-by: jobzy-frontend-reviewer** — verdict: APPROVE. tsc/eslint/steiger/vitest
(75/75)/build all verified green independently. No blocking findings; two non-blocking
suggestions logged in `specs/open-questions.md` (free-text ISO-4217 currency narrowed to a
9-currency dropdown; email format not validated client-side). All 5 developer-flagged
deviations checked and accepted as functionally sound / in-scope.
