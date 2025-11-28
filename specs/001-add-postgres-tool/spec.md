# Feature Specification: PostgreSQL Tool Registration

**Feature Branch**: `001-add-postgres-tool`  
**Created**: 2025-11-28  
**Status**: Draft  
**Input**: User description: "create and register a new postgresql tool on the mcp server"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute PostgreSQL metadata queries through MCP (Priority: P1)

As a prompt engineer or analyst, I need an MCP tool that proxies read-only PostgreSQL metadata queries so I can inspect schemas, relations, and statistics without leaving my MCP session.

**Why this priority**: Delivers direct end-user value by exposing the newly built adapter through a sanctioned tool, unlocking the ability to answer catalog questions safely.

**Independent Test**: Register the tool, provide `database`, `query`, and optional `maxRows`, and confirm a compliant catalog query returns structured rows plus timing metadata without touching non-catalog tables.

**Acceptance Scenarios**:

1. **Given** the tool is registered with documented inputs, **When** a user submits a single-statement query that targets `pg_catalog` or `information_schema`, **Then** the tool returns results via the shared `QueryResponseEnvelope` with correlation ID, timestamps, and bounded rows.
2. **Given** a query containing DDL/DML or multiple statements, **When** the user invokes the tool, **Then** validation blocks execution and surfaces the strikethrough error before the PostgreSQL driver is contacted.

---

### User Story 2 - Discoverable tool contract during MCP handshake (Priority: P2)

As an MCP client integrator, I want the server to advertise the PostgreSQL tool with clear parameter schemas and descriptions so clients can auto-generate prompts and validation UI.

**Why this priority**: MCP flows depend on machine-readable capability metadata; without it, downstream agents cannot reliably call the tool or render form inputs.

**Independent Test**: Start the server, connect an MCP client, and verify the tool manifest includes the name, summary, and parameter schema (database/query/maxRows) that align with the constitution.

**Acceptance Scenarios**:

1. **Given** the MCP server negotiates capabilities, **When** the handshake completes, **Then** the client receives a `tools` entry for PostgreSQL containing parameter metadata (type, required flags, validation ranges) suitable for auto-complete.
2. **Given** localization or doc links are requested, **When** the tool metadata is inspected, **Then** it provides usage guidance referencing the read-only, single-statement contract so clients do not need to infer policies.

---

### User Story 3 - Operate the tool safely and transparently (Priority: P3)

As an MCP operator, I need the tool to honor environment-based enablement and surface actionable failure events so I can manage outages or credential issues without corrupting downstream workflows.

**Why this priority**: Ensures reliability—operators must know whether the Postgres backend is available and why requests fail in order to keep metadata-only promises.

**Independent Test**: Simulate missing connection strings, expired credentials, or network timeouts and confirm the tool either declines registration or returns structured errors with retry guidance while logging correlation IDs.

**Acceptance Scenarios**:

1. **Given** `POSTGRES_CONNECTION_STRING` is missing or invalid, **When** the server boots, **Then** the tool either stays unregistered or advertises a `disabled` reason so clients avoid routing calls until configuration is fixed.
2. **Given** runtime errors (timeout, driver exception) occur during execution, **When** the tool returns control, **Then** it emits an error payload that preserves the single-query contract and includes remediation text plus internal telemetry for operators.

---

### Edge Cases

- Connection string missing or empty should prevent tool registration rather than creating a tool that always fails.
- Tool invocation without `database` or `query` parameters must be rejected with validation errors before adapter invocation.
- Queries targeting user schemas (e.g., `public.users`) or containing analytics functions over live data must be blocked even if they are read-only.
- Semicolon-delimited scripts, transaction commands, or `SET` statements should return validation errors referencing the single-statement policy.
- PostgreSQL driver timeouts or network failures must produce deterministic error payloads and avoid leaking partial row data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST register a PostgreSQL-specific MCP tool (name TBD in code, e.g., `postgres.metadataQuery`) during server startup whenever the adapter is available, exposing it alongside existing tools.
- **FR-002**: System MUST define the tool schema with required `database` (string) and `query` (string) parameters plus optional `maxRows`, documenting descriptions, constraints, and validation messages that mirror the constitution.
- **FR-003**: System MUST route tool invocations through the existing PostgreSQL adapter, forwarding correlation IDs and enforcing read-only, single-statement validation before any driver call.
- **FR-004**: System MUST propagate adapter results (rows, rowCount, timing metadata) or validation errors back through standardized MCP responses so clients receive consistent envelopes.
- **FR-005**: System MUST include observability hooks (structured logs or telemetry events) that capture tool name, database target, duration, and validation state without logging raw SQL beyond what policies permit.
- **FR-006**: System MUST disable or hide the tool when PostgreSQL dependencies are misconfigured (missing env var, failed startup probe) and present actionable error states via tool metadata and server logs.
- **FR-007**: System MUST update developer/operator documentation to describe how to enable the tool, including environment prerequisites, invocation samples, and reminder of schema-only scope.

### Key Entities *(include if feature involves data)*

- **PostgresToolDefinition**: Represents the MCP tool metadata (name, summary, input schema, enablement flags) shared during capability negotiation so clients know how to supply `database`, `query`, and `maxRows`.
- **PostgresToolInvocation**: Captures each request context including correlation ID, validated SQL string, execution timestamps, adapter result/exception, and the structured payload returned to the client.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of compliant PostgreSQL metadata queries issued through the tool complete in under 3 seconds end-to-end during staging tests.
- **SC-002**: 100% of tool invocations missing required parameters or violating single-statement/read-only policies are rejected pre-execution with descriptive validation errors.
- **SC-003**: At least one MCP client successfully autodetects and surfaces the PostgreSQL tool (with generated form inputs) during handshake-driven smoke tests.
- **SC-004**: Operators can intentionally disable or re-enable the tool via environment configuration within 5 minutes, validated through two consecutive dry runs without manual code edits.

## Assumptions

1. The previously delivered PostgreSQL adapter is production-ready and exposes a callable interface compatible with MCP tools without additional schema changes.
2. Tool naming and categorization follow existing MCP conventions (e.g., `engine.operation`), allowing us to pick a descriptive name without additional governance review.
3. Only metadata catalogs (`pg_catalog`, `information_schema`) are allowed targets; requests referencing other schemas will be rejected even if read-only.
4. Documentation updates can reference `docs/postgres-adapter.md` for connection prerequisites instead of re-authoring deep operational guides.
