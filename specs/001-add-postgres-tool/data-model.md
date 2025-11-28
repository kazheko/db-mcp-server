# Data Model – PostgreSQL Tool Registration

## Entity: PostgresToolDefinition
- **Purpose**: Describes how the MCP server advertises the PostgreSQL metadata query capability during handshake.
- **Fields**:
  - `name` (string, required): Constant `"postgres.metadataQuery"`.
  - `description` (string, required): Explains metadata-only scope and single-statement contract.
  - `parameters` (object, required): Input schema fields (`database`, `query`, optional `maxRows`) plus help text for metadata-only usage.
  - `docsUrl` (string, optional): Points to quickstart/client integration guidance.
- **Relationships**: Publishes to MCP handshake payload; referenced by UI/tooling clients to generate forms or inline docs.
- **Validation rules**:
  - `name` must remain stable after release to avoid client breakage.
  - `parameters` MUST enforce non-empty `database`/`query` inputs and describe the metadata-only constraint.

## Entity: PostgresToolInvocation
- **Purpose**: Captures each invocation’s request context and metadata rows returned by the adapter.
- **Fields**:
  - `correlationId` (UUID, required): Shared across request/response/log entries.
  - `database` (string, required): Target database identifier supplied by the user.
  - `queryResult` (array<object>, required): Metadata rows returned when execution succeeds.
  - `rowCount` (number, optional): Count of rows returned or truncated by `maxRows`.
  - `startedAt` / `completedAt` (ISO timestamps, required): Execution timing for SLAs.
- **Relationships**: Produced when MCP clients invoke the tool; optionally logged for operators.
- **Validation rules**:
  - `query` must pass the shared read-only + single-statement validator before adapter execution; invalid SQL results in a textual error message rather than a payload.
  - `queryResult` MUST only contain metadata rows; adapters enforce schema to prevent user data leakage.
