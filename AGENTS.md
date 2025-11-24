# db-mcp-server Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-24

## Active Technologies
- TypeScript 5.x on Node.js 20 + `@modelcontextprotocol/server`, `uuid`, `ts-node`/`tsx` for dev workflow (001-add-mssql-tool)
- N/A (stub adapter, no persistence) (001-add-mssql-tool)

- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (001-add-mssql-tool)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

[e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]: Follow standard conventions

## Recent Changes
- 001-add-mssql-tool: Added TypeScript 5.x on Node.js 20 + `@modelcontextprotocol/server`, `uuid`, `ts-node`/`tsx` for dev workflow

- 001-add-mssql-tool: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

<!-- MANUAL ADDITIONS START -->
- The initial MSSQL adapter is a deterministic stub; keywords like `RAISEERROR` simulate faults until real adapters plug in.
- Use `npm run mcp:invoke -- --describe` to review the `mssql-query` manifest locally before connecting remote MCP clients.
- Error logs intentionally echo the original throwable (string or Error) so downstream tools can surface the exact response demanded by the spec.<!-- MANUAL ADDITIONS END -->

