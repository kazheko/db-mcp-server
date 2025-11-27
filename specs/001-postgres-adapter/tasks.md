---

description: "Task list for implementing the PostgreSQL adapter feature"
---

# Tasks: PostgreSQL Adapter Integration

**Input**: Design documents from `/specs/001-postgres-adapter/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested in the specification; verification happens via manual invocation workflows documented in quickstart.

**Organization**: Tasks are grouped by user story to keep each slice independently deliverable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (different files, no blocking dependency).
- **[Story]**: US1/US2/US3 labels map directly to spec priorities.
- Every task references the exact file path(s) it touches.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prep project dependencies and environment stubs so adapter work can begin.

 - [X] T001 Add the `pg` runtime dependency plus corresponding type definitions in `package.json`/`package-lock.json` to support PostgreSQL pooling.
 - [X] T002 [P] Document the `POSTGRES_CONNECTION_STRING` placeholder in `.env.example` (mirroring `.env` if committed) so every environment knows how to supply credentials.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish reusable query contracts and validation utilities before introducing the Postgres slice.

- [X] T003 Create `src/shared/queries.ts` defining the reusable `QueryAdapter`, `QueryRequest`, and `QueryResponseEnvelope` types described in plan.md.
- [X] T004 [P] Refactor `src/mssql/types.ts` to re-export the shared query contracts from `src/shared/queries.ts`, removing duplicated interfaces.
- [X] T005 [P] Update `src/mssql/adapter.ts` to consume the shared query contracts and ensure existing tool wiring compiles without local types.
- [X] T006 [P] Promote the validation decorator logic from `src/mssql/validator.ts` into a new shared module `src/shared/sql-validator.ts` so adapters can wrap themselves uniformly.
- [X] T007 [P] Rewire `src/mssql/validator.ts` to import the shared validator, keep the `withMssqlValidation` entry point, and confirm exports stay backward compatible.

**Checkpoint**: Shared query + validation infrastructure ready; PostgreSQL-specific work can proceed.

---

## Phase 3: User Story 1 – Execute validated PostgreSQL metadata queries (Priority: P1) – MVP

**Goal**: Provide a PostgreSQL adapter that runs a single validated metadata/statistics query and returns shared JSON envelopes.

**Independent Test**: Use `scripts/mcp/invoke.ts` to call the Postgres adapter with a `pg_catalog` query and verify valid SQL returns rows while forbidden statements trigger strikethrough validation errors before any network call.

### Implementation for User Story 1

- [X] T008 [US1] Author the Postgres validation policy in `src/postgres/validation-policy.ts`, mirroring allowed schemas (`pg_catalog`, `information_schema`) and denial lists from research.md.
- [X] T009 [P] [US1] Create `src/postgres/validator.ts` that invokes the shared `withSqlValidation` helper with the Postgres policy to enforce single-statement metadata queries.
- [X] T010 [US1] Implement `src/postgres/adapter.ts` that builds a `pg.Pool`, applies the validator before execution, enforces `maxRows`, and returns the shared response envelope with timestamps/row counts.
- [X] T011 [P] [US1] Extend `scripts/mcp/invoke.ts` to add a Postgres invocation path (flag or command) so operators can manually run allowed queries and capture validation failures for documentation.

**Checkpoint**: Postgres adapter executes validated metadata queries end-to-end independent of other stories.

---

## Phase 4: User Story 2 – Manage the connection string via environment (Priority: P2)

**Goal**: Ensure the adapter sources configuration solely from `POSTGRES_CONNECTION_STRING` and surfaces clear guidance when missing/malformed.

**Independent Test**: Rotate `POSTGRES_CONNECTION_STRING`, restart the server, and observe that the adapter refuses to run without a valid URI while reconnecting cleanly after updates.

### Implementation for User Story 2

- [X] T012 [US2] Implement the env loader `src/adapters/postgres-config.ts` that trims, validates (`postgres://` scheme, host, database, optional sslmode), and returns config per data-model guidance.
- [X] T013 [US2] Wire the env loader + descriptive startup errors into the Postgres adapter factory in `src/postgres/adapter.ts`, ensuring missing/malformed strings throw before pool creation.
- [X] T014 [P] [US2] Create `docs/postgres-adapter.md` (or update existing onboarding doc) documenting variable setup, rotation steps, and restart requirements referenced by quickstart.md.

