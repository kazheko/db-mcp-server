# Feature Specification: PostgreSQL Adapter Integration

**Feature Branch**: `001-postgres-adapter`  
**Created**: 2025-11-27  
**Status**: Draft  
**Input**: User description: "create new adapter for postgresql. Adapter must extract connection string from env variable and validate SQL query. Don't create new tool for MCP Server, we will create separated spec for the that. Follow vertical slice approach and reuse shared types."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute validated PostgreSQL metadata queries (Priority: P1)

As an MCP operator, I want a PostgreSQL adapter that executes a single validated metadata query so I can inspect catalogs and statistics without leaving the MCP workflow.

**Why this priority**: Provides the vertical slice of business value—direct database insight with validation safeguards—without waiting on additional tooling specs.

**Independent Test**: Issue sample catalog/statistics queries through the adapter and verify compliant SQL executes while disallowed statements are rejected with validation errors before any network call.

**Acceptance Scenarios**:

1. **Given** `POSTGRES_CONNECTION_STRING` is configured and a compliant query targets `pg_catalog` views, **When** the request executes through the adapter, **Then** it returns JSON rows using the shared `QueryResultRow[]` structure capped by `maxRows`.
2. **Given** a batch containing INSERT or multi-statement SQL, **When** it is sent through the adapter, **Then** the adapter blocks it with a strikethrough validation message and no call to PostgreSQL.

---

### User Story 2 - Manage the connection string via environment (Priority: P2)

As a DevOps engineer, I need the adapter to read and validate a single environment variable so deployments can retarget PostgreSQL instances without code edits or new configuration systems.

**Why this priority**: Keeps runtime management simple and consistent with the MSSQL adapter, limiting operational risk when enabling PostgreSQL in different environments.

**Independent Test**: Rotate the `POSTGRES_CONNECTION_STRING` value, restart the MCP server, and confirm the adapter now targets the new database while surfacing clear startup errors if the variable is missing or malformed.

**Acceptance Scenarios**:

1. **Given** the MCP server boots with the environment variable set, **When** the adapter initializes, **Then** it trims and verifies the string includes host, database, and authentication segments before creating the driver connection.
2. **Given** the variable is absent or fails validation, **When** the server starts, **Then** initialization fails fast with guidance to set the variable rather than falling back to defaults.

---

### User Story 3 - Reuse shared query contracts for PostgreSQL (Priority: P3)

As a platform maintainer, I want the adapter to reuse the shared query request/response interfaces and validation decorator so future MCP tools can consume PostgreSQL with minimal wiring.

**Why this priority**: Reinforces the vertical slice philosophy—every adapter shares predictable types, logging, and correlation IDs—so downstream specs (tools, UI) can focus on orchestration.

**Independent Test**: Compose the Postgres adapter behind the existing `QueryAdapter` interface, run type checks, and confirm logging/correlation utilities from `src/shared` produce identical envelopes to the MSSQL implementation.

**Acceptance Scenarios**:

1. **Given** existing shared types, **When** the Postgres adapter is added, **Then** TypeScript checks show no duplicate request/response definitions and all consumers import the shared contracts.
2. **Given** the SQL validation decorator is applied, **When** valid queries execute, **Then** their payload and structured content match the shared schema so no additional parsing rules are required.

---

### Edge Cases

- Missing or blank `POSTGRES_CONNECTION_STRING` must halt startup with an actionable error rather than silently using defaults.
- Connection strings lacking `host`, `database`, or SSL mode guidance should be rejected with specific remediation steps.
- Queries containing multiple statements, transaction commands, or attempts to read table data should be blocked even if they reference `pg_catalog` schemas indirectly.
- Long-running metadata queries must enforce an execution timeout so the adapter does not hold open pooled connections indefinitely.
- JSON conversion should gracefully handle PostgreSQL types (arrays, JSONB) by falling back to string serialization when shared types cannot represent native structures.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `PostgresQueryAdapter` that implements the existing `QueryAdapter` interface and reuses the shared request/response types (correlation ID, timestamps, `QueryResultRow[]`).
- **FR-002**: System MUST load the connection string exclusively from `POSTGRES_CONNECTION_STRING`, trimming whitespace, validating host/database segments, and failing startup if the variable is absent or malformed.
- **FR-003**: System MUST apply the established SQL validation decorator (metadata-only, single-statement) to every PostgreSQL request and return strikethrough error messages when validation fails before reaching the driver.
- **FR-004**: System MUST execute only read-only metadata queries against PostgreSQL, limiting returned rows by the requested `maxRows` (defaulting to the shared limit when undefined) and preserving structured content expected by MCP Inspector.
- **FR-005**: System MUST reuse shared logging, correlation, and UUID helpers so telemetry emitted for PostgreSQL matches the MSSQL adapter format without duplicating utility code.
- **FR-006**: System MUST keep scope limited to the adapter slice; no new MCP tool registration or server plumbing may be introduced in this spec, though the adapter must be ready for a future tool to call it.
- **FR-007**: System MUST document the required environment variable and validation contract alongside existing adapter docs to keep operator onboarding consistent.

### Key Entities *(include if feature involves data)*

- **PostgresConnectionConfig**: Captures the environment variable name, validated connection string, SSL preferences, and flags indicating whether the connection originated from `.env` or runtime secrets storage.
- **PostgresQueryResponse**: Mirrors the shared response envelope (correlation ID, timestamps, database, `QueryResultRow[]`, truncated row count) while annotating when validation blocked execution versus returning driver rows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can execute an approved PostgreSQL metadata query end-to-end through the adapter in under 5 minutes after setting `POSTGRES_CONNECTION_STRING`.
- **SC-002**: 100% of disallowed PostgreSQL queries (multi-statement, DDL/DML, data reads) are rejected before the driver layer during automated validation tests.
- **SC-003**: Updating the environment variable and restarting the MCP server retargets the adapter to a new database within 2 minutes without code changes in 3 consecutive deployment dry runs.
- **SC-004**: Shared type reuse keeps adapter-specific code additions under 500 lines and prevents any duplicate type definitions during TypeScript build checks.

## Assumptions

1. The environment variable will be named `POSTGRES_CONNECTION_STRING` and follows the standard URI format (`postgresql://user:pass@host:port/db`).
2. The SQL validation decorator introduced for MSSQL can be parameterized for PostgreSQL keywords without a new framework.
3. Only catalog, statistics, and schema-introspection queries are permitted; accessing row-level application data remains out of scope for all adapters.
4. A separate spec will define the MCP tool wiring, so this effort ends at an adapter that can be imported but not yet exposed as a tool.
