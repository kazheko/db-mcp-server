import { describe, expect, it, vi } from 'vitest';

import type {
  QueryAdapter,
  QueryRequest,
  QueryResultRow
} from '../../../src/shared/queries.js';
import { createPostgresTool } from '../../../src/postgres/tool.js';
import { withLogging } from '../../../src/shared/logging.js';

const createAdapter = (rows: QueryResultRow[] = []) =>
  ({
    execute: vi.fn(async () => rows)
  } satisfies QueryAdapter<QueryRequest, QueryResultRow[]>);

const createTool = (adapter: QueryAdapter<QueryRequest, QueryResultRow[]>) =>
  withLogging(createPostgresTool(adapter));

describe('postgres metadata tool', () => {
  it('returns structured payloads with query rows', async () => {
    const rows = [{ oid: 1255, relname: 'pg_proc' }];
    const adapter = createAdapter(rows);
    const tool = createTool(adapter);

    const response = await tool.handler({
      database: 'metadata',
      query: 'SELECT oid FROM pg_catalog.pg_proc LIMIT 1'
    });

    const payload = JSON.parse(response.content?.[0]?.text ?? '{}');
    expect(payload.queryResult).toEqual(rows);
    expect(payload.rowCount).toBe(1);
    expect(adapter.execute).toHaveBeenCalledTimes(1);
  });

  it('surfaces adapter errors through logging wrapper', async () => {
    const adapter = {
      execute: vi.fn(async () => {
        throw new Error('timeout!');
      })
    } satisfies QueryAdapter<QueryRequest, QueryResultRow[]>;
    const tool = createTool(adapter);

    const response = await tool.handler({
      database: 'metadata',
      query: 'SELECT 1'
    });

    expect(response.isError).toBe(true);
    expect(response.content?.[0]?.text ?? '').toContain('timeout');
  });
});
