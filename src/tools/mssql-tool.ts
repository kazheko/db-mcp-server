import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import type {
  QueryAdapter,
  MssqlQueryRequest,
  MssqlQueryResponse,
  QueryResultRow
} from '../types/mssql.js';
import type { ToolDefinition } from './types.js';

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

export class MssqlTool
  implements ToolDefinition<typeof inputSchema, typeof outputSchema, MssqlQueryRequest>
{
  readonly name = 'mssql-query';
  readonly title = 'MSSQL Query Tool';
  readonly description =
    'Executes read-only SQL through the live MSSQL adapter for structural previewing.';
  readonly inputSchema = inputSchema;
  readonly outputSchema = outputSchema;

  constructor(private readonly adapter: QueryAdapter<MssqlQueryRequest, QueryResultRow[]>) {}

  handler = async (params: MssqlQueryRequest) => {
    const correlationId = uuidv4();
    const startedAt = new Date().toISOString();

    const queryResult = await this.adapter.execute(params);

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
}
