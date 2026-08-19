# FarmReturn Web

First pass at a real frontend: authentication and the Home Dashboard, built
against the `backend/` API. React + Vite + TypeScript, no UI framework —
plain CSS custom properties matching the design mockups' palette
(deep forest green, warm cream, gold accent) and type pairing (Instrument
Serif for headlines/hero figures, Manrope for UI text).

Everything else in the app — the map, soil intelligence, fertiliser plan,
livestock & housing, profitability, group buy, and the AI assistant — only
exists as API endpoints today. This is one real, fully-wired screen, not a
shell for screens that don't work yet.

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

- **`src/api/`** — thin wrappers around the backend's REST endpoints
  (`auth.ts`, `farms.ts`, `dashboard.ts`), plus `client.ts` (the shared
  axios instance, JWT attached from `localStorage` via an interceptor).
- **`src/context/AuthContext.tsx`** — holds the signed-in user; a stored
  token is verified against `GET /auth/me` on load rather than trusted on
  sight, since it could be expired or revoked.
- **`src/pages/`** — `LoginPage`, `RegisterPage`, `DashboardPage`. The
  dashboard renders exactly what `GET /farms/:farmId/dashboard` returns —
  the margin hero (with the honest "first year of data" message when
  `marginDeltaEur` is `null`, never a fabricated delta) and the alert feed,
  color- and icon-coded by category (housing/soil/weight/group-buy),
  sorted by severity as the API already returns it.
- **No bottom nav, no fake other-screens.** The design mockups show a
  bottom tab bar (Home/Map/Herd/Money/Assistant), but only Home is real —
  adding inert nav items would imply broken navigation rather than
  honestly showing what exists.

## Verified

Typecheck, lint (0 errors — see the note in `DashboardPage.tsx` about one
deliberately-overridden `react-hooks/set-state-in-effect` false positive on
the standard mount-time fetch pattern), and build all pass. Driven live in
a real browser (Playwright + the pre-installed Chromium) against the real
backend and a real Postgres database: login, the dashboard rendering true
data matching the exact figures produced across earlier backend sessions
(€48,200 margin, all 5 alert types), wrong-password error handling, and a
brand-new account's empty-state → create-farm → populated-dashboard flow —
all confirmed with zero console/page errors (Google Fonts failing to load
in that sandboxed browser is a network restriction of the test
environment, not an app bug — fonts load normally in a real browser with
real internet access).

## What's deliberately not here yet

Every other mockup screen, real error boundaries / retry UI beyond what's
built, and any visual design polish beyond matching the mockups' palette
and type — this is a first pass proving the stack end-to-end, not the
finished product.
