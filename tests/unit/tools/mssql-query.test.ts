import { describe, expect, it, vi } from 'vitest';

import type { QueryAdapter, MssqlQueryRequest, QueryResultRow } from '../../../src/types/mssql.js';
import { createMssqlTool } from '../../../src/tools/mssql-tool.js';
import { withLogging } from '../../../src/tools/log-wrapper.js';
import { withMssqlValidation } from '../../../src/adapters/validators/mssql-validator.js';

class ThrowingAdapter implements QueryAdapter<MssqlQueryRequest, QueryResultRow[]> {
  constructor(private readonly errorToThrow: unknown) {}
  async execute(_request: MssqlQueryRequest): Promise<QueryResultRow[]> {
    throw this.errorToThrow;
  }
}

const createTool = (adapter: QueryAdapter<MssqlQueryRequest, QueryResultRow[]>) =>
  withLogging(createMssqlTool(adapter));

describe('mssql-query tool error handling', () => {
  it('wraps Error instances and returns error content', async () => {
    const message = 'Script timeout simulated by adapter';
    const adapter = new ThrowingAdapter(new Error(message));
    const tool = createTool(adapter);

    const result = await tool.handler({ database: 'hr', query: 'SELECT 1' });
    expect(result.content[0]?.text ?? '').toContain(message);
  });

  it('wraps string errors and returns error content', async () => {
    const adapter = new ThrowingAdapter('plain error string');
    const tool = createTool(adapter);

    const result = await tool.handler({ database: 'sales', query: 'SELECT * FROM orders' });
    expect(result.content[0]?.text ?? '').toContain('plain error string');
  });

  it('returns the same payload when using a decorated adapter for valid queries', async () => {
    const rows = [{ name: 'sys.databases' }];
    const baseAdapter: QueryAdapter<MssqlQueryRequest, typeof rows> = {
      execute: vi.fn(async () => rows)
    };
    const decorated = withMssqlValidation(baseAdapter);
    const tool = createTool(decorated);

    const result = await tool.handler({ database: 'master', query: 'SELECT name FROM sys.databases' });
    const text = result.content?.[0]?.text ?? '{}';
    const parsed = JSON.parse(text);

    expect(parsed.queryResult).toEqual(rows);
    expect(baseAdapter.execute).toHaveBeenCalledTimes(1);
  });
});
