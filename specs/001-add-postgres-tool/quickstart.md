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
[postgres-tool] Disabled: Missing POSTGRES_CONNECTION_STRING environment variable. Set it before starting the MCP server.
```
and the tool is omitted from the handshake until the variable is set.

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
  "correlationId": "f555c3bf-9dcb-4b0e-8a4c-4d9f79b056ec",
  "database": "metadata",
  "queryResult": [ { "oid": 1255, "relname": "pg_proc" }, ... ],
  "rowCount": 5,
  "startedAt": "2025-11-28T19:05:14.120Z",
  "completedAt": "2025-11-28T19:05:14.260Z"
}
```

Validation failure example (multi-statement):
```
Tool execution failed: Error: **Validation Error** ~~SELECT * FROM public.users; SELECT * FROM pg_catalog.pg_class~~ — Only a single SQL statement may be executed per request
```

## 5. Operational Notes
- **Disable/Enable**: Unset the connection string to hide the tool; set it again and restart to re-enable.
- **Telemetry**: Correlation IDs from tool responses match server logs for easy tracing.
- **Scope reminder**: Queries restricted to `pg_catalog` and `information_schema`; attempts to read user tables are rejected before hitting the database.

## 6. Troubleshooting

- **Symptom**: Server logs `[postgres-tool] Disabled: …` and MCP handshake omits the tool.
- **Fix**: Populate the variable in `.env`, restart `npm run dev:mcp`, and rerun `npm run mcp:invoke` to confirm.

### Connection or timeout failures
- **Symptom**: Tool responses include messages such as `connection timeout` or `terminated by timeout`.
- **Fix**: Verify host/port reachability, trim the query to metadata-only filters, or raise the adapter timeout via `createPostgresAdapter({ timeoutMs })`.

### Validation blocks
- **Symptom**: Tool output contains `Validation Error – Only a single read-only statement is allowed.`
- **Fix**: Remove additional statements, ensure the target schema stays within `pg_catalog`/`information_schema`, and retry the invocation.
