# FarmReturn API

Backend foundation for FarmReturn: authentication, farm profile, land mapping
(fields with PostGIS geometry), and soil intelligence. Built with NestJS,
TypeORM and PostgreSQL/PostGIS.

This is the **foundation layer** the rest of the FarmReturn spec builds on —
fertiliser planning, livestock & housing, profitability and the AI assistant
are deliberately not in here yet. See `docs/` (design mockups) and the
product spec for what's next.

## Stack

- **NestJS** (TypeScript) — modular structure: `auth`, `users`, `farms`, `fields`, `soil-tests`
- **PostgreSQL + PostGIS** — fields store their boundary as a real `geometry(Polygon,4326)` column
- **TypeORM** — migrations under `src/migrations`, no auto-sync outside local prototyping
- **Passport + JWT** — stateless bearer-token auth
- **class-validator** — request validation, including a custom GeoJSON polygon validator
- **@turf/turf** — server-side area calculation from a field's boundary (never trust a client-sent area)
- **Swagger** — live API docs at `/api/docs`

## Getting started

```bash
cp .env.example .env
docker compose up -d           # Postgres + PostGIS on localhost:5432
npm install
npm run migration:run          # creates the schema (users, farms, fields, soil_tests)
npm run start:dev              # http://localhost:3000, docs at /api/docs
```

## Domain model

```
User ──< Farm ──< Field ──< SoilTest
```

- A **Farm** belongs to one owning **User**. Every farm-scoped resource
  (fields, soil tests, ...) checks ownership through `FarmsService.findOneOwned`
  so access control lives in one place.
- A **Field** stores its boundary as GeoJSON in, GeoJSON out (TypeORM handles
  the `ST_GeomFromGeoJSON` / `ST_AsGeoJSON` conversion for `geometry` columns).
  `areaHa` is always recomputed server-side from the polygon via turf — it is
  never accepted from the client.
- A **SoilTest** is a dated lab result attached to a field (pH, P index, K
  index, optional Mg index / organic matter). History is retained, never
  overwritten.

## Soil intelligence

`SoilIntelligenceService` (`src/soil-tests/soil-intelligence.service.ts`) is a
pure, deterministic function: given a field's area/land use and a soil test's
pH/P/K, it returns structured recommendations — what's wrong, why it matters,
what to do, estimated cost, estimated benefit — one per nutrient that's off
target. It never calls a model. This is the "rules calculate" half of
FarmReturn's core principle; a future AI layer sits in front of it to explain
results conversationally, and should read these numbers rather than
recompute them.

The rates, costs and benefit figures in
`src/soil-tests/constants/nutrient-targets.constants.ts` are first-pass
placeholders shaped like real Teagasc-style guidance (pH targets by land use,
a 1–4 nutrient index scale, target index 3) — they need review against actual
Nutrient Advice tables and current input pricing before this goes near a real
farm.

Exercise it with `GET /farms/:farmId/fields/:fieldId/soil-tests/:testId/analysis`.

## API surface

All routes except `/auth/register` and `/auth/login` require
`Authorization: Bearer <token>`.

| Method | Path | |
|---|---|---|
| POST | `/auth/register` | create an account |
| POST | `/auth/login` | get a JWT |
| GET | `/auth/me` | current user |
| POST/GET | `/farms` | create / list your farms |
| GET/PATCH/DELETE | `/farms/:id` | |
| POST/GET | `/farms/:farmId/fields` | create / list fields on a farm |
| GET/PATCH/DELETE | `/farms/:farmId/fields/:fieldId` | |
| POST/GET | `/farms/:farmId/fields/:fieldId/soil-tests` | create / list soil test history |
| GET | `.../soil-tests/:testId` | one test |
| GET | `.../soil-tests/:testId/analysis` | rules-engine recommendation |

Full request/response shapes: run the server and open `/api/docs`.

## Tests

```bash
npm test
```

Currently covers the soil intelligence rules engine, including the exact
Field 04 scenario from the design mockups (6.4ha grazing field, pH 6.2 → a
16t maintenance lime dressing at €512).

## What's deliberately not here yet

Fertiliser plan aggregation, livestock & housing, profitability, group
buying and the AI assistant all depend on this foundation layer and are
scoped for follow-up work, module by module.
