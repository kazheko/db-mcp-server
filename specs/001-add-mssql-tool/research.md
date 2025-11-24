# Research Findings

- Decision: Implement the MCP server with the official `@modelcontextprotocol/server` TypeScript SDK on Node.js 20.
  Rationale: Aligns with the constitution's mandate to use the upstream SDK, keeps transport/tool registration consistent with existing MCP tooling, and provides out-of-the-box schema helpers.
  Alternatives considered: Custom lightweight WebSocket server (rejected because it would violate the constitution) and older Node LTS targets (rejected because MCP SDK requires modern ES features).

- Decision: Model the MSSQL adapter as a dedicated stub module that accepts `{ database, query, maxRows }`, returns deterministic synthetic row metadata, and never touches real credentials.
  Rationale: Encapsulating the adapter keeps future multi-engine expansion simple and makes it obvious that the current implementation is a placeholder.
  Alternatives considered: Inlining stub logic directly inside the tool handler (rejected because it prevents swapping adapters) and mocking a driver connection (rejected because it risks accidental data access).

- Decision: Interpret the required `queryResult` output as a structural preview (column names, sample synthetic values) so the response demonstrates schema shape without leaking production data.
  Rationale: This interpretation satisfies the spec while remaining compliant with the constitution's "Structure & Statistics" rule.
  Alternatives considered: Returning empty arrays (rejected because it would not validate downstream flows) and echoing user-provided SQL verbatim (rejected because it provides no schema context).

- Decision: Use a thin error-handling wrapper that logs context, captures timestamps, and rethrows/returns the exact error object back through the MCP SDK so the LLM receives the unaltered payload.
  Rationale: Meets the feature requirement for transparent error propagation and keeps debugging straightforward.
  Alternatives considered: Wrapping errors with custom codes (rejected per spec) and silently swallowing adapter faults (rejected due to observability gaps).

- Decision: Adopt Vitest with ts-node/tsx for the first automated checks (unit + contract) to validate the tool handler and adapter stub without external services.
  Rationale: Vitest aligns with the TypeScript toolchain, has fast watch mode, and works well with synthetic data; it keeps the door open for future contract tests.
  Alternatives considered: Jest (heavier config for ES modules) and no automated testing (violates development workflow/testing principles).
