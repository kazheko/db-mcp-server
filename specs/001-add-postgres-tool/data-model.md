# Data Model – PostgreSQL Tool Registration

## Entity: PostgresToolDefinition
- **Purpose**: Describes how the MCP server advertises the PostgreSQL metadata query capability during handshake.
- **Fields**:
  - `name` (string, required): Constant `"postgres.metadataQuery"`.
  - `description` (string, required): Explains metadata-only scope and single-statement contract.
  - `parameters` (object, required): JSON schema or Zod specification for tool inputs.
  - `enabled` (boolean, required): Indicates whether the tool is active; false when configuration missing.
  - `disabledReason` (string, optional): Human-readable remediation guidance when `enabled` is false.
  - `docsUrl` (string, optional): Points to quickstart documentation for client builders/operators.
- **Relationships**: Publishes to MCP handshake payload; referenced by UI/tooling clients to generate forms or inline docs.
- **Validation rules**:
  - `name` must remain stable after release to avoid client breakage.
  - `parameters` MUST include `database` and `query` as required strings plus optional `maxRows` within [1, DEFAULT_MAX_ROWS].
  - `enabled` false MUST include `disabledReason`.

## Entity: PostgresToolInvocation
- **Purpose**: Captures each invocation’s input context, adapter result, and telemetry for auditing.
- **Fields**:
  - `correlationId` (UUID, required): Shared across request/response/log entries.
  - `database` (string, required): Target database identifier supplied by the user.
  - `query` (string, required): Validated single SQL statement after sanitization.
  - `maxRows` (number, optional): Row cap applied to adapter response.
  - `startedAt` / `completedAt` (ISO timestamps, required): Execution timing for SLAs.
  - `result` (array of objects, optional): Rows returned when execution succeeds.
  - `rowCount` (number, optional): Count of rows returned or truncated.
  - `status` (enum: `success`, `validation_error`, `adapter_error`, required): Execution outcome.
  - `error` (object, optional): Structured error payload containing summary, remediation text, and validation markers.
- **Relationships**: Produced when MCP clients invoke the tool; stored/transmitted via telemetry/logs for operators.
- **Validation rules**:
  - `query` must pass shared read-only + single-statement validator before execution; if not, `status=validation_error` and `result` remains empty.
  - `maxRows` defaults to shared limit when omitted and cannot exceed server-defined cap.
  - `result` MUST only contain metadata rows; adapters enforce schema to prevent user data leakage.

## Entity: ToolTelemetryEvent
- **Purpose**: Aggregated log entry enabling operators to monitor success/failure trends.
- **Fields**:
  - `correlationId` (UUID, required): Matches invocation envelope.
  - `toolName` (string, required): Always `postgres.metadataQuery`.
  - `database` (string, required): Target identifier for context.
  - `durationMs` (number, required): `completedAt - startedAt`.
  - `status` (enum matching invocation status, required).
  - `validationSummary` (string, optional): Snapshot of validation decisions when failures occur.
  - `adapterErrorCode` (string, optional): Sanitized identifier when PostgreSQL driver throws.
- **Relationships**: Emitted to logging/telemetry sinks; may be aggregated for operator dashboards.
- **Validation rules**:
  - `durationMs` must be non-negative and capped to prevent overflow logging.
  - `adapterErrorCode` should never contain raw SQL or credential info; sanitize before emit.
  - When `status != success`, include either `validationSummary` or `adapterErrorCode` for diagnostics.
