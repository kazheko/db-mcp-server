# Tasks: Simple MCP MSSQL Tool

**Input**: Design documents from `/specs/001-add-mssql-tool/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Node.js/TypeScript workspace and directory skeleton described in plan.md.

- [X] T001 Update Node/TypeScript targets and dependency stubs in `package.json` and `tsconfig.json` for Node 20 + TypeScript 5 baseline.
- [X] T002 [P] Scaffold required source folders/files (`src/server/index.ts`, `src/tools/mssql-tool.ts`, `src/tools/tool-factory.ts`, `src/tools/log-wrapper.ts`, `src/adapters/mssql.ts`, `src/types/mssql.ts`) per plan structure.
- [X] T003 [P] Add npm scripts for `dev:mcp`, `mcp:invoke`, and `test` workflows referenced in quickstart within `package.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure needed before user-story-specific behavior.

- [X] T004 Define shared MSSQL adapter request/response interfaces and queryResult shapes in `src/types/mssql.ts`.
- [X] T005 [P] Implement the reusable logging/error decorator in `src/tools/log-wrapper.ts` with placeholders for future enhancements.
- [X] T006 [P] Configure Vitest (ESM + ts-node/tsx) and create base folder structure in `vitest.config.ts`, `tests/contract/`, and `tests/unit/`.
- [X] T007 Initialize the MCP server bootstrap with the official SDK (connection wiring only) in `src/server/index.ts`.

**Checkpoint**: Foundation ready ??' user stories can run independently.

---

## Phase 3: User Story 1 - Execute MSSQL query via stub adapter (Priority: P1) — MVP

**Goal**: Allow LLM clients to call the `mssql-query` tool and receive deterministic structural queryResults with correlation/timestamp metadata.

**Independent Test**: Use an MCP client to invoke `mssql-query` with varying `maxRows` values; verify the response includes `correlationId`, `database`, bounded `queryResult`, `startedAt`, and `completedAt`.

### Tests

- [X] T008 [P] [US1] Author the contract test covering successful tool invocation payloads in `tests/contract/mssql-tool.contract.test.ts`.
- [X] T009 [P] [US1] Add adapter stub unit tests ensuring deterministic rows and row caps in `tests/unit/adapters/mssql.test.ts`.

### Implementation

- [X] T010 [US1] Implement the deterministic MSSQL adapter stub honoring `maxRows` in `src/adapters/mssql.ts`.
- [X] T011 [US1] Build the tool handler that generates correlation IDs/timestamps and delegates to the adapter in `src/tools/mssql-tool.ts`.
- [X] T012 [US1] Register `mssql-query` with the MCP server bootstrap so it appears in the manifest in `src/server/index.ts`.
- [X] T013 [US1] Wire the CLI invocation helper and npm command used in quickstart (`scripts/mcp/invoke.ts` + `package.json`).

**Checkpoint**: User Story 1 independently testable (MVP).

---

## Phase 4: User Story 2 - Propagate adapter errors without modification (Priority: P2)

**Goal**: Ensure any adapter exception passes through the MCP error channel unchanged.

**Independent Test**: Trigger a forced adapter error (e.g., "Script timeout") and confirm the client receives the identical error payload with no success body.

### Tests

- [X] T014 [P] [US2] Extend tool-level unit tests with error propagation cases in `tests/unit/tools/mssql-query.test.ts`.

### Implementation

- [X] T015 [US2] Finalize the error handler to serialize and forward raw adapter errors in `src/errors/handler.ts`.
- [X] T016 [US2] Ensure the logging decorator wraps tool execution so failures emit structured error content in `src/tools/log-wrapper.ts`.

**Checkpoint**: User Stories 1+2 independently verifiable.

---

## Phase 5: User Story 3 - Discover MSSQL tool contract via metadata (Priority: P3)

**Goal**: Surface the MSSQL tool metadata (title, description, input/output schema) during manifest discovery.

**Independent Test**: Fetch the MCP server manifest and confirm the tool entry exposes each schema field exactly as documented.

### Tests

- [X] T017 [P] [US3] Add manifest/metadata assertions to the contract suite in `tests/contract/mssql-tool.contract.test.ts`.

### Implementation

- [X] T018 [US3] Populate the tool definition with the canonical title, description, and schema definitions in `src/tools/mssql-tool.ts`.
- [X] T019 [US3] Ensure the server handshake advertises the enriched tool metadata in `src/server/index.ts`.
- [X] T020 [US3] Document manifest discovery steps and expected schema output in `specs/001-add-mssql-tool/quickstart.md`.

**Checkpoint**: All user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation and validation touches shared across stories.

- [X] T021 [P] Validate the full quickstart flow (install, build, dev, invoke, error path) and update any clarifications in `specs/001-add-mssql-tool/quickstart.md`.
- [X] T022 Capture final developer notes and observed limitations for future adapters in `AGENTS.md` and `specs/001-add-mssql-tool/spec.md` references.

---

## Dependencies & Execution Order

1. **Setup (Phase 1)** > no dependencies.
2. **Foundational (Phase 2)** > depends on Setup; blocks User Stories.
3. **User Story 1 (Phase 3)** > starts after Foundational; completes MVP.
4. **User Story 2 (Phase 4)** > may begin once Foundational is done but ideally after US1 handler scaffold exists; depends on shared error infrastructure.
5. **User Story 3 (Phase 5)** > starts after Foundational; reuses US1 structures but remains independently testable.
6. **Polish (Phase 6)** > last phase once targeted stories reach acceptance.

---

## Parallel Execution Examples

- During Phase 1, T002 and T003 can run in parallel once T001 defines baseline tooling.
- Within User Story 1, tests (T008, T009) may proceed alongside adapter implementation (T010) since they target different files.
- User Stories 2 and 3 can progress concurrently after Phase 3 because their work touches distinct files (`src/errors/handler.ts` vs manifest wiring) aside from read-only references to existing modules.

---

## Implementation Strategy

1. Deliver MVP by completing Phases 1-3; verify via contract + adapter tests before merging.
2. Layer in transparent error propagation (Phase 4) to unblock troubleshooting workflows.
3. Finalize metadata discovery (Phase 5) so clients can self-describe the tool.
4. Run Polish tasks (Phase 6) to validate the quickstart and capture lessons for future adapters.




