# Quickstart

## Prerequisites
1. Node.js 20.x and npm 10.x installed locally.
2. PNPM or npm (examples below use npm) plus TypeScript tooling enabled.
3. Access to this repository branch `001-add-mssql-tool`.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the TypeScript sources (generates `dist/` used by the MCP server runtime):
   ```bash
   npm run build
   ```

## Running the MCP Server
1. Start the stub MCP server in dev mode with automatic reload:
   ```bash
   npm run dev:mcp
   ```
2. The process registers the `mssql-query` tool on startup; confirm by checking the log output listing registered tools.

## Exercising the MSSQL Tool
1. From an MCP-compatible client or the provided CLI harness, invoke the tool:
   ```bash
   npm run mcp:invoke -- --database hr --query "SELECT * FROM employees" --maxRows 5
   ```
2. Verify the response payload includes `correlationId`, `database`, `recordset`, `startedAt`, and `completedAt` with synthetic data.
3. Trigger the negative path:
   ```bash
   npm run mcp:invoke -- --database hr --query "RAISEERROR"
   ```
   Expect the raw stub error text to appear in the MCP response and no success payload.

## Discovering Tool Metadata
1. With the server code available (running optional), print tool metadata without invoking it:
   ```bash
   npm run mcp:invoke -- --describe
   ```
2. Confirm the JSON includes the tool `name`, `title`, `description`, and the documented input/output fields (`database`, `query`, `maxRows`, `correlationId`, `database`, `recordset`, `startedAt`, `completedAt`).
3. MCP clients will see the same manifest content during the handshake phase, so any deviation here should block release.

## Testing
1. Run all unit + contract tests:
   ```bash
   npm test
   ```
2. Focus on the adapter stub tests while iterating:
   ```bash
   npm run test:watch -- adapters
   ```
