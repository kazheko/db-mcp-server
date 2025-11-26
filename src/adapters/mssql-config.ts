import type { MssqlConnectionConfig } from '../types/mssql.js';

const CONNECTION_ENV_KEY = 'MSSQL_CONNECTION_STRING';
const SERVER_SEGMENT_PATTERN = /(Server|Data Source)\s*=/i;
const DATABASE_SEGMENT_PATTERN = /(Database|Initial Catalog)\s*=/i;

export function loadConnectionConfig(env: NodeJS.ProcessEnv = process.env): MssqlConnectionConfig {
  const rawValue = env[CONNECTION_ENV_KEY] ?? '';
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    throw new Error(
      `[mssql-config] Missing ${CONNECTION_ENV_KEY} environment variable. Set it or reference .env.example before starting the MCP server.`
    );
  }

  if (!SERVER_SEGMENT_PATTERN.test(trimmedValue) || !DATABASE_SEGMENT_PATTERN.test(trimmedValue)) {
    throw new Error(
      `[mssql-config] ${CONNECTION_ENV_KEY} must include both Server= (or Data Source=) and Database= (or Initial Catalog=) segments.`
    );
  }

  return {
    envVarName: CONNECTION_ENV_KEY,
    rawConnectionString: trimmedValue
  };
}
