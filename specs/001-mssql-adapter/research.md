# Phase 0 Research – Real MSSQL Adapter Integration

## Driver & Connection Management

- **Decision**: Use the community-supported `mssql` package (tedious under the hood) with a singleton `ConnectionPool` that opens once during adapter construction and is reused for every query.
- **Rationale**: `mssql` offers Promise-based APIs, transparent pooling, and battle-tested retry semantics that map cleanly onto the existing async adapter interface. Creating the pool one time keeps the MCP server responsive (<2s startup) and lets us sanitize the environment variable early so launch fails fast when `MSSQL_CONNECTION_STRING` is missing.
- **Alternatives considered**: `tedious` direct sockets would require hand-written pooling and tedious error normalization; `msnodesqlv8` depends on native bindings that complicate cross-platform distribution; creating a new connection per invocation leads to >500ms overhead per query and magnifies credential exposure.

## Read-Only Single-Statement Guard

- **Decision**: Implement a lightweight validator that tokenizes the SQL text, ensures it starts with `SELECT` or `WITH`, rejects semicolons outside trailing whitespace, blocks transaction/mutation keywords (`INSERT`, `UPDATE`, `DELETE`, `MERGE`, `EXEC`, `BEGIN`, etc.), and enforces a single statement before dispatching to the driver.
- **Rationale**: The constitution requires deterministic rejection of multi-statement or mutative scripts, and the MCP tool already documents this contract. A purpose-built guard keeps dependencies minimal, keeps latency sub-millisecond, and allows precise Vitest coverage for each rejection path.
- **Alternatives considered**: Relying on future parameter validation would knowingly violate the constitution; shelling out to SQL Server `SET PARSEONLY ON` still executes server-side and complicates error handling; adopting a full SQL parser library introduces heavy dependencies that add little beyond the targeted guard rails we need.

## Metadata-Only Result Enforcement

- **Decision**: Restrict the adapter to queries that reference catalog objects (`INFORMATION_SCHEMA.%`, `sys.%`, DMV views) and optionally expose execution statistics (row counts, duration) while stripping or redacting user-table references before returning rows.
- **Rationale**: The constitution forbids exposing tenant data. Most schema inspection tasks hit system catalogs, so whitelisting those schemas plus verifying table names inside the query keeps the tool aligned with governance while still letting users inspect structures. Returning only JSON rows built from catalog queries satisfies the spec’s “schema-level data” intent.
- **Alternatives considered**: Allowing arbitrary read-only `SELECT` statements risks leaking real table contents; rewriting arbitrary SQL to metadata queries is brittle and could mislead operators; building a new metadata API instead of SQL would require MCP client changes and violates the requirement to use the existing tool.

## Error Propagation Strategy

- **Decision**: Surface the original driver `Error` (message + number + state) through the adapter and let the existing `LogWrapper` echo it verbatim in the MCP response, while logging timestamps/correlation IDs in the adapter for traceability.
- **Rationale**: Spec FR-003 demands unchanged error propagation, and the constitution highlights downstream tooling needs to display the exact Throwable. Allowing the driver error to bubble up keeps behavior consistent with the stub while still letting us append structured diagnostics to server logs.
- **Alternatives considered**: Collapsing errors into generic messages would violate FR-003; wrapping errors with additional text risks breaking downstream pattern matching; retrying automatically could hide deterministic failures such as malformed SQL or permission denials.