**Checkpoint**: Configuration can be managed entirely through environment variables with clear operator guidance.

---

## Phase 5: User Story 3 – Reuse shared query contracts for PostgreSQL (Priority: P3)

**Goal**: Keep the Postgres slice type-compatible with existing tools so future MCP specs consume the adapter without new contracts.

**Independent Test**: Run `npm run typecheck` (or `tsc --noEmit`) and confirm both MSSQL and Postgres modules import the shared query types with no duplicate definitions; contract documentation matches the shared envelope fields.

### Implementation for User Story 3

- [X] T015 [US3] Create `src/postgres/index.ts` that exports the adapter factory, `PostgresMetadataQuery` types, and shared query envelope bindings to mirror the MSSQL exports.
- [X] T016 [US3] Update `specs/001-postgres-adapter/contracts/postgres-metadata-query.openapi.yaml` so request/response schemas explicitly reference the shared fields (correlationId, timestamps, rowCount) and align with the adapter outputs.

**Checkpoint**: Shared contracts proven; Postgres adapter can be consumed by future MCP tools without new type plumbing.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates affecting multiple stories.

- [X] T017 Run the quickstart scenario from `docs/postgres-adapter.md` using `scripts/mcp/invoke.ts` to capture a successful metadata query plus a validation error example for release notes.
- [X] T018 [P] Update `AGENTS.md` with the finalized Postgres adapter tech stack + environment expectations so future agents inherit the new context.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → Blocks Foundational work (Phase 2).
- **Foundational (Phase 2)** → Must complete before any user story begins.
- **User Story Phases (3–5)** → Can start after Phase 2; proceed in priority order (US1 as MVP, then US2, then US3) or in parallel if dependencies are satisfied.
- **Polish (Phase 6)** → Runs after targeted user stories are complete.

### User Story Dependencies

- **US1** depends on shared query/validator infrastructure (Phase 2) only.
- **US2** depends on US1 (leverages adapter implementation) and Phase 2.
- **US3** depends on Phases 2 + 3 (shared types plus adapter exports) but not US2.

Resulting order: `Phase1 → Phase2 → US1 → (US2 || US3 once their dependencies complete) → Polish`.

## Parallel Execution Examples

### User Story 1

- Parallel option A: Work on validation policy (`src/postgres/validation-policy.ts`) [T008] while another developer builds the validator wrapper (`src/postgres/validator.ts`) [T009].
- Parallel option B: After validation pieces exist, implementer A wires the adapter logic (`src/postgres/adapter.ts`) [T010] while implementer B extends the invocation script (`scripts/mcp/invoke.ts`) [T011].

### User Story 2

- Parallel option A: One developer builds the env loader (`src/adapters/postgres-config.ts`) [T012] while another updates documentation (`docs/postgres-adapter.md`) [T014].
- Parallel option B: After loader exists, integrate it into the adapter (`src/postgres/adapter.ts`) [T013] while doc updates continue independently.

### User Story 3

- Parallel option A: Export plumbing (`src/postgres/index.ts`) [T015] can proceed while another contributor refreshes the OpenAPI contract (`specs/001-postgres-adapter/contracts/postgres-metadata-query.openapi.yaml`) [T016].

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phases 1–2 to establish dependencies.
2. Deliver Phase 3 (US1) and validate via manual invocation.
3. Pause for stakeholder review/demo before proceeding.

### Incremental Delivery

1. MVP (US1) provides validated metadata access.
2. Add US2 to enable environment-driven configuration + docs.
3. Add US3 to finalize shared contracts and documentation for future tooling.

### Parallel Team Strategy

1. Team collaborates on Phases 1–2.
2. Assign US1 core adapter work to Developer A, US2 env/documentation to Developer B, and US3 contract/export tasks to Developer C once dependencies resolve.
3. Reconvene for Phase 6 polish before handoff to tool-spec team.
