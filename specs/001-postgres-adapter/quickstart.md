# Quickstart – Configuring the PostgreSQL Adapter

## Prerequisites

- Node.js 20.x and npm 10.x (per `package.json` engines).
- A reachable PostgreSQL instance that grants read-only access to `pg_catalog`, `information_schema`, and statistics views.
- A valid connection string assigned to the `POSTGRES_CONNECTION_STRING` environment variable, for example: `postgresql://svc_reader:password@db.example.com:5432/postgres?sslmode=require`.

## One-Time Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the sample environment file and set the Postgres connection string:
   ```bash
   cp .env.example .env
   # edit POSTGRES_CONNECTION_STRING inside .env
   ```
3. Verify tests and linting:
   ```bash
   npm test
   ```
4. (Optional) Describe the MCP server manifest to ensure adapters register as expected:
   ```bash
   npm run mcp:invoke -- --describe
   ```

## Running the MCP Server with PostgreSQL

```bash
export POSTGRES_CONNECTION_STRING="postgresql://svc_reader:password@db.example.com:5432/postgres?sslmode=require"
npm run dev:mcp
```

- Startup fails fast if the environment variable is missing, blank, or lacks required URI parts (scheme/host/database). Fix the value and restart to proceed.
- The adapter builds a single `pg` pool on launch; restart the process after changing the connection string to ensure a new pool is created.
- Validation happens before any network call, so multi-statement or mutative SQL never reaches the database.

## Manual Invocation (Adapter Slice)

```bash
npm run mcp:invoke -- \
  --database metadata \
  --query "SELECT schemaname, tablename FROM pg_catalog.pg_tables WHERE schemaname NOT LIKE 'pg_%'" \
  --maxRows 25
```

- Only single read-only statements that target catalog/statistics views pass validation. Attempts to access application tables, run DDL/DML, or include semicolons return a strikethrough validation error.
- Successful executions return JSON rows with `correlationId`, `startedAt`, `completedAt`, and the truncated `queryResult` array as defined by the shared adapter contract.
- Driver errors (timeouts, auth failures) bubble up verbatim so MCP clients can display the underlying Postgres message without translation.

## Troubleshooting

- **"POSTGRES connection string missing/malformed"** – Ensure the env var is exported in the shell running `npm run dev:mcp` or stored in `.env`. Values must include scheme, credentials (or peer auth), host, port, and database name.
- **Validation error with strikethrough response** – Review the SQL text for forbidden keywords (`INSERT`, `UPDATE`, `DELETE`, `CREATE`, `COPY`, transaction commands) or multiple statements. Only metadata queries are supported per the project constitution.
- **Timeouts or pool errors** – Confirm network access to the Postgres host and that SSL requirements match the string’s `sslmode` parameter. Each log entry contains a `correlationId` to trace failures end-to-end.
