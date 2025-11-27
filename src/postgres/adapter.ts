import { Pool, type PoolConfig } from 'pg';

import type { QueryAdapter, QueryRequest, QueryResultRow } from '../shared/queries.js';
import { withPostgresValidation } from './validator.js';
import { loadPostgresConnectionConfig } from '../adapters/postgres-config.js';

const DEFAULT_ROW_LIMIT = 100;
const MAX_ROW_LIMIT = 1000;
const DEFAULT_TIMEOUT_MS = 30_000;

export type PostgresAdapterConfig = {
  connectionString?: string;
  poolOptions?: PoolConfig;
  timeoutMs?: number;
};

const resolveRowLimit = (maxRows?: number) => {
  if (typeof maxRows === 'number' && Number.isFinite(maxRows) && maxRows > 0) {
    return Math.min(Math.floor(maxRows), MAX_ROW_LIMIT);
  }
  return DEFAULT_ROW_LIMIT;
};

const limitRows = (rows: QueryResultRow[], maxRows?: number) => {
  const limit = resolveRowLimit(maxRows);
  return rows.slice(0, limit);
};

export const createPostgresAdapter = (
  config: PostgresAdapterConfig = {}
): QueryAdapter<QueryRequest, QueryResultRow[]> => {
  const connectionString = config.connectionString ?? loadPostgresConnectionConfig().rawConnectionString;

  const timeout = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pool = new Pool({
    connectionString,
    statement_timeout: timeout,
    query_timeout: timeout,
    ...config.poolOptions
  });

  const baseAdapter: QueryAdapter<QueryRequest, QueryResultRow[]> = {
    async execute(request) {
      const client = await pool.connect();
      try {
        const result = await client.query({
          text: request.query,
          rowMode: 'object'
        });
        const rows = Array.isArray(result.rows) ? result.rows : [];
        return limitRows(rows, request.maxRows);
      } finally {
        client.release();
      }
    }
  };

  return withPostgresValidation(baseAdapter);
};
