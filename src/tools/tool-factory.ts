import type { MssqlAdapter } from '../types/mssql.js';
import { MssqlTool } from './mssql-tool.js';

export class ToolFactory {
  createMssqlTool(adapter: MssqlAdapter) {
    return new MssqlTool(adapter);
  }
}
