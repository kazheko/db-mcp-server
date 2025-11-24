import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { StubMssqlAdapter } from '../adapters/mssql.js';
import { registerMssqlTool } from '../tools/mssql-query.js';

export const mcpServer = new McpServer({
  name: 'db-mcp-server',
  version: '0.1.0'
});

const adapter = new StubMssqlAdapter();
registerMssqlTool(mcpServer, adapter);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

const entryFile = process.argv[1] ?? '';
const isDirectRun = /server[\\/]index\.(ts|js)$/.test(entryFile);

if (isDirectRun) {
  main().catch((error) => {
    console.error('[mcp-server] Failed to start', error);
    process.exit(1);
  });
}
