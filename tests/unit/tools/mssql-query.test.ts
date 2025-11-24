import { describe, expect, it } from 'vitest';

import type { MssqlAdapter, MssqlQueryRequest } from '../../../src/types/mssql.js';
import { createMssqlTool } from '../../../src/tools/mssql-query.js';

class ThrowingAdapter implements MssqlAdapter {
  constructor(private readonly errorToThrow: unknown) {}
  async execute(_request: MssqlQueryRequest) {
    throw this.errorToThrow;
  }
}

describe('mssql-query tool error handling', () => {
  it('propagates Error instances unchanged', async () => {
    const message = 'Script timeout simulated by adapter';
    const adapter = new ThrowingAdapter(new Error(message));
    const tool = createMssqlTool(adapter);

    await expect(
      tool.handler({ database: 'hr', query: 'SELECT 1' })
    ).rejects.toThrow(message);
  });

  it('propagates string errors unchanged', async () => {
    const adapter = new ThrowingAdapter('plain error string');
    const tool = createMssqlTool(adapter);

    await expect(
      tool.handler({ database: 'sales', query: 'SELECT * FROM orders' })
    ).rejects.toBe('plain error string');
  });
});
