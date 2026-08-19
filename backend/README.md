# FarmReturn API

Backend for FarmReturn: authentication, farm profile, land mapping (fields
with PostGIS geometry), soil intelligence, whole-farm fertiliser planning,
livestock & winter housing, profitability, group buying, and an AI
assistant. Built with NestJS, TypeORM, PostgreSQL/PostGIS, and the Gemini
API.

This covers all eight MVP modules from the product spec.

## Stack

- **NestJS** (TypeScript) — modular structure: `auth`, `users`, `farms`, `fields`, `soil-tests`, `fertiliser-plan`, `livestock`, `profitability`, `group-buy`, `assistant`
- **Gemini API** (`@google/genai`) — the assistant's language model
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
npm run migration:run          # creates/updates the schema
npm run start:dev              # http://localhost:3000, docs at /api/docs
```

Everything works with `.env.example`'s defaults except the AI assistant,
which needs a Gemini API key — see below.

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

## Profitability

Built on a real (if simple) transaction ledger rather than derived figures,
so it's honest about what it does and doesn't know yet:

- **Enterprises** (`enterprises`) — a farm's distinct business lines
  (suckler, sheep, tillage, ...), reusing `FarmType`'s categories. A single
  farm can run several side by side.
- **Transactions** (`transactions`) — one income or expense entry, always
  stored as a positive amount; whether it's revenue, a variable cost or a
  fixed cost is derived entirely from `category` via one metadata map
  (`transaction-category.constants.ts`) covering every category from spec
  section 22 — never from the sign of the amount. A transaction can
  optionally be tagged to an enterprise and/or a field (both cross-checked
  as belonging to the same farm on write).
- **`GET /farms/:farmId/profitability?year=YYYY`** — assembled entirely by
  a pure function (`profitability-calculator.ts`, same DB-free shape as the
  soil and housing engines) from that year's and the prior year's real
  transactions:
  - whole-farm revenue / costs (variable + fixed) / margin
  - **a genuine year-over-year comparison** — `previousYear.hasData` is
    `false` (not a fabricated zero) when there's simply no prior-year data
    yet, so the frontend can say "first year of data" instead of showing a
    misleading delta
  - **`topMarginContributors`** — the categories that moved the margin most
    year over year, computed from real per-category deltas (e.g. "€4,100
    from lower fertiliser spend, €3,300 from higher livestock sales"),
    never a hand-written explanation string
  - per-enterprise revenue/costs/margin, with transactions that aren't
    assigned to any enterprise reported separately
    (`unassignedToEnterprise`) rather than silently dropped
  - per-field return-per-hectare, with fields carrying no transactions
    yet listed in `fieldsWithoutTransactions`

## Group buying

Spec sections 10-13's "FarmReturn Buying Offer" — a simulated/local
purchasing deal a farmer can join:

- **Offers** (`group_buy_offers`) — one product, a typical vs. negotiated
  price, an aggregate-demand threshold, and an expiry. Created directly for
  this prototype (`POST /group-buy-offers`, open to any authenticated user)
  rather than generated by a supplier RFQ pipeline; a real deployment would
  restrict creation to an ops/admin role once one exists, or auto-generate
  offers from aggregated fertiliser-plan demand across a county — both real
  future work, not simulated here.
- **The honest-scoping hook is `fertiliserProductCategory`.** When an offer
  sets it (lime, phosphorus or potassium), a farm's requirement is read
  straight from its fertiliser plan — never guessed — and joining needs no
  input. When it's left unset (e.g. a nitrogen product like protected urea,
  which this API has no requirement model for — see Fertiliser plan above),
  the farmer must state their own requirement to join; the endpoint rejects
  a join with no quantity and no automatic source rather than inventing one.
- **`GET /farms/:farmId/group-buy-offers/:offerId`** — the personalized
  offer card: requirement, saving per tonne, estimated total saving,
  aggregate progress toward the supplier threshold, and whether this farm
  has already joined. All arithmetic lives in `group-buy-calculator.ts`
  (pure, DB-free, same pattern as every other engine in this API).
- **`PUT/DELETE .../join`** — join or leave. Joining is an upsert keyed on
  (offer, farm) — rejoining updates the committed quantity rather than
  duplicating it. The committed quantity is a snapshot taken at join time;
  it doesn't silently track a farm's fertiliser plan afterwards, the same
  way a real order confirmation wouldn't quietly change on you.

## AI assistant

Spec sections 28-29's conversational assistant — answers a farmer's
question using this farm's real data, never invented figures. It runs on
**Gemini** (the `@google/genai` SDK), and enforces "rules calculate, AI
interprets" (spec section 9) directly in the system prompt: the model is
told every number it's given was computed by this API's own deterministic
engines and must be treated as ground truth — never recomputed,
contradicted, or supplemented with a guess.

**Setup**: get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
(no card required) and set `GEMINI_API_KEY` in `.env`. Leave it blank and
the assistant endpoints respond with a clear 503 "not configured" error
instead of crashing — every other module works fine without it.

**On the free tier, Google may use your prompts to improve their
products.** Fine for development; switch to a paid key (same SDK, same
code, just billing) before any real farmer data goes through this — see
the comment in `.env.example`.

- **`AssistantContextService`** (`assistant-context.service.ts`) builds a
  `FarmSnapshot` fresh on every question by calling straight into the same
  services every other endpoint uses — fields + latest soil test + soil
  analysis per field, the whole-farm fertiliser plan, the housing summary,
  this year's profitability, and any group-buy offers relevant to the
  farm's county. No separate or looser calculation exists for the
  assistant to draw from.
- **`GET /farms/:farmId/assistant/context`** returns that snapshot on its
  own — no Gemini call, no key required. Useful for debugging, and for a
  frontend to show "what FarmReturn knows" alongside an answer.
- **`POST /farms/:farmId/assistant/ask`** — `{ question, history? }` (history
  is client-supplied prior turns, not persisted server-side yet) — builds
  the snapshot, sends it to Gemini with the question, and returns
  `{ answer, context }`.

**What I verified without a real key** (I can't obtain one myself): typecheck
against the real `@google/genai` type definitions, lint, build, the full
unit test suite, and — live, against Postgres — that `GET .../context`
returns correct real data pulled from every module, and that `POST
.../ask` fails with a clear 503 rather than crashing when unconfigured, and
rejects invalid input (missing question, bad history role) before ever
reaching Gemini. **The actual Gemini call itself is unverified by me** —
add your own key and try `/ask` for real; let me know if anything looks off.

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
| POST/GET | `/farms/:farmId/enterprises` | create / list business lines |
| PATCH/DELETE | `/farms/:farmId/enterprises/:enterpriseId` | |
| POST/GET | `/farms/:farmId/transactions` | record / list income & expense entries |
| PATCH/DELETE | `/farms/:farmId/transactions/:transactionId` | |
| GET | `/farms/:farmId/profitability?year=YYYY` | whole-farm / enterprise / field profitability |
| POST/GET | `/group-buy-offers` | create / browse offers (`?county=&fertiliserProductCategory=`) |
| GET | `/group-buy-offers/:offerId` | offer detail (platform-wide, no personalization) |
| GET | `/farms/:farmId/group-buy-offers/:offerId` | personalized offer + progress + join status |
| PUT/DELETE | `/farms/:farmId/group-buy-offers/:offerId/join` | join / leave |
| GET | `/farms/:farmId/assistant/context` | the data snapshot the assistant answers from |
| POST | `/farms/:farmId/assistant/ask` | ask a question (needs `GEMINI_API_KEY`) |

Full request/response shapes: run the server and open `/api/docs`.

## Tests

```bash
npm test
```

Covers the soil intelligence rules engine (including the exact Field 04
scenario from the design mockups: 6.4ha grazing field, pH 6.2 → a 16t
maintenance lime dressing at €512), the fertiliser plan's nutrient → product
tonnage conversion, the housing capacity check (71 projected cattle vs 64
registered spaces → shortfall of 7), the profitability calculator (including
the exact whole-farm/enterprise/field figures from spec sections 23–25, and
a synthetic year-over-year scenario matching the spec's stated €7,400 margin
improvement attributed to real category deltas), the group-buy calculator
(including the exact mockup figures: 8t @ €560/t vs €480/t = €640 saving,
and 126t committed against a 150t threshold), and the assistant's prompt
construction (history-turn role mapping, snapshot+question framing).

## What's deliberately not here yet

Everything in the product spec's MVP list (section 40) is now built. Real
next steps: persisting assistant conversation history server-side,
proactive intelligence / notifications (spec sections 29-31), individual
animal records (spec section 15) beyond the current category-count model,
and a real frontend — none of this has a UI yet, every module here is a
JSON API.
