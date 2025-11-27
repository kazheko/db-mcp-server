import { describe, expect, it } from 'vitest';

import type {
  MssqlQueryRequest,
  QueryAdapter,
  QueryResultRow
} from '../../src/types/mssql.js';
import { createMssqlTool } from '../../src/tools/mssql-tool.js';
import { withLogging } from '../../src/tools/log-wrapper.js';
import { withMssqlValidation } from '../../src/adapters/validators/mssql-validator.js';

const createTool = (adapter: QueryAdapter<MssqlQueryRequest, QueryResultRow[]>) =>
  withLogging(createMssqlTool(adapter));

class FakeAdapter implements QueryAdapter<MssqlQueryRequest, QueryResultRow[]> {
  public callCount = 0;

  constructor(private readonly options: { rows?: QueryResultRow[]; error?: Error } = {}) {}

  async execute() {
    this.callCount += 1;

    if (this.options.error) {
      throw this.options.error;
    }
    return this.options.rows ?? [];
  }
}

const invokeTool = async (
  adapter: QueryAdapter<MssqlQueryRequest, QueryResultRow[]>,
  input: MssqlQueryRequest
) => {
  const tool = createTool(adapter);
  return tool.handler(input);
};

type ToolResult = Awaited<ReturnType<typeof invokeTool>>;

describe('mssql-query tool contract', () => {
  it('returns adapter rows verbatim inside the payload', async () => {
    const rows = Array.from({ length: 5 }, (_, index) => ({ column: index }));
    const result: ToolResult = await invokeTool(new FakeAdapter({ rows }), {
      database: 'hr',
      query: 'SELECT * FROM employees',
      maxRows: 5
    });

    expect(result.content?.[0]?.type).toBe('text');
    const text = result.content?.[0]?.text ?? '{}';
    const response = JSON.parse(text);

    expect(response.database).toBe('hr');
    expect(response.correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(new Date(response.startedAt).getTime()).toBeLessThanOrEqual(new Date(response.completedAt).getTime());
    expect(response.queryResult).toStrictEqual(rows);
  });

  it('surfaces adapter errors through the log wrapper as text errors', async () => {
    const toolResult: ToolResult = await invokeTool(
      new FakeAdapter({ error: new Error('real adapter failure') }),
      {
        database: 'analytics',
        query: 'SELECT * FROM sys.tables'
      }
    );

    expect(toolResult.isError).toBe(true);
    expect(toolResult.content?.[0]?.text).toContain('real adapter failure');
  });

  it('exposes manifest metadata for discovery', () => {
    const tool = createTool(new FakeAdapter());
    expect(tool.title).toBe('MSSQL Query Tool');
    expect(tool.description).toMatch(/read-only/i);

    const inputResult = tool.inputSchema.safeParse({
      database: 'analytics',
      query: 'SELECT COUNT(*) FROM schemas',
      maxRows: 10
    });
    expect(inputResult.success).toBe(true);

    const outputResult = tool.outputSchema.safeParse({
      correlationId: '00000000-0000-4000-8000-000000000000',
      database: 'analytics',
      queryResult: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });
    expect(outputResult.success).toBe(true);
  });

  it('rejects DML before the adapter executes', async () => {
    const baseAdapter = new FakeAdapter();
    const decorated = withMssqlValidation(baseAdapter);

    const result: ToolResult = await invokeTool(decorated, {
      database: 'master',
      query: 'INSERT INTO dbo.AuditLog VALUES (1)'
    });

    expect(baseAdapter.callCount).toBe(0);
    expect(result.isError).toBe(true);
    expect(result.content?.[0]?.text ?? '').toContain('Validation Error');
  });
});
