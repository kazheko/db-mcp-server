# Research Notes — SQL Query Validation Decorator

## Decision 1: Decorator Placement in Adapter Layer
- **Decision**: Implement the validator as a standalone class in `src/adapters/validators/` that wraps any adapter exposing the existing `executeMetadataQuery`-style interface.
- **Rationale**: Keeping the decorator near adapters ensures all downstream callers (tools, potential CLI utilities) receive identical safeguards without rewriting tool logic. It also keeps the path open for decorating future adapters (PostgreSQL, Cosmos DB) with the same contract.
- **Alternatives considered**: (a) Embed validation directly in the MSSQL tool handler—rejected because future adapters would duplicate logic and tests. (b) Enforce validation inside the `mssql` driver config—rejected since it would mix transport plumbing with domain policies and complicate reuse.

## Decision 2: Allow-List Driven Validation Rules
- **Decision**: Combine a strict allow-list of supported metadata query patterns (system catalog views, DMVs, SHOWPLAN/STATISTICS commands) with a deny-list of mutation keywords, multi-statement separators, and transaction hints.
- **Rationale**: Allow-listing ensures we only run known-safe query types, satisfying the constitution’s structure/statistics mandate. The deny-list backs this up by catching attempts to smuggle DDL/DML through comments or uncommon syntax.
- **Alternatives considered**: (a) Parsing queries with a full T-SQL grammar—rejected for excessive complexity and runtime cost. (b) Pure regex-based deny-list—rejected because it cannot confidently distinguish metadata-only statements from SELECT queries targeting user tables.

## Decision 3: Validation Messaging & Strikethrough Format
- **Decision**: Validation failures use `throw new Error('**Validation Error** ~~...~~')` so existing MCP tool error plumbing surfaces the strikethrough text without persisting additional objects.
- **Rationale**: MCP Inspector requires visual cues to highlight invalid queries, and the decorator should remain minimal. Throwing formatted errors satisfies both goals.
- **Alternatives considered**: (a) Return structured objects for each failure—rejected as unnecessary indirection once the decorator throws. (b) Modify structuredContent to include HTML/Markdown—rejected to avoid coupling errors to a specific renderer and to keep parity with current MCP payload styles.

## Decision 4: Simple Rejection Mechanism Only
- **Decision**: Limit validator responsibilities to checking statements/tokens/patterns and returning an inline error; do not create audit logs, telemetry, or hashed query traces.
- **Rationale**: User requested the simplest viable implementation to focus on core safety rules and reduce delivery scope. MCP clients already observe rejection details via the returned message.
- **Alternatives considered**: (a) Capturing structured audit entries—rejected per updated requirement. (b) Emitting sanitized hashes for correlation—rejected because it effectively recreates telemetry complexity without strong justification.

## Decision 5: Dependency Best Practices
- **Decision**: Continue using `@modelcontextprotocol/sdk` for tool registration, `zod` for schema validation, and `mssql` for driver connectivity; validation stays in TypeScript so no new runtime dependencies are introduced.
- **Rationale**: Leveraging existing dependencies reduces footprint and honors the constitution’s mandate to stick with the official SDK. Zod schemas already describe tool inputs, so the validator can reuse them for consistent error surfaces.
- **Alternatives considered**: (a) Adding a SQL parsing library (e.g., `tsql-parser`)—rejected because it increases bundle size and isn’t necessary for allow-list enforcement. (b) Replacing zod with custom validators—rejected since current tooling already relies on it and no spec requirement demands change.

**Outstanding Clarifications**: None; the specification defined scope, messaging, and success criteria sufficiently for design.
