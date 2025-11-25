import type { QueryAdapter, MssqlQueryRequest, QueryResultRow } from '../types/mssql.js';
import { MssqlTool } from './mssql-tool.js';
import { LogWrapper } from './log-wrapper.js';

export class ToolFactory {
  createMssqlTool(adapter: QueryAdapter<MssqlQueryRequest, QueryResultRow[]>) {
    const tool = new MssqlTool(adapter);
    return new LogWrapper(tool);
  }
}
