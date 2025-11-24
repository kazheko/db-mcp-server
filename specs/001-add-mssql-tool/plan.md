# Implementation Plan: Simple MCP MSSQL Tool

**Branch**: `[001-add-mssql-tool]` | **Date**: 2025-11-24 | **Spec**: specs/001-add-mssql-tool/spec.md
**Input**: Feature specification from `/specs/001-add-mssql-tool/spec.md`

## Summary
Implement the first MCP server instance with the official TypeScript SDK, register a single `mssql-query` tool, and route executions through a detachable MSSQL adapter stub. The stub fabricates deterministic structural recordsets, while the handler surrounds it with correlation/timestamp metadata and a transparent error passthrough. Documentation plus contract artifacts define the tool surface for downstream clients.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20  
**Primary Dependencies**: `@modelcontextprotocol/server`, `uuid`, `ts-node`/`tsx` for dev workflow  
**Storage**: N/A (stub adapter, no persistence)  
**Testing**: Vitest (unit + contract harness)  
**Target Platform**: Node.js CLI/server process
**Project Type**: Single package MCP server  
**Performance Goals**: Stub responses must complete within 1 second to keep conversational latency low  
**Constraints**: Enforce read-only single-statement queries, structure-only outputs, official MCP SDK usage, multi-adapter friendly architecture  
**Scale/Scope**: One published tool + supporting adapter; future adapters can reuse the same abstractions

## Constitution Check

1. **Contracted Database Inputs** - PASS: Tool schema requires both `database` and `query`, and the handler refuses execution if either is missing or empty despite broader validation being deferred.
2. **Structure & Statistics Scope** - PASS: Adapter returns synthetic structural previews only; no live row data is ever touched.
3. **Read-Only Single-Statement Enforcement** - PASS: Even as a stub, the handler parses input SQL to guard against multi-statement or mutating keywords before delegating to the adapter.
4. **Multi-Engine Compatibility** - PASS: Adapter is abstracted behind an interface so future SQL/NoSQL adapters can register without reworking the tool definition.
5. **Official TypeScript MCP SDK Usage** - PASS: Server bootstrap and tool registration rely on `@modelcontextprotocol/server` per governance.
6. **Input & Query Handling Constraints** - PASS: Documentation reiterates required parameters and read-only enforcement, and negative tests cover rejection paths.

## Project Structure

### Documentation (this feature)

```text
specs/001-add-mssql-tool/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
`-- contracts/
    `-- mssql-tool.yaml
```

### Source Code (repository root)

```text
src/
|-- server/
|   `-- index.ts            # MCP server bootstrap + tool registration
|-- tools/
|   `-- mssql-query.ts      # Tool definition + handler + error wrapper
|-- adapters/
|   `-- mssql.ts            # Stub implementation returning synthetic recordsets
|-- errors/
|   `-- handler.ts          # Shared error passthrough helpers
`-- types/
    `-- mssql.ts            # Shared TypeScript interfaces for adapters + payloads

tests/
|-- contract/
|   `-- mssql-tool.contract.test.ts
`-- unit/
    |-- adapters/
    |   `-- mssql.test.ts
    `-- tools/
        `-- mssql-query.test.ts
```

**Structure Decision**: Single TypeScript package organized by concern (server, tool, adapter, errors, shared types) with mirrored test directories for fast isolation.

## Complexity Tracking

No constitution deviations or additional complexity exceptions identified for this feature.
