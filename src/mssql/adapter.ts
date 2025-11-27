import mssql from 'mssql';

import type { MssqlQueryRequest, QueryAdapter, QueryResultRow } from './types.js';
import { loadConnectionConfig } from '../adapters/mssql-config.js';

const DEFAULT_ROW_LIMIT = 100;
const MAX_ROW_LIMIT = 1000;

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

export const createMssqlAdapter = (
  config = loadConnectionConfig()
): QueryAdapter<MssqlQueryRequest, QueryResultRow[]> => {
  const pool = new mssql.ConnectionPool(config.rawConnectionString);

  const ensurePool = async () => {
    if (!pool.connected) {
      await pool.connect();
    }
    return pool;
  };

  return {
    async execute(request) {
      const poolInstance = await ensurePool();
      const result = await poolInstance.request().query(request.query);
      const rows = Array.isArray(result.recordset) ? result.recordset : [];
      return limitRows(rows, request.maxRows);
    }
  };
};
