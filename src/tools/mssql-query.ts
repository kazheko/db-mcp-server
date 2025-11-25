import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { withErrorPassthrough } from '../errors/handler.js';
import type {
  MssqlAdapter,
  MssqlQueryRequest,
  MssqlQueryResponse,
  ToolMetadata
} from '../types/mssql.js';

export const MSSQL_TOOL_NAME = 'mssql-query';

const inputSchema = z.object({
  database: z.string().describe('Logical database/catalog name to target.'),
  query: z.string().describe('Read-only SQL text limited to a single statement.'),
  maxRows: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Optional cap on synthetic rows returned by the stub.')
});

const outputSchema = z.object({
  correlationId: z.string().describe('Per-invocation identifier useful for tracing logs.'),
  database: z.string().describe('Echo of the requested database name.'),
  queryResult: z
    .array(z.record(z.any()))
    .describe('Synthetic JSON rows mirroring the shape of a SELECT result.'),
  startedAt: z
    .string()
    .describe('ISO-8601 timestamp recorded immediately before the adapter is invoked.'),
  completedAt: z
    .string()
    .describe('ISO-8601 timestamp recorded immediately after the adapter resolves.')
});

export type MssqlTool = ReturnType<typeof createMssqlTool>;

export function createMssqlTool(adapter: MssqlAdapter) {
  const metadata: ToolMetadata<typeof inputSchema, typeof outputSchema> = {
    name: MSSQL_TOOL_NAME,
    title: 'MSSQL Query Tool',
    description: 'Executes read-only SQL through a deterministic adapter stub for structural previewing.',
    inputSchema,
    outputSchema
  };

  const handler = async (params: MssqlQueryRequest) => {
    const correlationId = uuidv4();
    const startedAt = new Date().toISOString();

    const queryResult = await withErrorPassthrough(
      () => adapter.execute(params),
      { correlationId, context: { database: params.database } }
    );

    const completedAt = new Date().toISOString();

    const payload: MssqlQueryResponse = {
      correlationId,
      database: params.database,
      queryResult,
      startedAt,
      completedAt
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(payload, null, 2)
        }
      ],
      structuredContent: payload
    };
  };

  return { ...metadata, handler };
}

export function registerMssqlTool(server: McpServer, adapter: MssqlAdapter) {
  const tool = createMssqlTool(adapter);
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema
    },
    tool.handler
  );

  return tool;
}
