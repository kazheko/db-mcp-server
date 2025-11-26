import mssql from 'mssql';

import type { MssqlQueryRequest, QueryAdapter, QueryResultRow } from '../types/mssql.js';
import { loadConnectionConfig } from './mssql-config.js';

const DEFAULT_ROW_LIMIT = 100;
const MAX_ROW_LIMIT = 1000;

export class MssqlAdapter implements QueryAdapter<MssqlQueryRequest, QueryResultRow[]> {
  private readonly pool: mssql.ConnectionPool;

  constructor(private readonly config = loadConnectionConfig()) {
    this.pool = new mssql.ConnectionPool(this.config.rawConnectionString);
  }

  async execute(request: MssqlQueryRequest): Promise<QueryResultRow[]> {
    const pool = await this.ensurePool();
    const result = await pool.request().query(request.query);
    const rows = Array.isArray(result.recordset) ? result.recordset : [];
    return this.limitRows(rows, request.maxRows);
  }

  private async ensurePool() {
    if (!this.pool.connected) {
      await this.pool.connect();
    }
    return this.pool;
  }

  private limitRows(rows: QueryResultRow[], maxRows?: number) {
    const limit = this.resolveRowLimit(maxRows);
    return rows.slice(0, limit);
  }

  private resolveRowLimit(maxRows?: number) {
    if (typeof maxRows === 'number' && Number.isFinite(maxRows) && maxRows > 0) {
      return Math.min(Math.floor(maxRows), MAX_ROW_LIMIT);
    }
    return DEFAULT_ROW_LIMIT;
  }
}
