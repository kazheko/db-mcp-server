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
  maxRows: z.number().int().positive().optional().describe('Optional cap on synthetic rows returned by the stub.')
});

const outputSchema = z.object({
  correlationId: z.string().describe('Per-invocation identifier useful for tracing logs.'),
  database: z.string().describe('Echo of the requested database name.'),
  recordset: z
    .array(
      z.object({
        columns: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            nullable: z.boolean().optional()
          })
        ),
        rows: z.array(z.array(z.string()))
      })
    )
    .describe('Synthetic structural preview of the MSSQL rows returned by the stub.'),
  startedAt: z.string().describe('ISO-8601 timestamp recorded immediately before the adapter is invoked.'),
  completedAt: z.string().describe('ISO-8601 timestamp recorded immediately after the adapter resolves.')
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

  const handler = async (params: MssqlQueryRequest): Promise<MssqlQueryResponse> => {
    const correlationId = uuidv4();
    const startedAt = new Date().toISOString();

    const recordset = await withErrorPassthrough(
      () => adapter.execute(params),
      { correlationId, context: { database: params.database } }
    );

    const completedAt = new Date().toISOString();

    return {
      correlationId,
      database: params.database,
      recordset,
      startedAt,
      completedAt
    };
  };

  return { ...metadata, handler };
}

export function registerMssqlTool(server: McpServer, adapter: MssqlAdapter) {
  const tool = createMssqlTool(adapter);
  server.registerTool(tool.name, {
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema
  }, tool.handler);

  return tool;
}
