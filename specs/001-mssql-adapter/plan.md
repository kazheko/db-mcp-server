# Implementation Plan: Real MSSQL Adapter Integration

**Branch**: `[001-mssql-adapter]` | **Date**: 2025-11-25 | **Spec**: `specs/001-mssql-adapter/spec.md`
**Input**: Feature specification from `/specs/001-mssql-adapter/spec.md`

## Summary

Replace the deterministic `StubMssqlAdapter` with a production adapter that opens a pooled connection to SQL Server using the `MSSQL_CONNECTION_STRING` environment variable and streams metadata rows back through the MCP tool while propagating driver errors verbatim. Read-only intent is still documented for operators, but SQL-text validation is explicitly deferred to a follow-on specification so the adapter itself performs no query sanitization yet. The implementation keeps the MCP server TypeScript-first and composes adapters/tools via lightweight factories (`createMssqlAdapter`, `withMssqlValidation`, `createMssqlTool`, `withLogging`), updates unit/contract tests, and documents runtime configuration so operators can point to new databases by setting the environment variable and restarting the process.

## Technical Context

**Language/Version**: TypeScript 5.6.x on Node.js 20 (ESM)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `zod`, `uuid`, `mssql` (tedious driver), `tsx` for dev scripts  
**Storage**: Microsoft SQL Server (read-only single query against metadata catalogs)  
**Testing**: Vitest (unit + contract suites run via `npm test`)  
**Target Platform**: Long-running MCP stdio server process executed by Claude/Cursor-compatible clients on Linux/macOS/Windows  
**Project Type**: Single Node.js service under `src/` with adapters/tools/tests split by concern  
**Performance Goals**: Establish pool within 2s at startup; respond to allowed catalog queries in <1s for up to 100 rows  
**Constraints**: Enforce single-statement read-only SQL, restrict access to structural metadata objects, zero persistence, configuration only through `MSSQL_CONNECTION_STRING`  
**Scale/Scope**: One MCP tool (`mssql-query`) serving handfuls of analyst/operator invocations per session with at most tens of concurrent requests

## Constitution Check

*GATE: Must pass before Phase 0 research and again after Phase 1 design.*

1. **Contracted Inputs** – Tool schema already requires `database` and `query`; the adapter plan keeps schema validation and adds startup checks to fail fast if either is missing. **Status: PASS.**
2. **Structure & Statistics Scope** – The real adapter will hard-code allowed catalog schemas (`INFORMATION_SCHEMA`, `sys`, DMV views) and scrub payloads so no business table data leaves the server. **Status: PASS (guard enforced in design).**
3. **Read-Only Single Statement** – SQL validation is deferred per product direction; the adapter trusts upstream tooling for now and simply executes the provided SQL. **Status: FAIL (documented exception; see Complexity Tracking).**
4. **Multi-Engine Compatibility** – Keeping the adapter behind the existing `QueryAdapter` interface maintains plug-in parity with other backends. **Status: PASS.**
5. **Official SDK Usage** – No transport changes; MCP registration still flows through `@modelcontextprotocol/sdk`. **Status: PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/001-mssql-adapter/
├── plan.md              # This file (filled by /speckit.plan)
├── research.md          # Phase 0 research conclusions
├── data-model.md        # Phase 1 entity documentation
├── quickstart.md        # Phase 1 onboarding updates
└── contracts/           # Phase 1 API/tool contracts (OpenAPI)
```

### Source Code (repository root)

```text
src/
├── adapters/
│   └── mssql.ts                  # Real MSSQL adapter implementation
├── server/
│   └── index.ts                  # MCP entry that wires adapters/tools
├── tools/
│   ├── mssql-tool.ts             # Tool schema + factory function
│   └── log-wrapper.ts            # Error-wrapping higher-order function
└── types/
    └── mssql.ts                  # Shared contracts used by tools/adapters

tests/
├── contract/
│   └── mssql-tool.contract.test.ts   # Inspector-level happy/error paths
└── unit/
    ├── adapters/mssql.test.ts        # Adapter-focused validation tests
    └── tools/mssql-query.test.ts     # Tool + wrapper behavior

scripts/
└── mcp/invoke.ts                 # Manual invocation harness
```

**Structure Decision**: Keep the single-project Node.js layout; concentrate feature work inside `src/adapters/mssql.ts`, `src/server/index.ts`, and the existing test directories while adding documentation artifacts under `specs/001-mssql-adapter/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Read-only SQL validator missing | Product request prioritizes shipping the real adapter to unblock staging validation even without SQL guards | Deferring keeps scope limited; adding the validator now would require a separate parser effort already planned for a follow-up spec |
