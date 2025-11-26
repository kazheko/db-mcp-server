# Feature Specification: SQL Query Validation Decorator

**Feature Branch**: `001-sql-query-validation`  
**Created**: 2025-11-26  
**Status**: Draft  
**Input**: User description: "implement SQL query validation for the mssql adapter. The validator must be implemented as a decorator and decorate the adapter. The validator must allow retrieving data about the database structure, query statistics, and other queries that do not reveal stored data. In cases where a query is invalid, strikethrough the error and indicate that it is a validation error."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validate Metadata Queries Before Execution (Priority: P1)

An MCP operator submitting queries through the MSSQL adapter needs automated validation that ensures only metadata, structure, and statistics queries reach the database.

**Why this priority**: Prevents data exposure and contract violations by blocking unsafe SQL before the adapter connects downstream systems.

**Independent Test**: Submit sample catalog, DMV, and statistics queries plus unsafe DML/DDL scripts; confirm only compliant single statements execute.

**Acceptance Scenarios**:

1. **Given** a single SELECT query targeting system catalog views, **When** it is sent through the adapter, **Then** the validator allows execution without modifications.
2. **Given** a script containing INSERT or UPDATE statements, **When** it is sent through the adapter, **Then** the validator rejects it before any database call occurs.

---

### User Story 2 - Explain Validation Failures with Strikethrough Messaging (Priority: P2)

As a developer diagnosing invalid queries, I need responses that visibly mark the rejected text and state it is a validation error so I can correct the statement quickly.

**Why this priority**: Clear errors lower support load and help MCP Inspector render the issue inline without guessing root causes.

**Independent Test**: Trigger validation errors and confirm responses mirror the rejected query snippet with strikethrough formatting plus a "Validation Error" label.

**Acceptance Scenarios**:

1. **Given** a multi-statement batch, **When** the validator rejects it, **Then** the returned message wraps the offending text in strikethrough markup and calls it a validation error.

---

### User Story 3 - Decorate the Existing Adapter Without Behavior Drift (Priority: P3)

Platform maintainers need to add validation without rewriting the MSSQL adapter so future adapters can reuse the same decorator contract.

**Why this priority**: Preserves adapter stability and allows other database engines to plug into the same validation rules as they are added.

**Independent Test**: Compose the validator over the current adapter, send valid metadata queries, and confirm responses match pre-validation outputs.

**Acceptance Scenarios**:

1. **Given** a valid query routed through the decorated adapter, **When** it executes, **Then** results are identical to calling the adapter directly and include structured content if provided.
2. **Given** a new adapter implementation, **When** the validator wraps it, **Then** only the validation layer changes while downstream adapter logic remains untouched.

---

### Edge Cases

- Queries containing commented-out DML or DDL keywords should still be caught if the executable statement violates policy.
- Scripts that include GO separators, semicolons, or newline-delimited batches must be rejected as multi-statement submissions.
- Queries referencing user tables but scoped with TOP 0 or SET FMTONLY must be treated as potential data access attempts and rejected.
- Requests arriving without an explicit database identifier must fail, even if the query itself is compliant.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The validation layer MUST wrap the existing MSSQL adapter as a decorator so every query request passes through validation before reaching the adapter.
- **FR-002**: The validator MUST confirm that each request includes both a database identifier and a single SQL statement; missing fields or multiple statements are rejected.
- **FR-003**: Only queries that return schema metadata, relationship maps, execution statistics, or other non-row data MAY be executed; attempts to read or mutate stored table data MUST be blocked.
- **FR-004**: The validator MUST detect and block DDL, DML, transaction control keywords, stored procedure calls, temp table definitions, and session state mutations even when obfuscated through casing or whitespace.
- **FR-005**: When a query fails validation, the response MUST strikethrough the offending SQL fragment, label it explicitly as a "Validation Error", and describe which rule was violated.
- **FR-006**: Valid queries must pass through unchanged so their result payloads (including structured content used by MCP Inspector) match pre-validation outputs.
- **FR-007**: The validator MUST return a clear human-readable reason when rejecting a query but MUST NOT persist audit logs or telemetry beyond that response.

### Key Entities *(include if feature involves data)*

- **Validation Policy**: Single object holding the blacklist of disallowed statements/tokens/patterns that the decorator checks before calling the adapter.
- **Decorated Adapter Binding**: Composition of the Validation Policy with the MSSQL adapter; on failure it throws an Error containing the strikethrough message, and on success it delegates unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of multi-statement, DDL, DML, and transaction queries are rejected before reaching the MSSQL adapter during validation tests.
- **SC-002**: 95% of valid metadata queries pass through the decorator in under 50 ms of added latency compared to the undecorated adapter on a sample set of 100 requests.
- **SC-003**: Validation error responses include strikethrough formatting and a reason code in 100% of rejection cases verified via automated tests.
- **SC-004**: Operator support tickets related to unclear MSSQL validation failures drop by 75% after launch, measured over one release cycle.

## Assumptions

- Existing MCP clients rely on structured content echoes, so the validator must not modify successful payloads.
- The definition of "metadata queries" follows the platform constitution: schema catalogs, statistics, and plans but no stored data.
- Future adapters will adopt the same decorator contract, so validation rules are adapter-agnostic.
