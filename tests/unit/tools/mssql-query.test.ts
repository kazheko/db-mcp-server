import { describe, expect, it } from 'vitest';

import type { QueryAdapter, MssqlQueryRequest } from '../../../src/types/mssql.js';
import { ToolFactory } from '../../../src/tools/tool-factory.js';

class ThrowingAdapter implements QueryAdapter<MssqlQueryRequest, never> {
  constructor(private readonly errorToThrow: unknown) {}
  async execute(_request: MssqlQueryRequest): Promise<never> {
    throw this.errorToThrow;
  }
}

const factory = new ToolFactory();

describe('mssql-query tool error handling', () => {
  it('wraps Error instances and returns error content', async () => {
    const message = 'Script timeout simulated by adapter';
    const adapter = new ThrowingAdapter(new Error(message));
    const tool = factory.createMssqlTool(adapter);

    const result = await tool.handler({ database: 'hr', query: 'SELECT 1' });
    expect(result.content[0]?.text ?? '').toContain(message);
  });

  it('wraps string errors and returns error content', async () => {
    const adapter = new ThrowingAdapter('plain error string');
    const tool = factory.createMssqlTool(adapter);

    const result = await tool.handler({ database: 'sales', query: 'SELECT * FROM orders' });
    expect(result.content[0]?.text ?? '').toContain('plain error string');
  });
});
