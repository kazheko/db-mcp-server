# Repository Guidelines

This project ships an MCP-compatible server exposing two independent database tools: an MSSQL executor and a PostgreSQL executor. Each tool owns its adapter, validation layer, and logging wrapper, keeping implementations isolated while sharing the same server transport.

## Project Structure & Module Organization
- `src/` holds the TypeScript source (server entrypoints, adapters, shared utilities) and follows a vertical-slice approach: feature code stays inside its domain folder.
- MSSQL-specific adapters, validators, and tools live in `src/mssql`; PostgreSQL logic mirrors that layout, while reusable utilities belong in `src/shared`.
- `tests/` mirrors the source layout with Vitest specs such as `tests/mssql/tool.spec.ts`; store fixtures beside their specs.
- `docs/` and `specs/` track protocol references and design notes—update them when contracts or flows change.
- `scripts/` contains helper CLIs (notably `scripts/mcp/invoke.ts`). `dist/` is compiler output from `npm run build`; never edit it directly.

## Build, Test, and Development Commands
- `npm run dev:mcp` – start the MCP server with live TypeScript execution via `tsx` and `.env` configuration.
- `npm run build` – compile TypeScript to ESM JavaScript in `dist/` using `tsc -p tsconfig.json`.
- `npm run start` – launch the compiled server (`dist/src/server/index.js`). Run this to reproduce production behavior.
- `npx @modelcontextprotocol/inspector node --env-file=.env dist/src/server/index.js` – inspect the running MCP server with Inspector against the built output.
- `npm run mcp:invoke` – exercise the registered tools from the command line while developing schemas.
- `npm run test` / `npm run test:watch` – execute or continuously run the Vitest suite.

## Coding Style & Naming Conventions
- Use TypeScript, modern ECMAScript modules, and 2-space indentation. Keep imports ordered by package, then local paths.
- Favor descriptive `camelCase` for functions/variables, `PascalCase` for classes/types, and suffix adapters/tools with their purpose (e.g., `createMssqlAdapter`).
- Reuse shared helpers under `src/shared/` and validate inputs with Zod before calling database drivers.

## Testing Guidelines
- Write unit tests in Vitest under `tests/` using the `*.spec.ts` suffix and mirroring the source path.
- Mock database calls with stubs or adapters; only integration specs should hit real instances configured through `.env`.
- Run `npm run test` (or `vitest watch`) before pushing; keep coverage meaningful for each new tool or adapter.

## Commit & Pull Request Guidelines
- Follow the existing log: short, imperative summaries (`implement postgres tool`, `fix tests`). Reference issues with `(#123)` when applicable.
- Each PR should describe motivation, summarize changes, and note testing performed. Include screenshots or CLI transcripts when altering observable behavior.
- Keep commits focused on a single concern, ensure `npm run build` and `npm run test` pass, and update docs/specs whenever protocol contracts change.

## Security & Configuration Tips
- Never commit `.env`; `.env.example` is the authoritative reference for required keys.
- Rotate connection strings regularly and prefer parameterized queries in adapters to avoid injection risks.
- Gate experimental tools behind environment flags so agents can opt in safely.
