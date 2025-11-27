const CONNECTION_ENV_KEY = 'POSTGRES_CONNECTION_STRING';

export type PostgresConnectionConfig = {
  envVarName: string;
  rawConnectionString: string;
  sslMode?: string;
  source: 'env';
};

const ensureProtocol = (value: string) => {
  const lower = value.toLowerCase();
  if (!lower.startsWith('postgres://') && !lower.startsWith('postgresql://')) {
    throw new Error(
      `[postgres-config] ${CONNECTION_ENV_KEY} must start with postgres:// or postgresql://`
    );
  }
};

export function loadPostgresConnectionConfig(env: NodeJS.ProcessEnv = process.env): PostgresConnectionConfig {
  const rawValue = env[CONNECTION_ENV_KEY] ?? '';
  const trimmed = rawValue.trim();

  if (!trimmed) {
    throw new Error(
      `[postgres-config] Missing ${CONNECTION_ENV_KEY} environment variable. Set it before starting the MCP server.`
    );
  }

  ensureProtocol(trimmed);

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (error) {
    throw new Error(
      `[postgres-config] ${CONNECTION_ENV_KEY} must be a valid connection string (failed to parse: ${String(error)})`
    );
  }

  if (!parsed.hostname) {
    throw new Error(
      `[postgres-config] ${CONNECTION_ENV_KEY} must include a host component`
    );
  }

  const database = parsed.pathname.replace(/^\//, '');
  if (!database) {
    throw new Error(
      `[postgres-config] ${CONNECTION_ENV_KEY} must include a database path segment`
    );
  }

  const sslMode = parsed.searchParams.get('sslmode') ?? undefined;

  return {
    envVarName: CONNECTION_ENV_KEY,
    rawConnectionString: trimmed,
    sslMode,
    source: 'env'
  };
}
