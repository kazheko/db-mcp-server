---

description: "Task list for SQL Query Validation Decorator"
---

# Tasks: SQL Query Validation Decorator

**Input**: Design documents from `/specs/001-sql-query-validation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare validator scaffolding in the codebase

- [X] T001 Create validator workspace by adding `src/adapters/validators/validation-policy.ts`
- [X] T002 Stub decorator module `src/adapters/validators/mssql-validator.ts` that proxies to the adapter

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish baseline policy data and wiring before story work begins

- [X] T003 Define `ValidationPolicy` interface and blacklist collections in `src/adapters/validators/validation-policy.ts`
- [X] T004 Export decorator factory signature and placeholder `formatError` helper in `src/adapters/validators/mssql-validator.ts`
- [X] T005 Wire `createMssqlTool` + `withLogging` to accept the decorated MSSQL adapter so the tool handler keeps existing error-wrapping behavior

**Checkpoint**: Validator scaffolding and wiring exist; user stories can build logic on top

---

## Phase 3: User Story 1 - Validate Metadata Queries Before Execution (Priority: P1) — MVP

**Goal**: Automatically reject unsafe SQL before reaching the adapter

**Independent Test**: Run vitest suites to confirm metadata queries succeed and DDL/DML/multi-statement scripts fail with validation errors

### Tests — User Story 1

- [X] T006 [P] [US1] Add pass/fail scenarios for metadata vs DDL queries in `tests/unit/adapters/mssql-validator.test.ts`
- [X] T007 [P] [US1] Extend `tests/contract/mssql-tool.contract.test.ts` to assert DML scripts are rejected before execution

### Implementation — User Story 1

- [X] T008 [US1] Implement blacklist enforcement + multi-statement detection in `src/adapters/validators/mssql-validator.ts`
- [X] T009 [US1] Invoke the validator before adapter execution inside `src/tools/mssql-tool.ts` so blocked queries never reach SQL Server

**Checkpoint**: Unsafe SQL is rejected with thrown errors; valid metadata queries flow through unchanged

---

## Phase 4: User Story 2 - Explain Validation Failures with Strikethrough Messaging (Priority: P2)

**Goal**: Return visually clear errors that MCP Inspector can display inline

**Independent Test**: Trigger invalid queries and confirm error text starts with "Validation Error" and wraps SQL in `~~` markers

### Tests — User Story 2

- [X] T010 [P] [US2] Add expectation for strikethrough formatting + rule reason in `tests/unit/adapters/mssql-validator.test.ts`

### Implementation — User Story 2

- [X] T011 [US2] Implement `formatValidationError` helper in `src/adapters/validators/mssql-validator.ts` to wrap offending SQL
- [X] T012 [US2] Ensure `src/tools/mssql-tool.ts` surfaces the thrown validator error unchanged so MCP structured content includes the message

**Checkpoint**: Invalid queries now show strikethrough messaging that downstream tools can render

---

## Phase 5: User Story 3 - Decorate the Existing Adapter Without Behavior Drift (Priority: P3)

**Goal**: Wrap the MSSQL adapter without altering successful query results

**Independent Test**: Execute metadata queries through the decorated adapter and compare payloads to pre-validation snapshots

### Tests — User Story 3

- [X] T013 [P] [US3] Add regression coverage in `tests/unit/tools/mssql-query.test.ts` verifying decorated adapter responses match original outputs for valid queries

### Implementation — User Story 3

- [X] T014 [US3] Compose `createMssqlAdapter` with `withMssqlValidation` + `withLogging(createMssqlTool(...))` in `src/server/index.ts` so every request flows through the validator without relying on the old ToolFactory
- [X] T015 [US3] Update `specs/001-sql-query-validation/quickstart.md` with steps to run an allowed query and a rejected query through the new decorator

**Checkpoint**: Decorated adapter behaves identically to the legacy adapter for compliant metadata queries

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and verification

- [X] T016 Run `npm test` and document results in `specs/001-sql-query-validation/quickstart.md`

---

## Dependencies & Execution Order

- Setup → Foundational → User Stories → Polish (in that order)
- User Story priority/order: US1 (P1) → US2 (P2) → US3 (P3)
- User stories can run in parallel only after Phase 2 completes, but US1 forms the MVP scope

## Parallel Execution Examples

- US1 Tests: T006 and T007 both operate on separate test files and can run in parallel once foundational work completes
- US1 Implementation: T008 (validator logic) can proceed while T009 updates the tool handler if different engineers coordinate
- US2 + US3: After US1, T010 and T013 touch different test suites and can execute concurrently

## Implementation Strategy

1. Deliver MVP by finishing Phases 1–3 (US1) and validate using vitest before shipping
2. Layer in US2 to improve error quality, then US3 to ensure decorator composition is production-ready
3. Use Polish phase to re-run the quickstart/test suite before integrating with downstream MCP clients
