# Open questions / risks — vacancy-creation (issue #4)

Running list of things a human should confirm later. Append new entries under a dated
heading rather than editing history away.

## 2026-09-19 — architect pass (jobzy-frontend-architect)

1. **Contract bug: `VacancyUpdateRequest` cannot carry hours-per-week.**
   `PATCH /vacancy/{id}` only has a `hoursPerWeek` field that doesn't exist as a real
   property anywhere in `specs/vacancy.yml` (should be `minHoursPerWeek`/
   `maxHoursPerWeek`, matching `VacancyCoreRequest`/`VacancyResponse`). Same phantom
   field also appears in those two schemas' `required` arrays without a matching
   property. Worked around in this pass per `.claude/adr/0002-hours-per-week-edit-after-creation.md`
   (hours become read-only once a vacancy exists). **Needs a human to raise this with
   the backend/`jobzy-contracts` team** — it's a cross-team fix, not something the FE
   can resolve unilaterally, and it currently caps what Step 1 re-editing can do.

2. **`SalaryPeriod` enum mismatch with the design notes.** Design notes describe a
   Salarisperiode dropdown with per-uur / per-dag / per-maand / per-jaar, but the API
   enum is `HOURLY`/`MONTHLY`/`ANNUAL` only — no daily option. Plan builds the dropdown
   from the API enum (3 options). **Needs confirmation**: was "per-dag" a genuine
   product requirement that the backend enum is missing, or was it a design mockup
   error? If the former, that's another upstream contract change; if the latter, no
   action needed beyond what's already planned.

3. **Category grouping display ("Software · Backend development").** The design mockup
   shows what looks like a grouped/prefixed category label, but the API's
   `VacancyCategory` enum (21 flat values, e.g. `ENGINEERING`) has no such parent
   grouping, and the design note itself flags this as only 9/10 confidence — likely a
   FE-built display convenience over the flat enum, not a real second taxonomy level.
   Plan builds a **flat** select (pragmatic simplification, explicitly not an ADR-level
   decision — low stakes, easy to layer grouping in visually later without touching the
   data model). **Needs confirmation**: is grouped-by-friendly-label display actually
   wanted, and if so what are the groups/labels? Not blocking for this pass.

4. **Exact design tokens unreachable this session.** The issue names an `_ds` bundle
   (colors, fonts, motion, radius, semantic, spacing, typography) and `support.js`
   inside the Claude Design canvas project; this session could only capture rendered
   screenshots of Step 1, not the raw token files. The plan approximates hex/spacing
   values (dark green primary, warm off-white background `~#faf9f7`, violet
   `--surface-advice`, `~12px` card radius) as CSS custom properties. **Needs a human
   with canvas access** to pull the real token values and diff them against what ships,
   including the exact `--content-max` px value (unknown — currently a guessed CSS
   custom property with no committed value beyond "reasonable content width").

5. **Steps 2-4 are inferred, not directly observed.** Only Step 1 ("Basisgegevens") was
   captured from the actual design file; Steps 2 ("Vacaturetekst"), 3 ("Contact en
   voorwaarden"), and 4 ("Overzicht") are reconstructed from the stepper labels, the API
   contract shape, and the in-canvas design-change comment log (e.g. the AI card's
   violet "advice" styling). Functionally sound (contract-driven), but layout/visual
   details on these three steps should be treated as provisional until someone
   cross-checks them against the actual design file. Not blocking implementation.

6. **Account menu behavior (Account / Instellingen / Support) unobserved.** Design note
   says this menu exists per the comment log but its actual behavior wasn't captured.
   Plan builds it as static/non-functional (labels render, no navigation) rather than
   inventing routes. **Needs confirmation** if/when those destinations matter — out of
   scope for issue #4 regardless.

7. **Auth is entirely out of scope for issue #4** but `shared/api/http-client` leaves a
   `getAuthToken(): string | null` seam returning `null` today. **Needs a human decision**
   on when/how auth actually lands (token storage mechanism, login flow) before any
   endpoint requiring a real bearer token can be exercised against a real backend beyond
   local mocking — every endpoint in `specs/vacancy.yml` requires `bearerAuth`, so this
   will block real (non-mocked) local testing against an actual `jobzy-backend`
   instance, not just this UI's own logic.

## 2026-09-19 — reviewer pass (jobzy-frontend-reviewer)

8. **Currency dropdown narrows the contract.** `Offer.currency` is a free-text
   ISO-4217-pattern field in `specs/vacancy.yml` (`pattern: '^[A-Z]{3}$'`), not an enum.
   `features/edit-vacancy-contact-offer/lib/currencies.ts` restricts the UI to 9
   EU-focused currencies (EUR/GBP/CHF/SEK/DKK/PLN/CZK/HUF/RON), so e.g. a `REMOTE` role
   hiring in USD currently isn't representable through the UI. Non-blocking pragmatic
   simplification, same treatment as items 2-3 above. **Needs confirmation**: is a fixed
   EU currency list actually sufficient, or should this become a free-text/searchable
   field matching the contract?

9. **Client-side email format validation.** `VacancyContactOfferForm` only checks that
   `email` is non-empty, not that it's a plausible email shape — invalid formats are
   currently only caught by the backend's `400` response. Low-stakes nitpick, not
   blocking; would be a small follow-up (regex or `type="email"` + browser validation).
