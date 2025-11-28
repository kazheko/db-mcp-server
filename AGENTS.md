# db-mcp-server Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-24

## Active Technologies
- TypeScript 5.x on Node.js 20 + `@modelcontextprotocol/server`, `uuid`, `ts-node`/`tsx` for dev workflow (001-add-mssql-tool)
- N/A (stub adapter, no persistence) (001-add-mssql-tool)
- TypeScript 5.6.x on Node.js 20 (ESM) + `@modelcontextprotocol/sdk`, `zod`, `uuid`, `mssql` (tedious driver), `tsx` for dev scripts (001-mssql-adapter)
- Microsoft SQL Server (read-only single query against metadata catalogs) (001-mssql-adapter)
- TypeScript 5.6 on Node.js 20 (ESM build) + `@modelcontextprotocol/sdk`, `mssql` (Tedious driver), `zod`, `uuid` (001-sql-query-validation)
- Microsoft SQL Server metadata catalogs accessed via read-only single queries (001-sql-query-validation)
- TypeScript 5.6 on Node.js 20 (ESM build) + `@modelcontextprotocol/sdk`, `zod`, `uuid`, `pg` (node-postgres), shared SQL validator utilities, `tsx` for scripts (001-postgres-adapter)
- PostgreSQL metadata catalogs accessed through a single connection string (read-only, single statement per invocation) (001-postgres-adapter)
- TypeScript 5.6 (ESM) on Node.js 20. + `@modelcontextprotocol/sdk`, `@modelcontextprotocol/server`, `zod`, `uuid`, `pg`, shared SQL validator utilities. (001-add-postgres-tool)
- PostgreSQL metadata catalogs accessed read-only through the existing adapter. (001-add-postgres-tool)

- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (001-add-mssql-tool)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

[e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]: Follow standard conventions

## Recent Changes
- 001-add-postgres-tool: Added TypeScript 5.6 (ESM) on Node.js 20. + `@modelcontextprotocol/sdk`, `@modelcontextprotocol/server`, `zod`, `uuid`, `pg`, shared SQL validator utilities.
- 001-postgres-adapter: Added TypeScript 5.6 on Node.js 20 (ESM build) + `@modelcontextprotocol/sdk`, `zod`, `uuid`, `pg` (node-postgres), shared SQL validator utilities, `tsx` for scripts
- 001-sql-query-validation: Added TypeScript 5.6 on Node.js 20 (ESM build) + `@modelcontextprotocol/sdk`, `mssql` (Tedious driver), `zod`, `uuid`


<!-- MANUAL ADDITIONS START -->
### PostgreSQL Adapter Notes (001-postgres-adapter)

<!-- MANUAL ADDITIONS END -->
