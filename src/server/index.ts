import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { StubMssqlAdapter } from '../adapters/mssql.js';
import { ToolFactory } from '../tools/tool-factory.js';

export const mcpServer = new McpServer({
  name: 'db-mcp-server',
  version: '0.1.0'
});

const adapter = new StubMssqlAdapter();
const factory = new ToolFactory();
const mssqlTool = factory.createMssqlTool(adapter);

mcpServer.registerTool(
  mssqlTool.name,
  {
    title: mssqlTool.title,
    description: mssqlTool.description,
    inputSchema: mssqlTool.inputSchema,
    outputSchema: mssqlTool.outputSchema
  },
  mssqlTool.handler
);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

const entryFile = process.argv[1] ?? '';
const isDirectRun = /server[\\/]index\.(ts|js)$/i.test(entryFile);

if (isDirectRun) {
  main().catch((error) => {
    console.error('[mcp-server] Failed to start', error);
    process.exit(1);
  });
}
