# Feature Specification: Simple MCP MSSQL Tool

**Feature Branch**: `[001-add-mssql-tool]`  
**Created**: 2025-11-24  
**Status**: Draft  
**Input**: User description: "Implement a simple MCP Server. Register the first tool for working with MSSQL. The tool should call the MSSQL adapter. For the adapter, implement a placeholder with a stub; do not implement interaction with the database. For the Tool, define a title, description, inputSchema (database, query, maxRows), and outputSchema (correlationId, database, queryResult, startedAt, completedAt). Create a simple error handler; return the error as is back to LLM. Do not implement input parameter validation; a separate feature will handle that."

## Assumptions
- The MCP server runs inside this repository and only needs to host the single MSSQL tool for this feature.
- The MSSQL adapter stub returns deterministic mock queryResults based on the request but never connects to a database or uses credentials.
- Timestamp fields (`startedAt`, `completedAt`) follow ISO 8601 UTC format and the server generates a UUID-style `correlationId` per invocation.
- Input payloads are accepted as-is; any validation or sanitation is deferred to a later feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute MSSQL query via stub adapter (Priority: P1)

An LLM client connected through the MCP protocol invokes the MSSQL query tool with database name, SQL text, and an optional row limit so the adapter stub can return a representative queryResult along with correlation and timing metadata.

**Why this priority**: Delivers the first end-to-end capability for the server, proving that the tool contract, adapter stub, and response envelope all work together.

**Independent Test**: Spin up the MCP server, call the MSSQL tool through an integration test client, and verify the response includes stubbed rows plus the mandated metadata without depending on any other features.

**Acceptance Scenarios**:

1. **Given** the MCP server is running and tooling metadata is registered, **When** the LLM invokes the MSSQL tool with `database="hr"`, `query="SELECT * FROM employees"`, and `maxRows=5`, **Then** the server returns a payload containing `correlationId`, the echoed database name, a stubbed queryResult capped at five rows, and populated `startedAt`/`completedAt` values.
2. **Given** the adapter stub can vary its payload size, **When** the tool is invoked repeatedly with different `maxRows` values, **Then** the handler forwards that value to the adapter and the resulting queryResult never exceeds the requested limit.

---

### User Story 2 - Propagate adapter errors without modification (Priority: P2)

When the adapter stub raises an error (e.g., to emulate connectivity failures), the server surfaces that exact error object to the LLM via the MCP error channel without wrapping or altering the message.

**Why this priority**: Transparent error propagation is needed immediately so downstream LLM workflows can troubleshoot without guessing about hidden failures.

**Independent Test**: Force the adapter stub to throw a sample exception and confirm the MCP response body matches the thrown error text/status verbatim.

**Acceptance Scenarios**:

1. **Given** the stub is configured to throw "Script timeout" for a specific query, **When** that query is sent through the MSSQL tool, **Then** the error handler returns the same "Script timeout" error (and no success payload) to the LLM client.

---

### User Story 3 - Discover MSSQL tool contract via metadata (Priority: P3)

Before issuing commands, the LLM requests the server manifest and reads the MSSQL tool definition, including its human-friendly title, description, and the schema for inputs and outputs.

**Why this priority**: The client must understand how to format requests and what it will receive in order to orchestrate downstream workflows.

**Independent Test**: Connect a mock LLM client, fetch the tool list, and verify the metadata contains the exact input/output schema definitions mandated by the feature.

**Acceptance Scenarios**:

1. **Given** the MCP handshake is performed, **When** the client enumerates registered tools, **Then** the MSSQL tool entry presents the configured title/description plus input fields (`database`, `query`, `maxRows`) and output fields (`correlationId`, `database`, `queryResult`, `startedAt`, `completedAt`).

---

### Edge Cases

- Invocation omits `maxRows`; the handler still calls the adapter (passing `null`/undefined) and the adapter stub returns its default number of rows while populating the rest of the schema.
- Adapter returns an empty queryResult; the response still includes `correlationId`, timestamps, and an empty `queryResult` array to signal no rows were available.
- Adapter throws a string or Error object; the error handler sends the same object/text back to the LLM without reformatting.
- Multiple simultaneous tool invocations occur; each one produces a unique `correlationId` so traces are not mixed.
- Queries containing keywords like `RAISEERROR` or `THROW` deliberately force the stub adapter to throw errors so tooling can validate raw error propagation pathways.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The MCP server MUST start and advertise itself in a way that LLM clients can request the manifest and see registered tools.
- **FR-002**: The server MUST register a single MSSQL-focused tool (e.g., identifier `mssql-query`) with the title "MSSQL Query Tool" and a description that explains it runs read-only SQL through an adapter stub.
- **FR-003**: The tool MUST publicly define an input schema containing `database` (string), `query` (string), and `maxRows` (number, optional) fields; the server MUST not perform any additional validation beyond describing this schema.
- **FR-004**: The tool handler MUST create a fresh `correlationId` plus `startedAt` and `completedAt` timestamps for every invocation and include them in the success payload.
- **FR-005**: During execution the handler MUST pass the request payload (database, query, maxRows) directly to a dedicated MSSQL adapter abstraction.
- **FR-006**: The MSSQL adapter MUST be implemented as a placeholder stub that returns deterministic mock queryResults and explicitly avoids connecting to any database or requiring credentials.
- **FR-007**: Successful tool responses MUST echo the requested `database`, include the adapter-provided `queryResult`, and honor any `maxRows` limit when building the data.
- **FR-008**: A simple error handler MUST wrap tool execution, catch any thrown errors, and relay the original error (message, code, and structure) back to the LLM via the MCP error channel without modification.
- **FR-009**: The feature MUST defer input sanitization/validation logic; even malformed inputs are passed through to the adapter stub so that future validation work can be layered on later.

### Key Entities *(include if feature involves data)*

- **MCP Server Instance**: Hosts the MCP protocol endpoints, loads the MSSQL tool definition, and coordinates incoming tool invocations.
- **MSSQL Query Tool Definition**: Metadata advertised to clients, containing the tool identifier, title, description, and the required input/output schema definitions.
- **MSSQL Adapter Stub**: A placeholder component that accepts database/query/maxRows, returns mock queryResults, or throws errors to simulate failure without touching a real database.
- **Tool Response Envelope**: Standard structure returned to LLM clients with `correlationId`, `database`, `queryResult`, `startedAt`, and `completedAt`, as well as propagated errors when execution fails.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: During handshake testing, 100% of MCP clients can list the MSSQL tool and read the documented input/output schema without needing code-level knowledge.
- **SC-002**: An integration test invoking the MSSQL tool receives a response containing the required metadata fields (`correlationId`, timestamps, database echo) within 1 second because the adapter stub completes immediately.
- **SC-003**: Across at least 10 sample invocations with varying `maxRows` values, every returned `queryResult` respects the requested limit and includes mock rows shaped consistently.
- **SC-004**: When the adapter stub is forced to throw a sample error, the MCP response body matches the thrown error text/code exactly in 100% of test runs, confirming unaltered propagation.

