# Implementation Plan: SQL Query Validation Decorator

**Branch**: `001-sql-query-validation` | **Date**: 2025-11-26 | **Spec**: [`specs/001-sql-query-validation/spec.md`](specs/001-sql-query-validation/spec.md)
**Input**: Feature specification from `specs/001-sql-query-validation/spec.md`

## Summary

Introduce a reusable validation decorator that wraps the MSSQL adapter so all Model Context Protocol requests undergo strict single-statement, read-only checks before the adapter contacts SQL Server. The decorator enforces metadata-only scope, emits strikethrough responses when it blocks queries, forwards compliant statements unchanged, and deliberately skips audit/telemetry logging to keep the mechanism simple per the updated requirement.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20 (ESM build)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `mssql` (Tedious driver), `zod`, `uuid`  
**Storage**: Microsoft SQL Server metadata catalogs accessed via read-only single queries  
**Testing**: Vitest unit + contract suites executed with `npm test`  
**Target Platform**: MCP server worker processes on Linux/Windows Node 20 hosts  
**Project Type**: Single TypeScript service with adapters/tools folders  
**Performance Goals**: Validation adds <50 ms P95 latency to allowed queries (SC-002)  
**Constraints**: Enforce single-statement, read-only, no data leakage, and metadata/statistics-only outputs per constitution  
**Scale/Scope**: Supports thousands of catalog/statistics queries per day within one MCP server instance

## Constitution Check

*Gate verdict: PASS (re-confirm after design outputs).*  
- **Contracted Database Inputs**: Decorator checks `database` + `query` parameters before execution.  
- **Structure & Statistics Scope**: Validation policy limits execution to catalog, plan, and stats queries; data reads are blocked.  
- **Read-Only Single-Statement Enforcement**: Multi-statement, DDL/DML, procedures, temp tables, and transaction syntax are rejected ahead of the adapter.  
- **Multi-Engine Compatibility**: Decorator is adapter-agnostic and exposes a simple interface future SQL/NoSQL adapters can reuse.  
- **Official TypeScript MCP SDK Usage**: Server/tool integration continues to use the upstream SDK for transport and schemas.

## Project Structure

### Documentation (this feature)

```text
specs/001-sql-query-validation/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (this run)
├── data-model.md        # Phase 1 output (this run)
├── quickstart.md        # Phase 1 output (this run)
├── contracts/           # Phase 1 OpenAPI schemas
└── checklists/          # requirements checklist from /speckit.specify
```

### Source Code (repository root)

```text
src/
├── mssql/
│   ├── adapter.ts          # MSSQL adapter factory
│   ├── validator.ts        # Query validator HOF
│   ├── validation-policy.ts
│   ├── tool.ts             # Tool schema + runtime
│   └── types.ts            # Shared tool/adapter contracts
├── shared/
│   └── logging.ts          # Error-wrapping higher-order function
├── server/
│   └── index.ts            # MCP server bootstrap wiring adapters + tools
└── adapters/
    └── mssql-config.ts     # Connection string loader (shared)

tests/
├── contract/
│   └── mssql-tool.contract.test.ts  # Tool-level manifest tests
└── unit/
    ├── adapters/
    │   └── mssql.test.ts            # Adapter-level behavior
    └── tools/
        └── mssql-query.test.ts      # Tool validation + responses
```

**Structure Decision**: Retain single-service layout with a vertical `src/mssql` module (adapters, validators, tool factory) plus shared helpers; extend existing `tests/contract` + `tests/unit` suites accordingly.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _None_ |  |  |
