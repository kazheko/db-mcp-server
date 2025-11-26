# Feature Specification: Real MSSQL Adapter Integration

**Feature Branch**: `[001-mssql-adapter]`  
**Created**: 2025-11-25  
**Status**: Draft  
**Input**: User description: "We need to implement an adapter for real interaction with MSSQL. Let's skip input parameter validation for now; we'll do that in the future. The adapter should get the connection string from the environment variable, but working with variables should be very simple (don't create managers, etc.). The StubMssqlAdapter should be removed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute MSSQL queries via MCP (Priority: P1)

As an MCP operator, I want the MSSQL tool to execute a single read-only query against the target database using the production adapter so I can inspect schema-level data without swapping binaries.

**Why this priority**: Enables the first real data-plane interaction, replacing the stub and delivering tangible user value.

**Independent Test**: Verify that supplying `database`, `query`, and `maxRows` through the MCP inspector returns JSON-formatted query metadata that matches the connected database when the adapter uses the real connection string.

**Acceptance Scenarios**:

1. **Given** the environment variable with the MSSQL connection string is present, **When** an operator runs a supported read-only query via the MCP tool, **Then** the adapter uses the real connection and returns the expected JSON recordset within `maxRows`.
2. **Given** the real adapter executes a query that fails (e.g., syntax error), **When** the MCP tool handles the result, **Then** the error propagates to the MCP response without alteration.

---

### User Story 2 - Configure runtime connection settings (Priority: P2)

As a DevOps engineer, I want to adjust the MSSQL connection string through a simple environment variable so deployments can point to different databases without rebuilding the MCP server.

**Why this priority**: Allows different environments (dev, staging, prod) to reuse the same artifact with minimal configuration coupling.

**Independent Test**: Change the environment variable, restart the MCP server, and confirm queries run against the new target without code changes.

**Acceptance Scenarios**:

1. **Given** the MCP server starts with `MSSQL_CONNECTION_STRING` set, **When** the adapter initializes, **Then** it reads the variable once and uses it for all subsequent queries.
2. **Given** the variable is missing, **When** the MCP server launches, **Then** it surfaces a clear startup failure so operators know configuration is incomplete.

---

### User Story 3 - Remove legacy stub adapter (Priority: P3)

As a maintainer, I want the obsolete `StubMssqlAdapter` removed so that only the real adapter path is available, preventing accidental use of mock data in production scenarios.

**Why this priority**: Reduces technical debt and avoids confusion about which adapter is active.

**Independent Test**: Search the codebase and confirm no references or builds target `StubMssqlAdapter`; running the MCP tool uses only the real adapter implementation.

**Acceptance Scenarios**:

1. **Given** the codebase is built, **When** developers inspect the compiled bundle, **Then** no stub adapter artifacts remain.
2. **Given** automated tests run, **When** modules import the MSSQL adapter, **Then** they always rely on the real implementation.

---

### Edge Cases

- What happens when the connection string environment variable exists but is malformed? The adapter should fail fast with a descriptive error and no connection attempt.
- How does system handle network blips or SQL timeouts? Ensure the adapter surfaces driver-level errors unchanged so tool logging captures root causes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an MSSQL adapter that executes a single read-only query using the official driver and returns JSON rows limited by `maxRows`.
- **FR-002**: System MUST source the MSSQL connection string from a single environment variable (assumed `MSSQL_CONNECTION_STRING`) during startup without auxiliary managers.
- **FR-003**: System MUST expose adapter errors to MCP responses exactly as received, maintaining correlation identifiers.
- **FR-004**: System MUST prevent fallback to `StubMssqlAdapter` by removing the stub implementation and references.
- **FR-005**: System MUST document the required environment variable and restart procedure in quickstart/onboarding docs.

### Key Entities *(include if feature involves data)*

- **MSSQL Connection Context**: Captures the environment variable name, resolved connection string, and target database metadata used when creating driver pools.
- **MSSQL Query Execution Result**: Represents the JSON-formatted rows, execution timestamps, and correlation identifier shared with the MCP tool.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can run a read-only MSSQL query via MCP inspector using the real adapter within 5 minutes of setting the environment variable.
- **SC-002**: Configuration updates to the connection string require no code changes and propagate with a single MCP server restart in under 2 minutes.
- **SC-003**: 100% of automated tests referencing the MSSQL adapter instantiate the real implementation (no stub references in test coverage reports).
- **SC-004**: Documentation updates reduce configuration-related support questions for the MSSQL tool to fewer than 1 per release cycle.

## Assumptions

1. The environment variable will be named `MSSQL_CONNECTION_STRING`; changes to this name would be handled as part of future configuration work.
2. Input validation for tool parameters (database, query, maxRows) remains out of scope for this feature and will be addressed later.
3. Queries continue to be limited to read-only, single-statement operations per the DB MCP Server constitution.