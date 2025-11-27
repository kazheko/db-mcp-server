import { describe, expect, it, afterEach } from 'vitest';

import { loadPostgresConnectionConfig } from '../../../src/adapters/postgres-config.js';

const ENV_KEY = 'POSTGRES_CONNECTION_STRING';

describe('loadPostgresConnectionConfig', () => {
  const originalEnv = process.env[ENV_KEY];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = originalEnv;
    }
  });

  it('throws when env var is missing', () => {
    delete process.env[ENV_KEY];
    expect(() => loadPostgresConnectionConfig()).toThrow(/Missing POSTGRES_CONNECTION_STRING/);
  });

  it('throws when connection string lacks protocol', () => {
    process.env[ENV_KEY] = 'user:pass@localhost/db';
    expect(() => loadPostgresConnectionConfig()).toThrow(/must start with postgres/);
  });

  it('throws when connection string lacks database path', () => {
    process.env[ENV_KEY] = 'postgresql://user:pass@localhost';
    expect(() => loadPostgresConnectionConfig()).toThrow(/must include a database path/);
  });

  it('returns config when connection string is valid', () => {
    process.env[ENV_KEY] = 'postgresql://user:pass@localhost:5432/postgres?sslmode=require';
    const config = loadPostgresConnectionConfig();
    expect(config.rawConnectionString).toContain('postgresql://');
    expect(config.envVarName).toBe(ENV_KEY);
    expect(config.sslMode).toBe('require');
  });
});

