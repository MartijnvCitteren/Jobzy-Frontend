# ADR-0003: Adopt the real design system's token names verbatim

Status: Accepted
Date: 2026-09-20
Feature: vacancy-creation (issue #4), design-parity pass

## Context

`src/app/styles/tokens.css` was written during the first implementation pass against
approximate, screenshot-inferred design values, using this repo's own invented token
names (`--color-primary`, `--color-bg`, `--radius-card: 12px`, etc — see the file's own
header comment admitting the approximation). A real, authoritative design system handoff
is now available at `design_handoff_vacancy_creation/_ds/jobzy-design-system-*/tokens/*.css`
with real `oklch()` colour values, real spacing/radius/type scales, and real semantic
alias names (`--teal`, `--surface-bg`, `--radius-control`, `--nav-active-bg`, etc).

Two options for bringing the real values in:

1. **Adopt the real token names verbatim** — replace `tokens.css` wholesale with the
   `_ds` files' custom properties (colour, semantic, spacing, radius, typography, motion,
   fonts), consumed directly by every component under their real names.
2. **Keep this repo's existing token names, remap real values into them** — e.g.
   `--color-primary: oklch(0.46 0.09 175)` (the real teal), `--radius-card: 20px`, etc.,
   preserving the abstraction layer this repo already had.

## Decision

Adopt the real design system's token names verbatim (option 1).

## Reasoning

- The design handoff's own README is written entirely against the real names (e.g.
  "Selected: `border-color: var(--teal)`", "background: var(--status-passed-bg)") for
  every screen and component. Keeping this repo's placeholder names would force every
  future implementer to mentally (or via a lookup table) translate every README
  reference into the local name — a real, recurring cost with no offsetting benefit.
- This app has exactly one design source and one brand. The indirection an abstraction
  layer buys (swap themes/brands without touching consuming components) has no present
  use case here — introducing it now is designing for a hypothetical multi-brand future
  that isn't in scope (per this role's own judgment-call guidance: don't design for
  requirements the spec doesn't actually have).
- The real token files are already framework-agnostic plain CSS custom properties
  (confirmed in README: "the token CSS files are framework-agnostic and can be used
  as-is") — there's no technical reason to re-derive or rename them.
- Semantic aliases (`--surface-card`, `--text-primary`, `--action-primary`) already give
  components a "what is this surface for" naming layer on top of the raw palette
  (`--teal`, `--ink`) — that's the abstraction layer this repo needs, and the design
  system already provides it. A second, repo-local rename on top would be a redundant
  third layer.

## Consequences

- `src/app/styles/tokens.css` is fully replaced with the contents of
  `colors.css` + `semantic.css` + `spacing.css` + `radius.css` + `typography.css` +
  `motion.css` + `fonts.css` from the `_ds` bundle (concatenated or `@import`ed — Vite
  supports either; developer's call at implementation time).
- Every `shared/ui` component and every feature/page CSS module must be updated to
  reference the real names (`var(--teal)`, `var(--space-3)`, `var(--radius-control)`) —
  this is a breaking rename across the whole existing CSS surface, not an additive
  change. Sized as its own task (see `specs/tasks.md` T020) rather than folded silently
  into unrelated tasks, so the diff is reviewable as one coherent rename.
- Any future second brand/theme (not currently planned) would need to reintroduce an
  abstraction layer at that point — explicitly accepted as a future cost, not a present
  one.
