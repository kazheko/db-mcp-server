#!/usr/bin/env node
import { StubMssqlAdapter } from '../../src/adapters/mssql.js';
import { createMssqlTool } from '../../src/tools/mssql-query.js';

type ParsedArgs = Record<string, string | undefined>;

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

const extractSchemaKeys = (schema: unknown): string[] => {
  if (typeof schema === 'object' && schema && 'shape' in (schema as Record<string, unknown>)) {
    const shape = (schema as { shape: Record<string, unknown> }).shape;
    return Object.keys(shape);
  }
  return [];
};

async function main() {
  const rawArgs = parseArgs(process.argv.slice(2));
  const adapter = new StubMssqlAdapter();
  const tool = createMssqlTool(adapter);

  if ('describe' in rawArgs) {
    console.log(
      JSON.stringify(
        {
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputFields: extractSchemaKeys(tool.inputSchema),
          outputFields: extractSchemaKeys(tool.outputSchema)
        },
        null,
        2
      )
    );
    return;
  }

  const database = rawArgs.database;
  const query = rawArgs.query;
  const maxRows = rawArgs.maxRows ? Number(rawArgs.maxRows) : undefined;

  if (!database || !query) {
    console.error('Usage: npm run mcp:invoke -- --database <db> --query "<sql>" [--maxRows <n>]');
    console.error('Add --describe to print tool metadata');
    process.exit(1);
  }

  try {
    const response = await tool.handler({ database, query, maxRows });
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Tool execution failed:', error);
    process.exit(1);
  }
}

main();
