# Tasks: PostgreSQL Tool Registration

**Input**: Design documents from `/specs/001-add-postgres-tool/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are optional; this plan relies on `npm run mcp:invoke` smoke checks plus targeted unit tests for the tool handler.

**Organization**: Tasks are grouped by user story to keep each slice independently implementable and testable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Document environment prerequisites so engineers/operators know how to enable the PostgreSQL tool.

- [ ] T001 Update `POSTGRES_CONNECTION_STRING` guidance in `.env.example` so it explicitly mentions enabling the metadata tool entry point.
- [ ] T002 [P] Add a PostgreSQL tool prerequisites callout in `docs/postgres-adapter.md` under “Required Environment Variable”.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prepare shared exports and contract types every user story depends on.

- [ ] T003 Ensure `src/postgres/index.ts` exports the adapter + validator helpers needed by the tool handler.
- [ ] T004 [P] Extend `src/shared/queries.ts` with the `PostgresToolDefinition`/`PostgresToolInvocation` types from data-model.md.

**Checkpoint**: Adapter entry points and shared request/response types are ready for use.

---

## Phase 3: User Story 1 - Execute PostgreSQL metadata queries through MCP (Priority: P1) — MVP

**Goal**: Users can invoke `postgres.metadataQuery` with `database`, `query`, and optional `maxRows` to receive metadata rows validated through the adapter.

**Independent Test**: Register the tool, run `npm run mcp:invoke -- --engine postgres --database metadata --query "SELECT oid FROM pg_catalog.pg_class LIMIT 1"`, and verify compliant results plus validation failures for disallowed SQL.

### Implementation

- [ ] T005 [P] [US1] Add the PostgreSQL tool parameter schema + type exports to `src/tools/types.ts` using Zod (database/query/maxRows).
- [ ] T006 [US1] Implement `executePostgresMetadataQuery` handler in `src/server/postgres-metadata-tool.ts` that validates input and calls the adapter.
- [ ] T007 [US1] Register the handler inside `src/server/index.ts`, ensuring the MCP server exposes `postgres.metadataQuery` when the adapter is enabled.
- [ ] T008 [P] [US1] Create unit tests in `tests/unit/postgres/postgres-metadata-tool.test.ts` covering success responses and validation failures before adapter calls.

**Checkpoint**: The tool runs end-to-end for compliant metadata queries.

---

## Phase 4: User Story 2 - Discoverable tool contract during MCP handshake (Priority: P2)

**Goal**: MCP clients receive rich metadata (descriptions, docs URL, parameter details) for the PostgreSQL tool so they can auto-generate prompts/UI.

**Independent Test**: Start the MCP server, inspect the handshake payload, and confirm the `tools` entry for PostgreSQL matches the OpenAPI contract and documentation references.

### Implementation

- [ ] T009 [US2] Enhance the tool manifest builder in `src/tools/types.ts` with descriptions, docsUrl, and disabled reason text sourced from spec.md.
- [ ] T010 [P] [US2] Align `contracts/postgres-tool-openapi.yaml` with the final schema (parameter descriptions, response envelopes, disabled states).
- [ ] T011 [P] [US2] Add a “Client Integration” subsection in `docs/postgres-adapter.md` explaining handshake metadata and field-level validation hints.

**Checkpoint**: Clients can discover and render the tool using only handshake + contract artifacts.

---

## Phase 5: User Story 3 - Operate the tool safely and transparently (Priority: P3)

**Goal**: Operators can enable/disable the tool via environment configuration and rely on documentation to troubleshoot failures without new telemetry work.

**Independent Test**: Boot the server with and without `POSTGRES_CONNECTION_STRING`, confirm the tool toggles with actionable disabled reasons, and follow the documented troubleshooting steps for simulated driver errors.

### Implementation

- [ ] T012 [US3] Gate tool registration inside `src/server/index.ts` so missing/invalid `POSTGRES_CONNECTION_STRING` keeps the tool disabled with remediation text.
- [ ] T013 [P] [US3] Expand `specs/001-add-postgres-tool/quickstart.md` with troubleshooting steps covering env misconfigurations and timeouts.
- [ ] T014 [P] [US3] Document failure-playbook scenarios (missing env, driver timeout, validation block) in `docs/postgres-adapter.md` under an “Operations” section.

**Checkpoint**: Operators can safely manage the tool lifecycle using configuration gates and documentation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize shared documentation and manual validation artifacts across slices.

- [ ] T015 Capture success + validation error payload samples after manual runs and embed them in `docs/postgres-adapter.md`.
- [ ] T016 Update `specs/001-add-postgres-tool/quickstart.md` with the exact `npm run mcp:invoke` command/output captured in T015 for future smoke tests.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → enables Phase 2 by documenting required environment inputs.
- **Phase 2 (Foundational)** → must finish before any user story to expose adapters and shared contracts.
- **Phase 3 (US1)** builds on Phases 1–2 and delivers the MVP execution path.
- **Phase 4 (US2)** depends on US1 artifacts but can begin once the handler/type definitions exist.
- **Phase 5 (US3)** depends on US1 (handler) and Phase 2 shared types for consistent enablement messaging.
- **Phase 6 (Polish)** runs after targeted user stories complete to capture final documentation + samples.

### User Story Dependencies

1. **US1 (P1)** — no dependency on other stories; unlocks runtime execution.
2. **US2 (P2)** — depends on US1 schema exports for accurate handshake metadata.
3. **US3 (P3)** — depends on US1 handler plus shared types to drive documentation and enablement logic.

### Parallel Opportunities

- T001 and T002 touch different files and can run concurrently.
- Within Phase 2, T003 and T004 update separate modules and can proceed in parallel after high-level alignment.
- During US1, T005 and T008 are parallelizable (schema vs tests) once handler scaffolding exists.
- In US2 and US3, documentation-oriented tasks (T010–T014) can run concurrently because they touch separate files.
- Final documentation captures (T015, T016) can execute in parallel once manual runs finish.

### Parallel Example: User Story 1

```
Parallel Thread A: T005 (schema/types) ➝ T006 (handler)
Parallel Thread B: T008 (unit tests) preparing expectations before T007 wiring completes
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Finish Setup + Foundational (T001–T004).
2. Complete US1 tasks (T005–T008) and run `npm run mcp:invoke` smoke test.
3. Validate results with stakeholders before moving on.

### Incremental Delivery

1. Ship US1 as the MVP.
2. Layer US2 handshake improvements so clients auto-discover the tool.
3. Add US3 operational safeguards + docs (without telemetry changes).
4. Wrap up with Phase 6 documentation polish to capture verified outputs.

### Parallel Team Strategy

- Developer A: Focus on handler + server wiring (T006–T007, T012).
- Developer B: Own schema/contracts/docs (T005, T009–T011, T013–T016).
- Developer C: Build and maintain unit tests + shared types (T004, T008) while supporting manual validation runs.

---
