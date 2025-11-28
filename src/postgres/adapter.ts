import { Pool } from 'pg';

import type { QueryAdapter, QueryRequest, QueryResultRow } from '../shared/queries.js';
import { loadPostgresConnectionConfig } from '../adapters/postgres-config.js';

const DEFAULT_ROW_LIMIT = 100;
const MAX_ROW_LIMIT = 1000;
const DEFAULT_TIMEOUT_MS = 30_000;

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
  config = loadPostgresConnectionConfig()
): QueryAdapter<QueryRequest, QueryResultRow[]> => {
  const pool = new Pool({
    connectionString: config.rawConnectionString,
    statement_timeout: DEFAULT_TIMEOUT_MS,
    query_timeout: DEFAULT_TIMEOUT_MS
  });

  return {
    async execute(request) {
      const client = await pool.connect();
      try {
        const result = await client.query(request.query);
        const rows = Array.isArray(result.rows) ? result.rows : [];
        return limitRows(rows, request.maxRows);
      } finally {
        client.release();
      }
    }
  };
};
