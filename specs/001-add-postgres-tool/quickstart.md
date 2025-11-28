# Quickstart – PostgreSQL Metadata Query Tool

## 1. Prerequisites
- **Node.js 20+** with npm dependencies installed (`npm install`).
- **Environment**: Set `POSTGRES_CONNECTION_STRING` (same rules as adapter: `postgresql://user:pass@host:port/db?sslmode=require`).
- **Adapter availability**: Ensure the PostgreSQL adapter from `001-postgres-adapter` is built and exported via `src/adapters/postgres`.

## 2. Configure Environment
```
cp .env.example .env                     # if needed
# Edit .env
POSTGRES_CONNECTION_STRING="postgresql://svc_reader:ChangeMe!@db.example.com:5432/postgres?sslmode=require"
```

Restart any running MCP server instances after updating the variable so the adapter + tool reload with the new configuration.

## 3. Start the MCP Server
```
npm run dev:mcp
```
Expected log snippet when the tool registers successfully:
```
[MCP] tool registered: postgres.metadataQuery (metadata-only)
```

If configuration is missing/invalid, the server logs:
```
[MCP] postgres.metadataQuery disabled – set POSTGRES_CONNECTION_STRING before enabling
```
and the handshake marks the tool as disabled with remediation text.

## 4. Invoke the Tool
Use the existing script to issue a metadata query via MCP:
```
npm run mcp:invoke -- \
  --engine postgres \
  --database metadata \
  --query "SELECT oid, relname FROM pg_catalog.pg_class LIMIT 5" \
  --maxRows 10
```

Successful response excerpt:
```
{
  "toolName": "postgres.metadataQuery",
  "database": "metadata",
  "rowCount": 5,
  "queryResult": [ { "oid": 1255, "relname": "pg_proc" }, ... ],
  "startedAt": "2025-11-28T19:05:14.120Z",
  "completedAt": "2025-11-28T19:05:14.260Z"
}
```

Validation failure example (multi-statement):
```
Tool execution failed: Validation Error – Only a single read-only statement is allowed.
```

## 5. Operational Notes
- **Disable/Enable**: Unset the connection string to hide the tool; set it again and restart to re-enable.
- **Telemetry**: Correlation IDs from tool responses match server logs for easy tracing.
- **Scope reminder**: Queries restricted to `pg_catalog` and `information_schema`; attempts to read user tables are rejected before hitting the database.
