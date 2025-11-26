# Quickstart — SQL Query Validation Decorator

## Prerequisites
- Node.js 20+
- SQL Server instance that exposes catalog views (read-only credentials)
- `.env` with `MSSQL_CONNECTION_STRING` pointing to metadata-safe database

## 1. Install & Build
```bash
npm install
npm run build
```

## 2. Launch MCP Server with Decorator Enabled
```bash
node --env-file=.env dist/src/server/index.js
```
The server bootstraps the MSSQL tool, composes the validation decorator over the adapter, and registers everything with the MCP transport. No additional flags are required.

## 3. Invoke Allowed Metadata Query
```bash
npm run mcp:invoke -- --tool mssql-query \
  --input '{"database":"master","query":"SELECT name FROM sys.databases"}'
```
Expected outcome: the decorator sees only metadata references, so the query executes normally and the structured payload matches the pre-validation response shape.

## 4. Validate Error Messaging
```bash
npm run mcp:invoke -- --tool mssql-query \
  --input '{"database":"master","query":"DELETE FROM sys.databases"}'
```
Expected outcome: MCP Inspector (or CLI output) shows `**Validation Error** ~~DELETE FROM sys.databases~~ — DML is forbidden`, confirming the strikethrough formatting while the adapter never executes.

## 5. Run Tests
```bash
npm test
```
Vitest re-runs validator unit tests (metadata vs DDL/DML), contract tests that confirm the tool rejects unsafe queries pre-adapter, and tool-level regression tests to ensure decorated adapters still return identical payloads for valid statements.
Latest run (2025-11-26) completed successfully with 17 passing tests via `vitest run`.
