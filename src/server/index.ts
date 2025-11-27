import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createMssqlAdapter } from '../mssql/adapter.js';
import { withMssqlValidation } from '../mssql/validator.js';
import { createMssqlTool } from '../mssql/tool.js';
import { withLogging } from '../shared/logging.js';

export const mcpServer = new McpServer({
  name: 'db-mcp-server',
  version: '0.1.0'
});

const adapter = createMssqlAdapter();
const validatedAdapter = withMssqlValidation(adapter);
const mssqlTool = withLogging(createMssqlTool(validatedAdapter));

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
