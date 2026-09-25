# ADR-0004: Restyled native `<select>` for the three dropdowns, not a custom listbox

Status: Accepted
Date: 2026-09-20
Feature: vacancy-creation (issue #4), design-parity pass

## Context

The design handoff specifies one custom dropdown component used three times (Categorie,
Land, Per periode — README "Custom dropdown (used 3x)"). The prototype implements it as
a div-based, absolutely-positioned menu that the README itself flags as an accessibility
gap: "the prototype's dropdowns are div-based and not keyboard operable. In the real
build use the codebase's accessible listbox/combobox … or a native `<select>` where the
styling allows."

The current build (`shared/ui/Select.tsx`) already uses a native `<select>` with a
custom-styled wrapper (label + trigger chrome via CSS, browser-rendered option list).
This is close to the design's visual spec (padding, border, radius, chevron via CSS)
except for one detail: the Land dropdown additionally shows the selected ISO2 code in
`--font-mono` at 12px, positioned between the visible label text and the chevron —
something a plain native `<select>`'s single text node can't render (it can only show
one string as the selected value).

Two options:

1. **Fully custom listbox** (ARIA `role="listbox"`/`combobox`, div-based options,
   keyboard nav, type-ahead, focus return — i.e. build the accessible version of what
   the prototype visually shows) for all three dropdowns, including the ISO2 suffix.
2. **Restyled native `<select>`** for Categorie and Per periode (exact visual + full
   native keyboard/screen-reader support for free); for Land, wrap the native `<select>`
   in a `position: relative` container with an absolutely-positioned, `pointer-events:
   none` `<span>` showing the ISO2 code in mono, sitting between the (left-aligned,
   naturally short) select text and the chevron.

## Decision

Restyled native `<select>` (option 2), including the Land ISO2-suffix wrapper trick.

## Reasoning

- The README explicitly names native `<select>` as an acceptable resolution to its own
  flagged accessibility gap ("where the styling allows") — this isn't a deviation from
  the design intent, it's the design document's own suggested implementation path.
- A native `<select>` gets keyboard operability (arrow keys, type-ahead, Escape, Enter),
  screen-reader semantics, and mobile OS picker behaviour for free — the exact
  accessibility properties a from-scratch custom listbox would have to hand-build and
  test (focus trap, `aria-activedescendant` wiring, roving tabindex, type-ahead buffer
  timing). Building a correct accessible combobox from scratch is a meaningfully larger,
  easy-to-get-subtly-wrong effort than styling a native control.
- The one visual gap (ISO2 suffix on Land) is solvable without abandoning the native
  control: an absolutely-positioned, non-interactive `<span>` overlay is a well-known,
  low-risk CSS pattern (the select's own text is left-aligned and short, so it never
  visually collides with a right-aligned overlay placed before the chevron).
- `Categorie`'s options list (21 flat values, no grouping per the existing plan's
  resolution — open-questions.md #3) and `Per periode`'s (3 values) both fit
  comfortably in a native `<select>`'s default rendering; neither needs the menu's
  `max-height: 264px` scroll behaviour the design specifies for a much longer custom
  list, since native `<select>` popups already handle long lists via the OS's own UI.

## Alternatives considered

- **Build the fully custom listbox everywhere** (option 1). Rejected for this pass:
  meaningfully more implementation and testing surface (focus management, ARIA wiring,
  outside-click-closes-all-but-one-dropdown coordination across 3 instances + the avatar
  menu) for a visual gap (native `<select>`'s own OS-styled dropdown chrome vs. the
  design's exact `--radius-control`/`--border-hairline` menu styling) that's cosmetic,
  not functional. Worth reconsidering only if a future dropdown needs option content
  richer than plain text (icons, secondary lines) that `<option>` genuinely can't render
  — not the case for any of these three.

## Consequences

- `shared/ui/Select` keeps its native-`<select>` foundation; gets restyled to match the
  README's exact trigger chrome (padding, 1.5px `--border-hairline`, `--radius-control`,
  hover → `--border-focus`, `chevron-down` icon overlay).
- A `CountrySelect` wrapper (or a `Select` prop like `renderSuffix`) is needed
  specifically for Land's ISO2 mono suffix — scoped to `entities/location` or
  `shared/ui`, developer's call at implementation time; either is a reasonable FSD
  placement since it's presentational and has no business logic beyond "look up the
  code for the selected value".
- The outside-click-closes-all-dropdowns `[data-dd]` pattern in the README doesn't apply
  to native `<select>` (the browser owns its own open/close lifecycle) — it's still
  needed for the avatar account menu, which remains a real custom dropdown (not a
  `<select>`, since it renders navigable menu items, not a form value).
