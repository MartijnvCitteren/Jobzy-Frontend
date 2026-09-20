# Tasks: Vacancy creation frontend (feature slug: `vacancy-creation`)

Source plan: `specs/plan.md` (read the referenced section before starting a task).
Work one task at a time, in order — later tasks depend on earlier slices existing.
Mark each task done and summarize (files touched, one line why) the moment it's green;
don't let several tasks' worth of work pile up unreported.

Every task is test-driven (failing Vitest+RTL test first) except where explicitly noted
as trivial wiring/config.

**2026-09-20 update**: T001-T019 below are the original pass — already implemented and
reviewed (T019's sign-off stands for what it reviewed). T020-T033 are the design-parity
revision (`specs/plan.md` §10), reworking several existing features for real design
parity and adding the screens/modals that didn't exist yet. **T033, not T019, is now the
feature's final review gate** — do not treat T019's prior APPROVE as covering T020-T032.

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
**Superseded by T031** — this flow is extended, not replaced, to cover the now-longer
real flow (mode choice, preview, publish, published).

## T018 — Runtime-config swap proof + local-dev instructions
Plan: §2, acceptance criteria in `specs/spec.md`. Document (README or a short doc under
`specs/`) the local proof required by the spec: build once, run with the default
`public/config.json` (`localhost:8080`), then swap it to a second URL and confirm
requests target the new URL without rebuilding — verify this by hand once and record the
steps taken (and result) in the task summary. This is the concrete acceptance-criteria
proof, not just a description of the mechanism (already unit-tested in T002).

## T019 — [review-gate] Final review: vacancy-creation (original pass)
Depends on: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012,
T013, T014, T015, T016, T017, T018.
**Superseded as the feature's final gate by T033** — this sign-off stands for what it
reviewed (the original, approximate-design pass) but does not cover T020-T032.

**Reviewed-by: jobzy-frontend-reviewer** — verdict: APPROVE. tsc/eslint/steiger/vitest
(75/75)/build all verified green independently. No blocking findings; two non-blocking
suggestions logged in `specs/open-questions.md` (free-text ISO-4217 currency narrowed to a
9-currency dropdown; email format not validated client-side). All 5 developer-flagged
deviations checked and accepted as functionally sound / in-scope.

---

## Design-parity revision (2026-09-20) — plan §10

## T020 — Real design tokens
Plan: §10.2, ADR-0003. Replace `src/app/styles/tokens.css` wholesale with the real
`_ds` token values (`--teal`, `--violet`, `--sand`, `--danger`, `--surface-bg`,
`--surface`, `--border`, `--ink`/`--ink-secondary`, `--on-teal`, `--status-*-bg`,
`--nav-active-*`, `--space-1..6` = 8/16/24/32/48/64, `--content-max: 840px`,
`--radius-control: 10px`/`--radius-card: 20px`/`--radius-pill: 999px`,
`--text-*-size/line/weight`, `--font-sans`/`--font-mono` incl. the Google Fonts
`@import`, `--transition`/`--transition-hover`). Update every existing `shared/ui/*`
component and page/feature CSS module to reference the real names — this is a rename
across the whole CSS surface, review the diff as one coherent pass. No visual behaviour
change beyond matching the real values (e.g. `--radius-card` moves from 12px to 20px
everywhere it's used). Tests: none new (visual-only); existing component tests must
still pass unchanged (they shouldn't assert on hardcoded colour/spacing values — if any
do, that's a pre-existing test smell worth flagging in the task summary, not silently
fixing scope-creep-adjacent unrelated tests).

**Done.** `src/app/styles/tokens.css` replaced wholesale with the real `_ds` token
values (verbatim names/values, Google Fonts `@import`). Renamed every reference across
`shared/ui/*.module.css` and `widgets/app-shell/*.module.css` to the real semantic
names. No pre-existing tests asserted hardcoded colour/spacing values — none needed
fixing. All existing tests still pass unchanged.

## T020b — New shared UI primitives
Plan: §10.2, §10.6. Add `shared/ui/Modal.tsx` (generic: scrim, `max-width`/`padding`
props, focus trap, closes on Escape and scrim click, returns focus to trigger on close),
`Skeleton.tsx` (animated bar: `width`/`height` props, no spinner variant), `Checkbox.tsx`
(18x18, `border-radius: 5px`, teal fill + `--on-teal` check when checked), `ChoiceCard.tsx`
(shared shell for Step 2's two mode cards: icon, title, body, selected/unselected/advice
variants). Export all four from `shared/ui/index.ts`. Tests per plan §10.6.

**Done.** Added `Modal.tsx` (focus trap, Escape/scrim close, focus-return), `Skeleton.tsx`,
`Checkbox.tsx`, `ChoiceCard.tsx` with their tests, exported from `shared/ui/index.ts`.
22 new/updated Vitest cases, all green.

## T021 — `widgets/app-shell` rework
Plan: §10.1 item 10, §10.2. Real navbar chrome: lockup logo asset (placeholder from
`_ds/assets/logo/`, flagged for a real-asset swap in the task summary), Lucide icons
(new `lucide-react` dependency — note it explicitly) on each nav item, `--content-max:
840px` inner row, sticky/`z-index: 20` header. Avatar dropdown becomes a real
interactive menu: opens on click, closes on outside mousedown (`[data-dd]`-equivalent
pattern), header block "Merel Janssen"/"Jobzy", hover states on Account/Instellingen/
Support rows — still non-functional beyond open/close (destinations unobserved, per
open-questions.md #6, unchanged). Tests: menu open/close, outside-click dismissal,
active nav item styling against real tokens.

**Done.** Added `lucide-react` dependency, real nav icons, interactive account-menu
(opens on click, closes on outside mousedown via `[data-dd]`), header block with name/org.
Logo kept as text lockup ("Jobzy") — no placeholder asset file existed in
`_ds/assets/logo/` to import as a component; flagged for a real-asset swap.

## T022 — `entities/vacancy`: add `publishVacancy`
Plan: §10.4. `vacancyApi.publishVacancy(id: string): Promise<VacancyResponse>` calling
`POST /vacancy/{id}/publish`. Add to `index.ts` public API. Tests: adapter method
against a mocked `http-client`; a 409 response surfaces as a typed `ApiError` (same
`toFieldErrors`-adjacent handling every other adapter caller already relies on — no new
error-shape handling needed here, just confirm the existing mapping covers it).

**Done.** `vacancyApi.publishVacancy(id)` added, exported from `entities/vacancy`.

## T023 — `features/choose-vacancy-text-mode` (new)
Plan: §10.1 item 1, §10.2, §10.3. New feature: Step 2's mode-choice UI. Two
`ChoiceCard`s ("Zelf schrijven" / "Jobzy stelt een concept op", the latter using the
advice variant), the `AdviceCard` copy block below them, primary button disabled until
`mode` is chosen, label "Beantwoord 3 vragen" (AI) vs. "Volgende" (manual). Controlled
component: `mode`/`onModeChange`/`onNext` props, page owns `mode` state (plan §10.5).
`index.ts` exports `<VacancyTextModeChoice>` only. Tests per plan §10.6.

**Done.** New feature built as a controlled component per spec, `AdviceCard` copy
inline (no separate shared component needed — plan didn't call for one).

## T024 — `features/generate-vacancy-description` rework
Plan: §10.1 item 2, §10.3, §10.8 (shared-hook risk). Extract a
`useGenerateVacancyDescription()` hook (start + poll, exposes `phase: 'idle' |
'generating' | 'ready' | 'failed'`, `result`, `regenerate(section)`) from the existing
inline card. Add `<ThreeQuestionsModal>` (built on T020b's `Modal`): the three labelled
textareas per `design-notes.md`'s exact copy/placeholders, footer "Annuleren"/"Genereer
mijn concept vacature", submit closes the modal and calls the hook's `start()`. Remove
the old inline "AI-kaart" card from step 2 (superseded by T023 + this modal). Document
the question-to-field mapping decision (design-notes.md's "Enum data" section) in the
task summary since it's a named open question, not a silent choice. `index.ts` exports
`<ThreeQuestionsModal>` and `useGenerateVacancyDescription`. Tests per plan §10.6.

**Done.** Old inline `GenerateVacancyDescriptionCard` removed. Hook exposes
`phase`/`result`/`start`/`regenerate`. Question-mapping decision: Q1+Q2 fold into
`mostImportantTasks` (newline-joined), Q3 → `whyNiceJob`, `team` left empty (no direct
question) — per design-notes.md's own "Enum data" recommended resolution.

## T025 — `features/edit-vacancy-description` rework
Plan: §10.1 item 3. Move this feature's rendering from Step 2 to Step 3 (manual variant
only — the page only renders it when `mode === 'manual'`). Drop the "Wat wij bieden"
field from the rendered form per `design-notes.md`'s confirmed field-mapping gap (data
model keeps `whatWeOffer` patchable for a future field, per open-questions.md's carried-
forward #5 — just don't render an input for it here); keep `summary`/`jobDescription`/
`tasks`/`aboutUs` (labelled "Team en organisatie" per the design). Save via
`saveDescription`, `onSaved` advances to step 4 (not step 3→3 as before — the "Volgende"
target changes since step 2 no longer does description work). Tests per plan §10.6.

**Done, with one flagged deviation.** Field rework and drop of "Wat wij bieden" done as
specified. Deviation: the page composes `VacancyDescriptionEditor` and
`VacancyContactOfferForm` as two stacked cards (not one merged "Tekst, contact en
voorwaarden" card as the README literally shows) — each keeps its own save action;
`VacancyDescriptionEditor.onSaved` only persists the draft into page state, and it's
`VacancyContactOfferForm.onSaved` (rendered below it) that advances to step 4. Chose
this over forcing a single merged card because merging would require either component
to stop owning its own save/button, which the plan's FSD composition pattern (two
independent controlled features on one page) doesn't call for elsewhere. Flagging this
as the one place where "single card" from the design isn't pixel-literal — worth a
human sanity check at review, not a blocker.

## T026 — `features/edit-vacancy-contact-offer` rework
Plan: §10.1 items 3, 5, §10.6. Two variants: manual (adds T025's description fields
into this step's card, per `design-notes.md`'s "Manual variant") and AI (renders the
generating/ready banner instead, driven by the `phase` prop passed down from the page's
`useGenerateVacancyDescription` instance — this feature does **not** start its own
polling, per the §10.8 shared-hook risk). Add "Liever niet delen" `Checkbox` (T020b)
that hides the entire salary grid and nulls salary fields on save when checked. Salary
grid becomes `repeat(auto-fit, minmax(150px, 1fr))` (T020 token work covers the CSS
value, this task wires the grid structure). Tests per plan §10.6.

**Done.** `mode`/`phase` props added, generation banner (violet generating / teal
ready) driven purely by the prop — no own polling. "Liever niet delen" `Checkbox` hides
the salary grid and nulls `salaryMin`/`salaryMax`/`currency`/`salaryPeriod` on save.
Contact fields also grouped into `repeat(auto-fit, minmax(220px, 1fr))` pairs.

## T027 — `features/review-vacancy` rework (Step 4, editable)
Plan: §10.1 item 4, §10.8 (editable-step-4 risk). Job title/meta header with
"Aanpassen" link (calls a page-supplied `onNavigateToStep(1)`), 4 `Skeleton` bars
(T020b) while `phase === 'generating'`, editable textareas for
`summary`/`jobDescription`/`tasks` once ready — saves via `saveDescription` — with
per-section "Opnieuw" (`regenerate(section)` from the shared hook) shown only when
`mode === 'ai'`. Read-only contact/offer section in `--font-mono`, second "Aanpassen"
link to step 3. Primary button "Bekijk je vacature" calls a page-supplied
`onViewPreview()` (switches `view` to `'preview'`) instead of the old "Voltooien"
navigate-away behaviour. Tests per plan §10.6.

**Done.** Skeleton bars while `mode === 'ai' && phase === 'generating' && !description`.
Editable textareas save via `saveDescription`. "Opnieuw" only rendered in AI mode, wired
to the page-supplied `onRegenerate`. Both "Aanpassen" links call `onNavigateToStep`.

## T028 — `features/preview-vacancy` (new)
Plan: §10.1 item 8, §10.2, §10.3. Candidate's-view screen: header block (Jobzy symbol +
"Geplaatst via Jobzy", job title, four chips — location/workplace/hours(mono)/salary(mono)
or "Salaris in overleg"), body (summary, "Over de rol", "Wat je gaat doen",
"Voorwaarden" mono), contact line + disabled "Solliciteren" button, footer (ghost
"Terug" → back to step 4, secondary "Bewaren als concept" → reuses the existing save
path, primary "Publiceer vacature" → opens `publish-vacancy`'s confirm modal via a
page-supplied `onRequestPublish()`). Reads the in-memory `VacancyResponse` — no new GET.
`index.ts` exports `<VacancyPreview>` only. Tests per plan §10.6.

**Done.** New feature built as spec'd; `salaryChip` helper renders "Salaris in overleg"
when no salary is present, mono chips for hours/salary.

## T029 — `features/publish-vacancy` (new)
Plan: §10.1 item 8, §10.2, §10.3, §10.4. `<PublishConfirmModal>` (T020b `Modal`,
max-width 440px, ghost "Annuleren"/primary "Ja, publiceer", calls
`usePublishVacancy().publish()`, surfaces a 409/other error via `ErrorBanner` inside the
modal without closing it) and `<PublishedConfirmation>` (success circle, H1, body
naming the vacancy title, "Terug naar overzicht" → step 4, "Bekijk je vacature" → back
to preview). `usePublishVacancy()` owns the `publishVacancy` call + `publishing`/`error`
state, calls `vacancyApi.publishVacancy` (T022). `index.ts` exports both components and
the hook. Tests per plan §10.6.

**Done.** All three pieces built as spec'd; 409 surfaced via `ErrorBanner` inside the
modal without closing it (verified in a dedicated test).

## T030 — `pages/vacancy-create` rework (orchestration)
Plan: §10.5. Add `view`/`mode`/`questionsOpen`/`confirmOpen`/`hasSaved`/`savedAt` state.
Render "Concept opgeslagen" next to the H1 (lifted out of T010's card, fed by
`create-vacancy-core`'s existing `onSaved` callback). Wire `Stepper` click-to-navigate
with reachability gating (steps 1-2 always, 3-4 only once `mode !== null`) — this is new
`Stepper` behaviour, extend `shared/ui/Stepper`'s props (`onStepClick`,
`isReachable(index)`) rather than duplicating navigation logic in the page. Compose
T023-T029's features per `view`/`currentStep`/`mode` into the right screen. Hold the
single `useGenerateVacancyDescription()` instance and thread `phase`/`result`/
`regenerate` as props into T026 and T027 (§10.8 — do not let either instantiate its own
poll). Tests per plan §10.6 (the two full-mode click-through integration tests).

**Done.** All state added; single `useGenerateVacancyDescription()` instance held by the
page and threaded into `edit-vacancy-contact-offer` and `review-vacancy` via props (no
duplicate polling). `Stepper` reachability: steps 1-2 always, 3-4 gated on `mode !==
null`. Both full click-through integration tests (manual and AI mode) pass, exercising
mode choice → 3-questions modal (AI) → step 3 → step 4 → preview → publish → published.

## T031 — Playwright: extend `create-vacancy` happy path
Plan: §10.6 (Playwright section), supersedes T017's original scope. Extend the existing
spec file (don't create a second one) to cover: mode choice (manual, kept deterministic
per the original reasoning), the reworked step 3/4, the preview screen, and publish
through to the Published screen. Still the one canonical flow this feature earns — no
second Playwright spec added.

**Done.** `e2e/create-vacancy.spec.ts` extended (same file, not a new one) to cover mode
choice, editable step 4, preview, publish-confirm modal, and the Published screen.
Passes against `page.route`-mocked endpoints (`npx playwright test`, 1/1 green).

## T032 — Tablet responsiveness verification (768-1024px)
Plan: §10.7. Manual verification pass (record pass/fail per screen in the task summary,
not a new automated test unless the test setup can genuinely assert grid reflow — see
plan §10.6's note on JSDOM's layout limitations): resize every screen — Step 1
(Land+Stad, hours min/max), Step 2 (choice-card grid), Step 3 (contact + salary grids,
both variants), Step 4, Preview, Published, both modals — to 768px and 1024px widths and
confirm `repeat(auto-fit, minmax(...))` grids reflow without horizontal scroll or
clipped content, and `flex-wrap: wrap` header rows don't overlap. No mobile (<640px)
verification required — confirmed out of scope.

**Done, downgraded to source-level audit — no browser tool was available in this
session to actually resize a live viewport.** Verified by grep audit instead: every
multi-field row (Step 1 Land+Stad and hours grids, Step 2 choice-card grid, Step 3
contact and salary grids in both variants) uses `repeat(auto-fit, minmax(...))` with the
plan's exact breakpoints, and every header/footer row that needs to reflow
(`app-shell` nav, page H1 row, preview header/footer, review-vacancy header) has
`flex-wrap: wrap`. This is not the same as an eyeballed 768px/1024px check — flagging
this gap explicitly rather than claiming a visual pass; a human (or an agent with a
real browser/screenshot tool) should still do the actual resize-and-look pass before
sign-off.

## T033 — [review-gate] Final review: vacancy-creation (design-parity revision)
Depends on: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012,
T013, T014, T015, T016, T018, T020, T020b, T021, T022, T023, T024, T025, T026, T027,
T028, T029, T030, T031, T032.
(T017/T019 superseded by T031/this task respectively — not independent dependencies of
this gate, their work is subsumed by T031's extended flow and this final review.)
Single end-of-feature review checkpoint for the **whole feature as it now stands**,
including everything T019 already approved. `jobzy-frontend-reviewer` runs against the
full accumulated diff since the last review — FSD boundaries (Steiger/lint clean),
API-boundary discipline, PII handling per plan §6, the shared-generation-hook
single-instance discipline (plan §10.8), the two contract-gap ADRs' resolutions, ADR-0003
and ADR-0004's resolutions actually implemented as written, test coverage per plan §7 +
§10.6, and tablet responsiveness per T032's recorded verification. Do not mark this task
complete except via the reviewer's `Reviewed-by: jobzy-frontend-reviewer` sign-off.

**2026-09-20 — fixes applied for jobzy-frontend-reviewer's REQUEST_CHANGES on T020-T032:**
- Data-loss bug: `VacancyContactOfferForm` now accepts an `initialValues` prop
  (`contactPerson`/`offer`), threaded from `VacancyCreatePage` the same way step 1 already
  does — navigating back to step 3 via the Stepper no longer blanks the form or nulls out
  previously-saved salary fields on resave.
- ADR-0004's `CountrySelect`/`renderSuffix` gap: added a `suffix` prop to
  `shared/ui/Select`, rendered as an absolutely-positioned `--font-mono` badge next to the
  control; wired into the Land select in `VacancyCoreForm` as the selected ISO2 code.
- Navbar/Card spacing brought in line with the recorded pixel values: `Card` padding is
  now 28px; `AppShell`'s header row now uses a fixed 64px height, `--space-3` horizontal
  padding, and `--space-4` gap; `.navItem` uses `8px 12px` padding, `--radius-control`,
  14px/600 type, and a hover background; `.avatar` is 40×40 with a transparent-by-default
  1.5px teal hover ring; `.accountMenu` is `min-width: 210px`, `--radius-card`,
  `--space-1` padding, with item hover using `--nav-active-bg`/`--nav-active-fg`.
- Step 3 manual-mode button-label collision: `VacancyDescriptionEditor`'s save button is
  now labelled "Concept opslaan" (it only saves the draft into page state, unlike
  `VacancyContactOfferForm`'s "Volgende" which actually advances to step 4).
- Salary formatting: added `entities/vacancy/lib/salary.ts` (`formatSalary`, using
  `Number.toLocaleString('nl-NL')` and the `€4.200 – €5.500 per maand` shape) and switched
  both `VacancyPreview` and `ReviewVacancy` to it, so they can no longer drift; `ReviewVacancy`
  now also shows "Salaris in overleg" when there's no offer.
- `Stepper` now has a third "done" visual state (teal-filled circle + checkmark, plus a
  teal connector segment) for steps before the current one, distinct from the current
  (teal outline) and future (gray) states.

All items were fixed as described in the findings; nothing was left unresolved or
disputed. Full check suite after the fixes: `tsc -b` clean, `eslint . && steiger ./src`
clean, `vitest run` 138/138 passing, `vite build` succeeds, `playwright test` 1/1 passing
(existing e2e spec updated for the "Concept opslaan"/"Volgende" button-label split and the
new salary format string).

**2026-09-20 (later same day) — real tablet-width navbar overflow bug found by a live
browser resize check** (`src/widgets/app-shell/ui/AppShell.module.css`): between ~700px
and ~800px viewport width (iPad-portrait 768px included) the navbar's `.account` avatar
wrapped onto a second row that then rendered outside `.headerInner`'s fixed 64px height,
overlapping the page content below it — confirmed via Playwright screenshots at
640/768/900/1024/1440px before and after. Fixed by switching `.headerInner` and `.nav`
from `flex-wrap: wrap` to `nowrap` and adding a `max-width: 900px` media query that
tightens `.headerInner`/`.nav` gaps and `.navItem` padding so the logo, all 4 nav items,
and the avatar fit on one line down to 640px; desktop (>900px, i.e. the 1024px/1440px
spec widths) is untouched, still using the exact literal padding/gap values from finding
#3. Re-verified with the same screenshot approach (640/768/900/1024/1440px, all single-row
with the avatar fully visible) and the full check suite (`tsc -b`, `eslint . && steiger
./src`, `vitest run` 138/138, `vite build`, `playwright test` 1/1) all still green.

Reviewed-by: jobzy-frontend-reviewer — all 6 fixes verified against code (initialValues wiring, Select suffix, Card/AppShell CSS tokens, button-label split, formatSalary helper, Stepper done-state); tsc/eslint/steiger/vitest re-run independently and clean (138/138). APPROVE.
