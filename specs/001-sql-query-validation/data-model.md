# Data Model — SQL Query Validation Decorator

## Entities

### ValidationPolicy
- **Purpose**: Single configuration object containing all blacklist definitions the decorator enforces.
- **Fields**:
  - `id` (string, e.g., `mssql-blacklist-v1`).
  - `deniedStatements` (array<string>) — labels like `DDL`, `DML`, `TRANSACTION`, `BATCH_SEPARATOR`.
  - `deniedTokens` (array<string>) — canonical keywords/phrases (`INSERT`, `MERGE`, `EXEC`, `GO`, `begin transaction`).
  - `deniedPatterns` (array<RegExpDefinition>) — regex snippets capturing advanced disallowed shapes (e.g., `/CREATE\s+TABLE/i`).
  - `multiStatementGuards` (array<string|RegExpDefinition>) — tokens or separators such as `;`, `GO`, `BEGIN`/`END` pairs.
  - `messageTemplates` (Record<string,string>) — mapping from statement/token identifiers to human-readable error copy.
  - `notes` (string) — optional description of policy intent.

### DecoratedAdapterBinding
- **Purpose**: Connects the validator with any adapter implementation while keeping interfaces stable.
- **Fields**:
  - `adapterId` (string) — e.g., `mssql-metadata-adapter`.
  - `policy` (ValidationPolicy reference) — blacklist applied during validation.
  - `execute` (function) — proxied call that first runs blacklist checks, throws `Error` with strikethrough text when blocked, otherwise defers to the underlying adapter unchanged.
  - `formatError` (function) — helper that wraps offending SQL in `~~` and prepends "Validation Error" before throwing.

### QueryRequest
- **Purpose**: Normalized request object passed between tool, validator, and adapter.
- **Fields**:
  - `database` (string) — explicitly provided catalog/DB name per constitution.
  - `query` (string) — raw SQL text.
  - `correlationId` (UUID string) — logs & tracing.
  - `context` (Record<string,string>) — optional metadata like requested tool client.

## Relationships & Validation Logic

- Each `DecoratedAdapterBinding` references exactly one `ValidationPolicy`, but policies can be reused by multiple adapters.
- The decorator iterates over the blacklist lists inside `ValidationPolicy`; the first match triggers `formatError` and throws `Error` immediately (no `ValidationResult` object is produced).
- `QueryRequest` is immutable once created by the tool handler so both validator and adapter read consistent input.

## State Transitions

1. **Received** → `ValidationPending`: query arrives from tool handler and is normalized (trimmed, whitespace collapsed).
2. `ValidationPending` → `ValidationFailed`: blacklist match occurs; decorator throws `Error` with strikethrough message and adapter is never invoked.
3. `ValidationPending` → `ResponseDelivered`: no blacklist match; adapter executes and returns response unchanged (with structured content).
