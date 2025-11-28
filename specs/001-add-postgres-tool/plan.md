# Implementation Plan: PostgreSQL Tool Registration

**Branch**: `001-add-postgres-tool` | **Date**: 2025-11-28 | **Spec**: `specs/001-add-postgres-tool/spec.md`
**Input**: Feature specification from `/specs/001-add-postgres-tool/spec.md`

## Summary

Deliver a vertical slice that starts with MCP handshake metadata and ends with end-to-end PostgreSQL metadata responses. Slice 1 wires up discovery (tool definition + enablement gates), Slice 2 executes validated queries through the adapter, and Slice 3 captures telemetry/documentation so operators and clients can rely on the new capability without extra wiring. Each slice is independently shippable and builds on the shared adapter/validator foundation.

## Vertical Slice Strategy

1. **Slice 1 – Tool Discovery & Enablement**: Register `postgres.metadataQuery` during server startup when the adapter is available, expose a complete parameter schema, and surface disabled states when configuration is missing. Outputs: tool manifest wiring, schema definitions, handshake tests.
2. **Slice 2 – Execution Path**: Connect the MCP tool handler to the shared validator + PostgreSQL adapter, ensuring contracted inputs, single-statement enforcement, and metadata-only responses with correlation IDs. Outputs: handler implementation, unit tests, validation fixtures.
3. **Slice 3 – Telemetry & Operability**: Emit structured logs/telemetry, document quickstart/operational steps, and expand scripted MCP invocations plus failure-path coverage so operators can monitor/triage without ambiguity.

Each slice cuts vertically through the feature: PostgreSQL-specific logic stays within `src/postgres` (adapter, validators, enablement probes), cross-engine helpers remain in `src/shared`, and tool registration hooks live in `src/server`/`src/tools`. Avoid introducing new horizontal service layers or generic middleware that would obscure the end-to-end slice.

## Technical Context

**Language/Version**: TypeScript 5.6 (ESM) on Node.js 20.  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/server`, `zod`, `uuid`, `pg`, shared SQL validator utilities.  
**Storage**: PostgreSQL metadata catalogs accessed read-only through the existing adapter.  
**Testing**: Vitest suites for schema/registry logic plus scripted MCP runs via `npm run mcp:invoke`.  
**Target Platform**: Long-running MCP server (Node.js 20) deployed on Linux/macOS.  
**Project Type**: Single MCP server workspace rooted in `src/`.  
**Performance Goals**: 95% of compliant metadata queries finish <3s; startup registration overhead <200 ms.  
**Constraints**: Enforce contracted inputs, read-only single-statement validation, metadata-only outputs, environmentally controlled enablement, and SDK-only transport usage.  
**Scale/Scope**: Adds one tool for the PostgreSQL engine while preserving compatibility with existing MSSQL tooling and future adapters.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Contracted Inputs** – Tool schema requires both `database` and `query`, mirroring constitution Principle I. **PASS (pre/post design).**
- **Structure & Statistics Scope** – Data model + quickstart reiterate metadata-only outputs and block user-table reads. **PASS.**
- **Read-Only Single Statement** – Shared SQL validator remains in the loop before adapter access. **PASS.**
- **Multi-Engine Compatibility** – Tool registration is additive and adapter-gated, so MSSQL and future engines remain unaffected. **PASS.**
- **Official MCP SDK** – No custom transport; implementation extends the TypeScript SDK-based server. **PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/001-add-postgres-tool/
├─ plan.md              # Implementation plan (this file)
├─ research.md          # Phase 0 findings
├─ data-model.md        # Phase 1 entities/constraints
├─ quickstart.md        # Operator & client onboarding
└─ contracts/
   └─ postgres-tool-openapi.yaml
```

### Source Code (repository root)

```text
src/
├─ server/
│  └─ index.ts                # MCP entrypoint + tool registration
├─ tools/
│  └─ types.ts                # Tool contracts shared across engines
├─ shared/
│  ├─ logging.ts
│  ├─ queries.ts
│  └─ sql-validator.ts        # Cross-engine validation utilities
├─ postgres/
│  ├─ adapter.ts
│  ├─ validator.ts
│  ├─ validation-policy.ts
│  └─ index.ts                # Postgres-specific slice code
├─ mssql/                     # Existing MSSQL engine slice
└─ adapters/                  # Legacy adapter helpers (if any)

scripts/
└─ mcp/
   └─ invoke.ts               # CLI to exercise MCP tools

tests/
├─ unit/
└─ contract/
```

**Structure Decision**: Maintain a single-project layout where each engine’s slice lives in its own directory (`src/postgres`, `src/mssql`) and shared utilities remain under `src/shared`. Tool registration stays in `src/server`/`src/tools`, ensuring the vertical slice traverses discovery, execution, and observability without adding new horizontal service layers.

## Complexity Tracking

No constitution violations identified; tracking table not required.
