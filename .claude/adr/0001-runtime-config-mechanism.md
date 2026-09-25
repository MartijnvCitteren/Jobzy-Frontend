# ADR-0001: Runtime config via fetched `public/config.json`, not `window.__ENV__`

Status: Accepted
Date: 2026-09-19
Feature: vacancy-creation (issue #4)

## Context

The spec fixes the requirement (build once, promote the same artifact across
dev/test/prod on Azure Container Apps, API base URL resolved at runtime not build
time) but leaves the *mechanism* open. Two standard SPA patterns exist:

1. **Fetched `config.json`**: a static JSON file in `public/`, fetched via `fetch()` at
   app boot before the app renders. The container entrypoint (or, locally, a developer)
   overwrites this file per environment; the JS bundle never embeds environment values.
2. **`window.__ENV__`**: a `<script>` tag in `index.html` (or injected by the container
   entrypoint rewriting `index.html`) that sets a global object synchronously before any
   application JS runs.

## Decision

Use the fetched `config.json` mechanism.

## Reasoning

- **Local-dev ergonomics (this pass's actual scope)**: swapping `public/config.json` and
  reloading is a one-file edit with no rebuild and no `index.html` templating step —
  directly matches the spec's stated local-dev proof ("swap the runtime config file and
  confirm requests target the new URL").
- **Container-promotion story carries forward unchanged**: overwriting a static JSON
  file at container start (a well-known pattern, e.g. an entrypoint script writing
  `config.json` from environment variables before the static file server starts) is
  simpler and less error-prone than templating `index.html` on every container boot,
  which risks the app shell breaking if the injection step fails or is skipped.
- **Explicit, typed boot failure is easier to reason about**: a `fetch()` call has an
  obvious failure mode (network error, 404, malformed JSON) that maps directly onto the
  spec's "fail fast, never a silent fallback URL" requirement. `window.__ENV__` being
  `undefined` because a script tag silently failed to inject is a subtler failure to
  detect reliably (nothing throws by default; the app must explicitly check for the
  global's presence, which is equivalent complexity to a fetch-based check but without
  a natural "this failed to load" signal).
- **Trade-off accepted**: one extra network round-trip before first render (small; a few
  hundred bytes, same-origin, cacheable-with-`no-cache` headers to avoid stale config
  after a redeploy) versus `window.__ENV__`'s zero-latency synchronous availability.
  For an internal authenticated dashboard (not a performance-sensitive public page),
  this is an acceptable, explicitly-made trade.

## Consequences

- `app/main.tsx` must await `loadRuntimeConfig()` before rendering anything that needs
  the API base URL — including the fail-fast error screen itself, which renders
  independently of the rest of the app tree.
- `public/config.json` must be served with cache headers that don't go stale across a
  redeploy in later environments (not this pass's concern, but worth remembering when
  Azure Container Apps hosting is actually set up).
- Developers must not reach for `import.meta.env`/`.env` files for the API base URL —
  that would silently reintroduce build-time config and defeat the entire point of this
  ADR. Flagged explicitly in the plan (§8) and task T002.
