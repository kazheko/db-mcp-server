# Phase 0 Research – PostgreSQL Tool Registration

## Decision 1: Tool naming & MCP handshake metadata
- **Decision**: Register the tool as `postgres.metadataQuery` with a summary emphasizing read-only metadata access; include parameter metadata (database/query/maxRows) plus doc links in the MCP capability manifest.
- **Rationale**: Namespaced naming keeps parity with existing adapters (e.g., `mssql.metadataQuery`), allows clients to infer scope immediately, and ensures handshake payloads contain enough text for auto-generated UI hints.
- **Alternatives considered**:
  - `postgres.query`: Too generic; might encourage data reads and doesn’t signal metadata-only scope.
  - `db.postgres-metadata`: Reorders the namespace and diverges from existing naming conventions, increasing client mapping complexity.
  - Delayed registration until future tooling: Blocks user value even though adapter already exists.

## Decision 2: Parameter schema & validation layer
- **Decision**: Define a Zod schema with required `database` (trimmed non-empty string) and `query` (single-statement SQL validated by shared inspector) plus optional `maxRows` (number between 1 and shared cap); reuse the existing validator so enforcement happens before adapter execution.
- **Rationale**: Zod already underpins MCP request validation, enabling consistent error messaging. Enforcing parameter requirements at schema level prevents tool calls that would otherwise reach the adapter without context, aligning with the constitution’s contracted inputs rule.
- **Alternatives considered**:
  - Custom inline validation per tool: Duplicates logic and risks drift from other engines.
  - Optional `database` parameter defaulting to connection string: Violates the constitution’s explicit database requirement and reduces clarity in multi-database deployments.
  - Allowing arrays/batches of statements: Breaks the single-statement rule and complicates validation.

## Decision 3: Enablement & error reporting strategy
- **Decision**: During server startup, probe the PostgreSQL adapter; register the tool only if `POSTGRES_CONNECTION_STRING` passes validation and the adapter instantiates. Otherwise, expose a disabled state with actionable guidance and log telemetry (correlation ID, failure reason). Runtime errors bubble up as structured MCP tool errors without leaking row data.
- **Rationale**: Operators must know whether the tool is safe to call; failing fast avoids cascading MCP errors and provides a clean UX for clients that inspect tool metadata. Structured error envelopes plus logging satisfy observability requirements without exposing sensitive SQL text beyond policy allowances.
- **Alternatives considered**:
  - Always register, even if adapter unavailable: Would produce opaque runtime failures for every call.
  - Silent logging without MCP feedback: Clients would keep retrying despite configuration issues.
  - Hard-failing the entire server when PostgreSQL is optional: Reduces flexibility when deployments only need MSSQL tools.
