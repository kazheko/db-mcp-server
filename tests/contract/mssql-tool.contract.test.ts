import { describe, expect, it } from 'vitest';

import { StubMssqlAdapter } from '../../src/adapters/mssql.js';
import { createMssqlTool } from '../../src/tools/mssql-query.js';

const invokeTool = async (input: Parameters<ReturnType<typeof createMssqlTool>['handler']>[0]) => {
  const adapter = new StubMssqlAdapter();
  const tool = createMssqlTool(adapter);
  return tool.handler(input);
};

describe('mssql-query tool contract', () => {
  it('returns deterministic metadata and JSON payload', async () => {
    const response = await invokeTool({
      database: 'hr',
      query: 'SELECT * FROM employees',
      maxRows: 5
    });

    expect(response.database).toBe('hr');
    expect(response.correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(new Date(response.startedAt).getTime()).toBeLessThanOrEqual(new Date(response.completedAt).getTime());
    expect(response.queryResult.length).toBe(5);
    response.queryResult.forEach((row) => {
      expect(row).toHaveProperty('EmployeeId');
      expect(row).toHaveProperty('FullName');
    });
  });

  it('exposes manifest metadata for discovery', () => {
    const tool = createMssqlTool(new StubMssqlAdapter());
    expect(tool.title).toBe('MSSQL Query Tool');
    expect(tool.description).toMatch(/read-only/i);

    const inputResult = tool.inputSchema.safeParse({
      database: 'analytics',
      query: 'SELECT COUNT(*) FROM schemas',
      maxRows: 10
    });
    expect(inputResult.success).toBe(true);

    const outputResult = tool.outputSchema.safeParse({
      correlationId: '00000000-0000-4000-8000-000000000000',
      database: 'analytics',
      queryResult: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });
    expect(outputResult.success).toBe(true);
  });
});
