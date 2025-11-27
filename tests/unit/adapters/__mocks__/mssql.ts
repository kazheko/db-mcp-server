import { vi } from 'vitest';

import type { QueryResultRow } from '../../../../src/mssql/types.js';

export type MockMssqlState = {
  rows: QueryResultRow[];
  error?: Error;
};

const state: MockMssqlState = {
  rows: []
};

export const setMockRows = (rows: QueryResultRow[]) => {
  state.rows = rows;
  state.error = undefined;
};

export const setMockError = (error: Error) => {
  state.error = error;
};

export const resetMockState = () => {
  state.rows = [];
  state.error = undefined;
};

class MockRequest {
  input() {
    return this;
  }

  async query() {
    if (state.error) {
      throw state.error;
    }
    return { recordset: state.rows };
  }
}

class MockConnectionPool {
  connect = vi.fn(async () => this);

  request = vi.fn(() => new MockRequest());

  close = vi.fn();
}

export const mockMssqlModule = () => {
  const moduleApi = {
    ConnectionPool: vi.fn(() => new MockConnectionPool())
  };

  return {
    ...moduleApi,
    default: moduleApi
  };
};
