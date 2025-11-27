import { describe, expect, it, vi } from 'vitest';

import type {
  MssqlQueryRequest,
  QueryAdapter,
  QueryResultRow
} from '../../../src/mssql/types.js';
import { withMssqlValidation } from '../../../src/mssql/validator.js';

const makeAdapter = (rows: QueryResultRow[] = []) => {
  const execute = vi.fn(async (_request: MssqlQueryRequest) => rows);
  const adapter: QueryAdapter<MssqlQueryRequest, QueryResultRow[]> = {
    execute
  };
  return { adapter, execute };
};

describe('mssql validator', () => {
  it('allows metadata queries to reach the wrapped adapter', async () => {
    const { adapter, execute } = makeAdapter([{ name: 'sys.tables' }]);
    const decorated = withMssqlValidation(adapter);

    const request: MssqlQueryRequest = {
      database: 'master',
      query: 'SELECT name FROM sys.tables'
    };

    await decorated.execute(request);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('rejects DDL statements before hitting the adapter', async () => {
    const { adapter, execute } = makeAdapter();
    const decorated = withMssqlValidation(adapter);

    await expect(
      decorated.execute({
        database: 'master',
        query: 'CREATE TABLE foo(id INT)'
      })
    ).rejects.toThrow(/Validation/i);

    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects multi-statement batches', async () => {
    const { adapter, execute } = makeAdapter();
    const decorated = withMssqlValidation(adapter);

    await expect(
      decorated.execute({
        database: 'master',
        query: 'SELECT name FROM sys.databases; SELECT * FROM sys.tables'
      })
    ).rejects.toThrow(/single sql/i);

    expect(execute).not.toHaveBeenCalled();
  });

  it('returns strikethrough validation errors for DML statements', async () => {
    const { adapter } = makeAdapter();
    const decorated = withMssqlValidation(adapter);

    await expect(
      decorated.execute({
        database: 'master',
        query: 'DELETE FROM sys.databases'
      })
    ).rejects.toThrow(/\*\*Validation Error\*\*/);
  });
});
