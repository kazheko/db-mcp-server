# Quickstart – Connecting the Real MSSQL Adapter

## Prerequisites

- Node.js 20.x and npm 10.x (matching the repo engines field).
- A reachable SQL Server instance that exposes schema/catalog views the MCP server is allowed to query.
- A valid connection string assigned to the `MSSQL_CONNECTION_STRING` environment variable (e.g., `Server=tcp:example.database.windows.net,1433;Database=master;User Id=svc_reader;Password=...;Encrypt=true;`).

## One-Time Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the sample environment file and set the connection string:
   ```bash
   cp .env.example .env
   # edit .env to point at your SQL Server instance
   ```
3. Verify lint/test baselines:
   ```bash
   npm test
   ```
4. Confirm the MCP manifest is still accurate:
   ```bash
   npm run mcp:invoke -- --describe
   ```

## Running the Server

```bash
export MSSQL_CONNECTION_STRING="<your-connection-string>"
# or rely on the value already stored in .env
npm run dev:mcp
```

- The adapter validates that the variable is present and well-formed at startup. Missing or malformed strings stop the process immediately with a descriptive error so partially configured servers never register tools.
- Connection pooling happens once when the process boots; restarts are required after changing the environment variable.

## Invoking the Tool Manually

```bash
npm run mcp:invoke -- \
  --database metadata \
  --query "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo'" \
  --maxRows 25
```

- Only single-statement read-only catalog queries are accepted. The validator rejects scripts containing `;`, DML keywords, or references to non-whitelisted schemas before any database call occurs.
- On success you'll receive a JSON block with `correlationId`, `startedAt`, `completedAt`, and the catalog rows limited by `maxRows`.
- On driver errors (timeouts, login failures, syntax issues) the MCP response echoes the original SQL Server error string so MCP clients can surface it verbatim.

## Troubleshooting

- **"MSSQL connection string missing"** – Ensure the environment variable is exported in the same shell/process that launches `npm run dev:mcp`, or update `.env` using the `.env.example` template before starting.
- **Validation errors** – Review the SQL text for multi-statement batches, forbidden keywords, or table references outside `sys`/`INFORMATION_SCHEMA`; only structural queries are allowed per the constitution.
- **Timeouts or transient driver errors** – Confirm network access to the SQL Server host and that firewall rules allow the MCP host. Errors are logged with `correlationId` timestamps to aid tracing.
