import { describe, expect, it } from 'vitest';

import { StubMssqlAdapter } from '../../../src/adapters/mssql.js';

const adapter = new StubMssqlAdapter();

describe('StubMssqlAdapter', () => {
  it('returns deterministic row counts respecting maxRows', async () => {
    const request = {
      database: 'hr',
      query: 'SELECT * FROM employees',
      maxRows: 2
    };

    const first = await adapter.execute(request);
    const second = await adapter.execute(request);

    expect(first).toStrictEqual(second);
    expect(first[0]?.rows.length).toBe(2);
  });

  it('falls back to default row count when maxRows missing', async () => {
    const response = await adapter.execute({
      database: 'sales',
      query: 'SELECT id FROM opportunities'
    });

    expect(response[0]?.rows.length).toBe(3);
  });
});
