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
  database: z
    .string()
    .min(1)
    .describe('Logical metadata database/catalog name to target.'),
  query: z
    .string()
    .min(1)
    .describe('Single read-only SQL statement targeting pg_catalog/information_schema.'),
  maxRows: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Optional cap on rows returned by the adapter execution.')
});

const outputSchema = z.object({
  correlationId: z.string().describe('Per-invocation identifier useful for tracing logs.'),
  database: z.string().describe('Echo of the requested database name.'),
  queryResult: z
    .array(z.record(z.any()))
    .describe('Metadata rows produced by the PostgreSQL adapter.'),
  startedAt: z.string().describe('ISO-8601 timestamp recorded before adapter invocation.'),
  completedAt: z.string().describe('ISO-8601 timestamp recorded after adapter resolves.'),
  rowCount: z.number().optional().describe('Row count returned (may be truncated by maxRows).')
});

export const createPostgresTool = (
  adapter: QueryAdapter<QueryRequest, QueryResultRow[]>
): ToolDefinition<typeof inputSchema, typeof outputSchema, QueryRequest> => {
  const handler: ToolDefinition<
    typeof inputSchema,
    typeof outputSchema,
    QueryRequest
  >['handler'] = async (params) => {
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
    name: 'postgres.metadataQuery',
    title: 'PostgreSQL Metadata Query Tool',
    description:
      'Executes read-only PostgreSQL catalog queries via the metadata adapter.',
    inputSchema,
    outputSchema,
    handler
  };
};
