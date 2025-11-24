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
    expect(first).toHaveLength(2);
    expect(first[0]).toHaveProperty('EmployeeId');
  });

  it('falls back to default row count when maxRows missing', async () => {
    const response = await adapter.execute({
      database: 'sales',
      query: 'SELECT id FROM opportunities'
    });

    expect(response).toHaveLength(3);
    expect(response[0]).toHaveProperty('ColumnName');
  });
});
