import { describe, expect, it } from 'vitest';

import { loadConnectionConfig } from '../../../src/adapters/mssql-config.js';

describe('loadConnectionConfig', () => {
  it('returns the trimmed connection string when valid', () => {
    const env = {
      MSSQL_CONNECTION_STRING: '  Server=tcp:example;Database=tempdb;User Id=test;  '
    } as NodeJS.ProcessEnv;

    const config = loadConnectionConfig(env);

    expect(config.rawConnectionString).toBe('Server=tcp:example;Database=tempdb;User Id=test;');
    expect(config.envVarName).toBe('MSSQL_CONNECTION_STRING');
  });

  it('throws when the environment variable is missing', () => {
    expect(() => loadConnectionConfig({} as NodeJS.ProcessEnv)).toThrow(/Missing MSSQL_CONNECTION_STRING/);
  });

  it('throws when the connection string lacks required segments', () => {
    const env = {
      MSSQL_CONNECTION_STRING: 'Database=master;Encrypt=true;'
    } as NodeJS.ProcessEnv;

    expect(() => loadConnectionConfig(env)).toThrow(/must include both Server=/i);
  });
});
