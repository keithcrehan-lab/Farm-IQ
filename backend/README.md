# FarmReturn API

Backend for FarmReturn: authentication, farm profile, land mapping (fields
with PostGIS geometry), soil intelligence, whole-farm fertiliser planning,
and livestock & winter housing. Built with NestJS, TypeORM and
PostgreSQL/PostGIS.

Profitability, group buying and the AI assistant are deliberately not in
here yet — see the product spec for what's next.

## Stack

- **NestJS** (TypeScript) — modular structure: `auth`, `users`, `farms`, `fields`, `soil-tests`, `fertiliser-plan`, `livestock`
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

## Fertiliser plan

`FertiliserPlanService` (`src/fertiliser-plan/`) aggregates every field's
latest soil test through `SoilIntelligenceService`, sums the resulting
lime/phosphorus/potassium requirements across the farm, and converts each
into a purchasing quantity and cost via a small reference product catalog
(`fertiliser_products`, seeded by migration — one straight, single-nutrient
product per category, so the kg-of-nutrient → tonnes-of-product conversion
stays exact rather than guessed). Fields with no soil test yet are reported
separately rather than silently skipped.

**Nitrogen (protected urea, CAN, ...) is deliberately not included.**
Unlike pH/P/K, nitrogen requirement isn't derivable from a soil test — it
depends on stocking rate, grassland N index and nitrates-regulation limits,
none of which this API models yet. The endpoint's `notes` field says so
explicitly rather than the response silently omitting it.

Exercise it with `GET /farms/:farmId/fertiliser-plan`.

## Livestock & housing

Two simple registers plus a deterministic capacity check:

- **Livestock groups** (`livestock_groups`) — a farm's headcount per category
  (cow, bull, calf, weanling, replacement heifer, finishing; ewe, ram, lamb,
  hogget). This is MVP-level category counting, not individual animal
  records yet (see spec section 15 for that future model). `species` is
  always derived server-side from `category`, never client-supplied, so an
  invalid species/category pairing can't exist. Recording a count is a `PUT`
  (upsert keyed on farm + category) — re-entering "20 cows" replaces the
  figure, it doesn't add a second row.
- **Buildings** (`buildings`) — sheds with a type and head capacity.
- **Housing summary** — `summarizeHousing` (`src/livestock/housing-intelligence.ts`)
  sums registered shed capacity against projected winter cattle numbers and
  reports the shortfall (or surplus), same pure/deterministic shape as
  `SoilIntelligenceService`. **Scoped to cattle only** — sheep are
  conventionally out-wintered on Irish farms rather than housed, so sheep
  headcount isn't counted against shed capacity; a farm that does house
  sheep is a gap to revisit, not something silently assumed away.

Exercise it with `GET /farms/:farmId/housing-summary`.

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
| GET | `/farms/:farmId/fertiliser-plan` | whole-farm lime/P/K purchasing plan |
| PUT | `/farms/:farmId/livestock-groups` | record/replace a category's headcount |
| GET/DELETE | `/farms/:farmId/livestock-groups[/:groupId]` | |
| POST/GET | `/farms/:farmId/buildings` | create / list sheds |
| PATCH/DELETE | `/farms/:farmId/buildings/:buildingId` | |
| GET | `/farms/:farmId/housing-summary` | winter capacity vs projected stock |

Full request/response shapes: run the server and open `/api/docs`.

## Tests

```bash
npm test
```

Covers the soil intelligence rules engine (including the exact Field 04
scenario from the design mockups: 6.4ha grazing field, pH 6.2 → a 16t
maintenance lime dressing at €512), the fertiliser plan's nutrient → product
tonnage conversion, and the housing capacity check (including the exact
mockup scenario: 71 projected cattle vs 64 registered spaces → shortfall of 7).

## What's deliberately not here yet

Profitability, group buying and the AI assistant all depend on this
foundation layer and are scoped for follow-up work, module by module.
