# Implementation Plan: PostgreSQL Adapter Integration

**Branch**: `[001-postgres-adapter]` | **Date**: 2025-11-27 | **Spec**: `specs/001-postgres-adapter/spec.md`
**Input**: Feature specification from `/specs/001-postgres-adapter/spec.md`

## Summary

Deliver a production-ready PostgreSQL adapter that plugs into the existing `QueryAdapter` contract, reads its connection string from `POSTGRES_CONNECTION_STRING`, layers the SQL validation decorator so only metadata/statistics statements reach the driver, and returns the shared response envelope (`correlationId`, timestamps, JSON rows). The work stays within the adapter slice (no new MCP tool yet), emphasizes reuse of shared types/utilities, and documents runtime configuration so the forthcoming tool spec can consume the adapter without additional plumbing.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM build)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `zod`, `uuid`, `pg` (node-postgres), shared SQL validator utilities, `tsx` for scripts  
**Storage**: PostgreSQL metadata catalogs accessed through a single connection string (read-only, single statement per invocation)  
**Testing**: Vitest for unit + contract suites (`npm test`), plus lightweight fixtures under `tests/contract` for adapter envelopes  
**Target Platform**: Long-running MCP stdio server launched by desktop agents on Linux/macOS/Windows  
**Project Type**: Single Node.js service rooted at `src/` with adapters & shared utilities organized by engine  
**Performance Goals**: Adapter initializes within 2s of process start; validations add <5ms; metadata queries return ≤100 rows in under 1s for typical catalogs  
**Constraints**: Enforce read-only single statements, restrict output to schema/statistics data, source configuration exclusively from environment variables, no new MCP tool registration in this slice  
**Scale/Scope**: One new adapter invoked by a handful of analyst requests per MCP session; concurrency limited to tens of inflight operations via driver pool

## Constitution Check

*GATE: Must pass before Phase 0 research and be re-confirmed after Phase 1 design.*

1. **Contracted Database Inputs** – Tool schemas already require `database` + `query`; the adapter continues to enforce both before execution. **Status: PASS.**
2. **Structure & Statistics Scope** – Validator + adapter allow only catalog/statistics queries and trim results to metadata rows. **Status: PASS.**
3. **Read-Only Single-Statement Enforcement** – Reuses the SQL validation decorator to block multi-statement or mutative scripts pre-driver. **Status: PASS.**
4. **Multi-Engine Compatibility** – Adapter adheres to the shared `QueryAdapter` interface and leaves room for future engines via `src/shared/queries.ts`. **Status: PASS.**
5. **Official TypeScript MCP SDK Usage** – No transport changes; existing MCP server + SDK registration remain intact. **Status: PASS.**

**Post-Design Review**: After generating the research, data model, contracts, and quickstart, no new risks were discovered; all gates remain in PASS standing.

## Project Structure

### Documentation (this feature)

```text
specs/001-postgres-adapter/
├── plan.md              # /speckit.plan output (this file)
├── research.md          # Phase 0 decisions + clarifications
├── data-model.md        # Phase 1 entity + contract docs
├── quickstart.md        # Operator onboarding for PostgreSQL
└── contracts/
    └── postgres-metadata-query.openapi.yaml
```

### Source Code (repository root)

```text
src/
├── adapters/
│   ├── mssql-config.ts
│   └── postgres-config.ts           # new env loader for POSTGRES_CONNECTION_STRING
├── shared/
│   ├── logging.ts
│   └── queries.ts                   # shared QueryAdapter + envelope types
├── mssql/
│   ├── adapter.ts
│   ├── tool.ts
│   ├── validation-policy.ts
│   └── validator.ts
├── postgres/
│   ├── adapter.ts                   # wraps pg client + validator + shared types
│   └── validation-policy.ts         # Postgres-specific keyword allowlist/denylist
├── tools/
│   └── types.ts
└── server/
    └── index.ts                     # wires adapters into MCP server factory

tests/
├── contract/
│   └── postgres-metadata.contract.test.ts
└── unit/
    ├── adapters/postgres-config.test.ts
    └── postgres/adapter.test.ts

scripts/
└── mcp/
    └── invoke-postgres.ts           # manual invocation harness for adapter-only testing
```

**Structure Decision**: Retain the single Node.js project layout; add a `src/postgres` vertical slice plus a shared query-types module so adapters stay swappable. Tests mirror the existing MSSQL layout, giving the future tool spec a predictable home for integration harnesses.

## Complexity Tracking

No constitution violations are anticipated; tracking is not required at this time.
