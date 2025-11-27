import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  mockMssqlModule,
  resetMockState,
  setMockError,
  setMockRows
} from './__mocks__/index.js';

vi.mock('mssql', () => mockMssqlModule());

const configMock = {
  envVarName: 'MSSQL_CONNECTION_STRING',
  rawConnectionString: 'Server=localhost;Database=tempdb;Trusted_Connection=yes;'
};

vi.mock('../../../src/adapters/mssql-config.js', () => ({
  loadConnectionConfig: vi.fn(() => configMock)
}));

import { createMssqlAdapter } from '../../../src/adapters/mssql.js';

describe('MssqlAdapter', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('limits returned rows to the requested maxRows', async () => {
    setMockRows([
      { id: 1 },
      { id: 2 },
      { id: 3 }
    ]);

    const adapter = createMssqlAdapter();
    const rows = await adapter.execute({
      database: 'hr',
      query: 'SELECT * FROM employees',
      maxRows: 2
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ id: 1 });
    expect(rows[1]).toEqual({ id: 2 });
  });

  it('applies default row limit when maxRows is not provided', async () => {
    setMockRows(Array.from({ length: 120 }, (_, index) => ({ id: index + 1 })));

    const adapter = createMssqlAdapter();
    const rows = await adapter.execute({
      database: 'metadata',
      query: 'SELECT * FROM INFORMATION_SCHEMA.TABLES'
    });

    expect(rows).toHaveLength(100);
  });

  it('surfaces driver errors unchanged', async () => {
    const driverError = new Error('Query timeout');
    setMockError(driverError);

    const adapter = createMssqlAdapter();

    await expect(
      adapter.execute({
        database: 'hr',
        query: 'SELECT * FROM sys.tables'
      })
    ).rejects.toBe(driverError);
  });
});
