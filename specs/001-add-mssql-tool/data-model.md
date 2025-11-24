# Data Model

## Entity: MCP Server Instance
- **Purpose**: Hosts the MCP transport loop, registers the MSSQL query tool, and routes tool invocations.
- **Key Fields**:
  - `id`: implicit (single runtime process)
  - `tools`: array of tool definitions
  - `startedAt`: Date timestamp when server boots
- **Relationships**:
  - Owns exactly one MSSQL Query Tool Definition in this iteration.
  - Delegates execution to the MSSQL Adapter Stub via the tool handler.
- **Rules**:
  - Must expose the manifest immediately after start so clients can discover the MSSQL tool.
  - Must enforce read-only single-statement messaging even if the adapter is stubbed.

## Entity: MSSQL Query Tool Definition
- **Purpose**: Describes the callable tool exposed to LLM clients.
- **Key Fields**:
  - `id`: constant `mssql-query`
  - `title`: "MSSQL Query Tool"
  - `description`: explains read-only query previews through the adapter stub
  - `inputSchema`: JSON schema with `database` (string, required), `query` (string, required), `maxRows` (number, optional)
  - `outputSchema`: JSON schema with `correlationId`, `database`, `recordset`, `startedAt`, `completedAt`
- **Relationships**:
  - Registered within the MCP Server Instance `tools` array.
  - Executed by the MSSQL Adapter Stub.
- **Rules**:
  - Input schema only documents fields; it does not apply runtime validation in this feature.
  - Output schema guarantees presence of metadata fields even if the recordset is empty.

## Entity: MSSQL Adapter Stub
- **Purpose**: Placeholder that fabricates deterministic structural data.
- **Key Fields**:
  - `execute(params)`: method accepting `{ database, query, maxRows? }`
  - `recordTemplates`: internal configuration containing column metadata + sample synthetic values per template
- **Relationships**:
  - Called exclusively by the MSSQL Query Tool handler.
  - Returns data for the Tool Response Envelope; may throw errors for negative path tests.
- **Rules**:
  - Must never open network sockets or use credentials.
  - Should bound returned row count to `maxRows` (default to 3 when omitted).
  - Must be deterministic: identical inputs yield identical outputs for reproducible testing.

## Entity: Tool Response Envelope
- **Purpose**: Normalized payload returned to the LLM after tool execution.
- **Key Fields**:
  - `correlationId`: UUID string generated per invocation
  - `database`: echoes the requested database name
  - `recordset`: array of objects with `columns` metadata and synthetic `rows`
  - `startedAt`: ISO 8601 timestamp set immediately before adapter call
  - `completedAt`: ISO 8601 timestamp set immediately after adapter response/error handling
- **Relationships**:
  - Produced by the MSSQL Query Tool handler
  - Consumed by the MCP transport for success responses; error channel reuses `correlationId`
- **Rules**:
  - Must keep timestamps chronological (`startedAt` <= `completedAt`).
  - When adapter throws, the envelope is replaced with the raw error, but logging must still capture the correlationId for observability.
