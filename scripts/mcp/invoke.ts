#!/usr/bin/env node

import { v4 as uuidv4 } from 'uuid';

import { createMssqlAdapter } from '../../src/mssql/adapter.js';
import { withMssqlValidation } from '../../src/mssql/validator.js';
import { createMssqlTool } from '../../src/mssql/tool.js';
import { withLogging } from '../../src/shared/logging.js';
import { createPostgresAdapter } from '../../src/postgres/adapter.js';

type ParsedArgs = Record<string, string | undefined>;

type ToolResult = Awaited<ReturnType<ReturnType<typeof createMssqlTool>['handler']>>;

type Engine = 'mssql' | 'postgres';

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const value = argv[i + 1]?.startsWith('--') ? undefined : argv[i + 1];
      args[key] = value;
      if (value !== undefined) {
        i += 1;
      }
    }
  }
  return args;
}

async function main() {
  const rawArgs = parseArgs(process.argv.slice(2));
  const engineArg = (rawArgs.engine ?? rawArgs.adapter ?? '').toLowerCase();
  const engine: Engine = 'postgres' in rawArgs || engineArg === 'postgres' ? 'postgres' : 'mssql';

  const database = rawArgs.database;
  const query = rawArgs.query;
  const maxRows = rawArgs.maxRows ? Number(rawArgs.maxRows) : undefined;

  if (!database || !query) {
    console.error(
      'Usage: npm run mcp:invoke -- [--engine postgres] --database <db> --query "<sql>" [--maxRows <n>]'
    );
    console.error('Add --describe to print MSSQL tool metadata');
    process.exit(1);
  }

  if (engine === 'postgres') {
    await runPostgresInvocation({ database, query, maxRows, rawArgs });
    return;
  }

  const adapter = createMssqlAdapter();
  const validatedAdapter = withMssqlValidation(adapter);
  const tool = withLogging(createMssqlTool(validatedAdapter));

  if ('describe' in rawArgs) {
    console.log(
      JSON.stringify(
        {
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputFields: Object.keys((tool.inputSchema as { shape?: Record<string, unknown> }).shape ?? {}),
          outputFields: Object.keys((tool.outputSchema as { shape?: Record<string, unknown> }).shape ?? {})
        },
        null,
        2
      )
    );
    return;
  }

  try {
    const result: ToolResult = await tool.handler({ database, query, maxRows });
    const textPayload = result.content?.[0]?.text ?? '{}';
    console.log(textPayload);
  } catch (error) {
    console.error('Tool execution failed:', error);
    process.exit(1);
  }
}

async function runPostgresInvocation(params: {
  database: string;
  query: string;
  maxRows?: number;
  rawArgs: ParsedArgs;
}) {
  const { database, query, maxRows, rawArgs } = params;
  const connectionString = rawArgs.connectionString ?? process.env.POSTGRES_CONNECTION_STRING;
  if (!connectionString) {
    console.error(
      'POSTGRES_CONNECTION_STRING environment variable (or --connectionString flag) is required for Postgres invocations'
    );
    process.exit(1);
  }

  const adapter = createPostgresAdapter({ connectionString });
  const correlationId = uuidv4();
  const startedAt = new Date().toISOString();
  try {
    const queryResult = await adapter.execute({ database, query, maxRows });
    const completedAt = new Date().toISOString();
    const payload = {
      correlationId,
      database,
      queryResult,
      rowCount: queryResult.length,
      startedAt,
      completedAt
    };
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error('Postgres adapter execution failed:', error);
    process.exit(1);
  }
}

main();
