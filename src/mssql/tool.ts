import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import type {
  QueryAdapter,
  QueryRequest,
  QueryResponseEnvelope,
  QueryResultRow
} from '../shared/queries.js';
import type { ToolDefinition } from '../tools/types.js';

const inputSchema = z.object({
  database: z.string().describe('Logical database/catalog name to target.'),
  query: z.string().describe('Read-only SQL text limited to a single statement.'),
  maxRows: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Optional cap on rows returned by the live adapter execution.')
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

export const createMssqlTool = (
  adapter: QueryAdapter<QueryRequest, QueryResultRow[]>
): ToolDefinition<typeof inputSchema, typeof outputSchema, QueryRequest> => {
  const handler: ToolDefinition<typeof inputSchema, typeof outputSchema, QueryRequest>['handler'] = async (
    params
  ) => {
    const correlationId = uuidv4();
    const startedAt = new Date().toISOString();

    const queryResult = await adapter.execute(params);

    const completedAt = new Date().toISOString();
    const payload: QueryResponseEnvelope = {
      correlationId,
      database: params.database,
      queryResult,
      rowCount: queryResult.length,
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

  return {
    name: 'mssql-query',
    title: 'MSSQL Query Tool',
    description: 'Executes read-only SQL through the live MSSQL adapter for structural previewing.',
    inputSchema,
    outputSchema,
    handler
  };
};
