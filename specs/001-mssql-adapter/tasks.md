# Tasks: Real MSSQL Adapter Integration

**Input**: Design documents from `specs/001-mssql-adapter/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mssql-query.openapi.yaml

**Tests**: Add or update Vitest suites only where stories require explicit verification.

## Format

- `[P]` indicates tasks that can proceed in parallel once their phase prerequisites finish.
- `[US#]` ties a task directly to a user story from `spec.md`.
- All file paths below are repository-relative to avoid ambiguity.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure the repository has the dependencies and environment scaffolding required for a real MSSQL adapter before feature work begins.

- [X] T001 Add the `mssql` runtime dependency to `package.json` and regenerate `package-lock.json` so the driver is installable everywhere.
- [X] T002 Create a checked-in `.env.example` documenting the `MSSQL_CONNECTION_STRING` variable so local environments can be bootstrapped consistently.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core wiring that every user story depends on (connection metadata, shared types, and testing hooks).

- [X] T003 Implement `loadConnectionConfig()` in `src/adapters/mssql-config.ts` to read `MSSQL_CONNECTION_STRING`, trim it, and expose a typed `MssqlConnectionConfig` object shared by all adapters.
- [X] T004 Extend `src/mssql/types.ts` with the `MssqlConnectionConfig`, `MssqlMetadataQuery`, and `MssqlQueryResult` interfaces referenced in the data model so adapters and tools share the same contracts.
- [X] T005 [P] Add a reusable mock for the `mssql` driver under `tests/unit/adapters/__mocks__/mssql.ts` (plus a helper index) so later Vitest suites can simulate connection pools without a live server.

**Checkpoint**: Connection metadata, shared types, and mocking hooks exist; user-story work can start.

---

## Phase 3: User Story 1 – Execute MSSQL queries via MCP (Priority: P1) **MVP**

**Goal**: Replace the stub with a production adapter that executes a single query against SQL Server using the shared connection string and returns driver rows through the MCP tool without altering error payloads.

**Independent Test**: Invoke `npm run mcp:invoke -- --database <db> --query "SELECT ..." --maxRows 5` while `MSSQL_CONNECTION_STRING` points at a fixture database and confirm JSON rows plus errors mirror real driver output.

### Implementation

- [X] T006 [US1] Rewrite `src/mssql/adapter.ts` to instantiate a singleton `mssql.ConnectionPool`, execute the provided SQL, cap returned rows to `maxRows`, and propagate driver errors untouched.
- [X] T007 [US1] Update `src/server/index.ts` so it composes the adapter via `createMssqlAdapter()` instead of `StubMssqlAdapter`, ensuring only the production adapter is registered with the MCP server.
- [X] T008 [P] [US1] Refresh `src/mssql/tool.ts` (and related logging helper) to describe the real adapter (no “deterministic stub”) and confirm the handler still emits `correlationId`, timing fields, and JSON rows.
- [X] T009 [US1] Expand `tests/unit/adapters/mssql.test.ts` to mock the driver, covering success rows, row-capping, and error propagation from `mssql.Request.execute`.
- [X] T010 [US1] Update `tests/contract/mssql-tool.contract.test.ts` to assert the MCP tool streams the adapter payload verbatim (content + errors) instead of the old synthetic rows.

**Checkpoint**: Operators can run real read-only queries end-to-end via MCP using the environment connection string.

---

## Phase 4: User Story 2 – Configure runtime connection settings (Priority: P2)

**Goal**: Enforce that the adapter reads the connection string only from `MSSQL_CONNECTION_STRING`, fails loudly when it’s missing or blank, and documents how to retarget environments via restarts.

**Independent Test**: Unset `MSSQL_CONNECTION_STRING` and start the MCP server to observe a startup failure; set a new value, restart, and run a metadata query to verify results come from the updated database.

### Implementation

- [X] T011 [US2] Enhance `src/adapters/mssql-config.ts` with defensive checks (empty string, malformed prefix) that throw descriptive startup errors before any pool connects.
- [X] T012 [P] [US2] Add Vitest coverage to `tests/unit/adapters/mssql-config.test.ts` proving missing or malformed environment variables cause the adapter bootstrap to reject.
- [X] T013 [P] [US2] Update `specs/001-mssql-adapter/quickstart.md` (and reference it from `.env.example`) so operators know how to set, rotate, and restart after changing `MSSQL_CONNECTION_STRING`.

**Checkpoint**: Connection strings are controlled centrally, validated on launch, and fully documented.

---

## Phase 5: User Story 3 – Remove legacy stub adapter (Priority: P3)

**Goal**: Eliminate the deterministic stub implementation so no code path or documentation references mock data once the real adapter ships.

**Independent Test**: Run `rg -n "StubMssqlAdapter" -g"*.ts"` and confirm no results; bundle outputs and docs mention only the production adapter.

### Implementation

- [X] T014 [US3] Delete the stub-specific templates, constants, and `StubMssqlAdapter` export from `src/mssql/adapter.ts`, leaving only the real adapter implementation.
- [X] T015 [P] [US3] Remove any lingering `StubMssqlAdapter` imports/usages from `src/server/index.ts`, `tests`, and `scripts/mcp/invoke.ts` so build artifacts can’t reference the stub.
- [X] T016 [P] [US3] Update the manual notes in `AGENTS.md` and related docs to drop references to “deterministic stub” now that only the real adapter remains.

**Checkpoint**: Repository, tests, and docs contain zero stub references.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and docs cleanup across stories.

- [X] T017 [P] Refresh `specs/001-mssql-adapter/contracts/mssql-query.openapi.yaml` so descriptions match the real adapter behavior (no stub wording, no premature SQL validation claims).
- [X] T018 Run `npm run build` and `npm test` from repo root to ensure TypeScript outputs and Vitest suites pass with the new driver on CI.

---

## Dependencies & Execution Order

1. **Setup (Phase 1)** → adds dependencies and env scaffolding.
2. **Foundational (Phase 2)** → requires Setup; creates shared config/types/mocks.
3. **User Story 1 (Phase 3)** → depends on Foundational; delivers MVP real adapter functionality.
4. **User Story 2 (Phase 4)** → depends on US1 wiring (adapter + config) to enforce runtime configuration.
5. **User Story 3 (Phase 5)** → depends on US1+US2 completion so the stub can be safely deleted.
6. **Polish (Phase 6)** → runs after all desired stories for final docs/tests.

User stories can run sequentially (P1 → P2 → P3) or partially parallel once their prerequisites finish, but each maintains independent acceptance criteria.

---

## Parallel Execution Examples

- After Phase 2, tasks **T008**, **T012**, **T013**, **T015**, and **T017** are marked `[P]` and can proceed concurrently because they touch different files once their prerequisites are satisfied.
- Within User Story 1, a developer can tackle **T008** (tool copy) while another focuses on **T006/T007** (adapter/server) since they modify separate modules.
- Documentation updates (**T013**, **T016**, **T017**) can run alongside code changes because they do not depend on runtime artifacts beyond the established adapter contract.

---

## Implementation Strategy

### MVP First (User Story 1)
1. Complete Setup and Foundational phases.
2. Execute T006–T010 to ship the real adapter plus tests.
3. Validate via `npm run mcp:invoke` before moving on.

### Incremental Delivery
1. Deliver US1 as MVP, demo real query execution.
2. Layer US2 to harden configuration management and documentation.
3. Finish with US3 cleanup plus the Polish phase to tidy contracts/tests.

### Parallel Team Option
1. One developer finalizes adapter/server wiring (T006–T007) while another refreshes tool copy/tests (T008–T010).
2. A third developer can own docs and configuration validation tasks (T011–T013).
3. Conclude with a coordinated pass on stub removal and polish tasks (T014–T018).



