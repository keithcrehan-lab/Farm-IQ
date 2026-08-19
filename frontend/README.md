# FarmReturn Web

A real frontend for the whole product: authentication and all eight screens,
built against the `backend/` API. React + Vite + TypeScript, no UI
framework — plain CSS custom properties matching the design mockups'
palette (deep forest green, warm cream, gold accent) and type pairing
(Instrument Serif for headlines/hero figures, Manrope for UI text).

## Getting started

The backend must be running first (see `../backend/README.md`).

```bash
cp .env.example .env      # points at the backend; default is http://localhost:3000
npm install
npm run dev                # http://localhost:5173
```

Register an account (or sign in with one that already exists) and you'll
land on the dashboard. A brand-new account with no farm yet gets a short
"let's set up your farm" form before the dashboard loads.

## What's here

- **`src/api/`** — thin wrappers around every backend REST endpoint used by
  the app (`auth`, `farms`, `dashboard`, `fields`, `soilTests`,
  `fertiliserPlan`, `livestock`, `animals`, `profitability`, `groupBuy`,
  `assistant`), plus `client.ts` (the shared axios instance, JWT attached
  from `localStorage` via an interceptor). A few numeric Postgres columns
  (`numeric`/`decimal` types — soil pH, areas, weights, prices) come back
  from raw `find()`/`findOne()` reads as strings, a well-known TypeORM/
  node-postgres quirk; each affected wrapper normalizes those fields to
  real numbers right at the boundary so every consumer gets what the type
  promises, the same discipline the backend's own calculator layer already
  applies internally.
- **`src/context/AuthContext.tsx`** — holds the signed-in user; a stored
  token is verified against `GET /auth/me` on load rather than trusted on
  sight, since it could be expired or revoked.
- **`src/context/FarmContext.tsx`** — loads the signed-in user's farm once,
  shared by every screen via `useFarm()`, so only one screen (`AppShell`)
  has to handle "no farm yet" and "still loading."
- **`src/components/AppShell.tsx`** — gates every screen behind the farm
  check, then renders the shared header (logout) and the five-tab bottom
  nav (Home / Map / Herd / Money / Assistant).
- **`src/pages/`** — one page per mockup screen:
  - `DashboardPage` — the margin hero (honest "first year of data" message
    when `marginDeltaEur` is `null`, never a fabricated delta) and the
    alert feed, color- and icon-coded by category, sorted by severity as
    the API returns it.
  - `FarmMapPage` / `FieldDetailPage` — the field list (proportional area
    bars, land use, soil type) and a field's soil status, recommendations
    and test history.
  - `HerdPage` — winter housing capacity vs. projected stock, editable
    headcounts per livestock category, and individually tracked animals
    (add an animal, add a weighing, see ADG/target-weight progress).
  - `MoneyHubPage` / `FertiliserPlanPage` / `GroupBuyPage` /
    `ProfitabilityPage` — what to buy and its cost/benefit from real soil
    tests; joining or leaving group-buy offers (auto-filled requirement
    from the fertiliser plan where the offer supports that, farmer-entered
    otherwise — never guessed); margin by enterprise and by field.
  - `AssistantPage` — a real chat thread against `POST /assistant/ask`,
    conversations persisted server-side and switchable. With no
    `GEMINI_API_KEY` configured, the backend's honest "not configured"
    error surfaces in the UI rather than a fabricated answer or a crash.
- **`src/components/icons.tsx`** — one hand-drawn stroke-icon set shared by
  the bottom nav, alert categories and page headers.

## Verified

Typecheck, lint (0 errors — see the note in `DashboardPage.tsx` about one
deliberately-overridden `react-hooks/set-state-in-effect` false positive on
the standard mount-time fetch pattern, and in `GroupBuyPage.tsx` about
keeping an impure `Date.now()` read out of a component's render body), and
build all pass.

Driven live in a real browser (Playwright + the pre-installed Chromium)
against the real backend and a real seeded Postgres database, covering
every screen: login; the dashboard's real margin and alerts (including a
genuine winter-housing shortfall and a below-target soil pH alert); the
farm map and a field's soil recommendations; the fertiliser plan's cost/
benefit and per-field breakdown; joining and leaving a group-buy offer;
livestock headcount edits; adding an animal and recording a weighing;
profitability by enterprise and field; and the AI assistant's graceful
"not configured" state. Google Fonts failing to load in that sandboxed
browser is a network restriction of the test environment, not an app bug —
fonts load normally in a real browser with real internet access.

## What's deliberately not here yet

Drawing new field boundaries on a real map (fields are created via the
backend API for now — the map screen renders whatever boundaries already
exist), and visual design polish beyond matching the mockups' palette and
type.
