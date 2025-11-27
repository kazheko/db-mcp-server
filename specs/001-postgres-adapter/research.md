# Phase 0 Research – PostgreSQL Adapter Integration

## Driver & Pooling Strategy

- **Decision**: Use the `pg` (node-postgres) client with a lazily created `Pool` that reuses a single connection string for all metadata queries.
- **Rationale**: `pg` is the de-facto standard Postgres driver in the Node.js ecosystem, ships pure JS (fits MCP distribution), and exposes pooled query helpers plus cancellation/timeout hooks needed for long metadata scans. Creating one pool inside the adapter mirrors the MSSQL slice, keeps startup predictable (<2s), and lets us validate the environment variable once.
- **Alternatives considered**: `postgres` (porsager) lacks full parity with `pg` for connection string parsing + SSL flags and would diverge from existing driver conventions; spawning a new `Client` per request would add ~200–400ms per invocation and leak credentials into more stack traces; delegating to CLI tools like `psql` would break MCP stdio framing and complicate correlation IDs.

## Connection String Validation

- **Decision**: Introduce `src/adapters/postgres-config.ts` that reads `POSTGRES_CONNECTION_STRING`, trims whitespace, verifies the URI scheme (`postgres://` or `postgresql://`), confirms it contains host/database segments, and fails fast with actionable errors if malformed.
- **Rationale**: The spec requires configuration exclusively via an environment variable, and parity with the MSSQL loader simplifies ops. Validating early prevents the MCP server from partially registering tools or leaking retries with bad credentials.
- **Alternatives considered**: Deferring validation to the `pg` driver surfaces opaque errors later in execution; pulling secrets from additional managers (Vault, AWS SM) would violate scope and add dependencies; deriving database names from user input would contradict the constitution's explicit-input rule.

## SQL Validation Decorator Reuse

- **Decision**: Reuse the existing SQL validation decorator contract, adding a Postgres-specific policy (`src/postgres/validation-policy.ts`) that allows `SELECT`/`WITH`/`EXPLAIN` statements targeting `pg_catalog`, `information_schema`, and statistics views while blocking multi-statement batches, DDL/DML keywords, COPY, transaction commands, and table scans outside those schemas.
- **Rationale**: The constitution mandates read-only single statements; a shared decorator ensures identical enforcement between MSSQL and PostgreSQL while keeping latency negligible. Policy-level tweaks (keyword lists, schema allowlists) avoid forking the validator implementation.
- **Alternatives considered**: Building a brand-new parser per engine would introduce heavy dependencies and duplicate test matrices; trusting upstream tooling would violate FR-003/Principle III; server-side roles/profiles cannot enforce single-statement semantics reliably.

## Result Envelope & Shared Types

- **Decision**: Extract `QueryAdapter`, `QueryRequest`, and `QueryResponseEnvelope` definitions into `src/shared/queries.ts`, import them in both the MSSQL and Postgres slices, and keep row payloads as `Record<string, unknown>` so adapter consumers remain agnostic of the underlying engine.
- **Rationale**: The spec emphasizes reusing shared types; centralizing contracts avoids drift, simplifies future adapter additions, and lets tests assert consistent envelopes regardless of engine.
- **Alternatives considered**: Keeping `Mssql*`-prefixed types and duplicating them for Postgres would cause naming sprawl and require dual updates for every change; introducing a generic ORM-style abstraction would overshoot scope and hide database-specific nuances the plan needs to surface.

## Timeout & Error Handling

- **Decision**: Apply a 30-second per-query timeout via `pg`'s `query_timeout` option and propagate driver errors verbatim through the shared response envelope while logging correlation IDs via `src/shared/logging.ts`.
- **Rationale**: Metadata queries can still stall (e.g., blocking stats scans). Enforcing a timeout aligns with Edge Case requirements and ensures the adapter releases pooled connections. Keeping raw error messages satisfies FR-005 and matches the MSSQL tool behavior.
- **Alternatives considered**: Unlimited runtimes would leave pooled connections hanging and contradict the edge-case guard; rewriting error strings would remove actionable detail; retries risk executing the same query twice without user intent.
