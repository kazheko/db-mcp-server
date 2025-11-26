#!/usr/bin/env node

import { MssqlAdapter } from '../../src/adapters/mssql.js';
import { ToolFactory } from '../../src/tools/tool-factory.js';
import { MssqlValidator } from '../../src/adapters/validators/mssql-validator.js';

type ParsedArgs = Record<string, string | undefined>;

type ToolResult = Awaited<ReturnType<ReturnType<ToolFactory['createMssqlTool']>['handler']>>;

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
  const adapter = new MssqlAdapter();
  const validatedAdapter = new MssqlValidator(adapter);
  const tool = new ToolFactory().createMssqlTool(validatedAdapter );

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

  const database = rawArgs.database;
  const query = rawArgs.query;
  const maxRows = rawArgs.maxRows ? Number(rawArgs.maxRows) : undefined;

  if (!database || !query) {
    console.error('Usage: npm run mcp:invoke -- --database <db> --query "<sql>" [--maxRows <n>]');
    console.error('Add --describe to print tool metadata');
    process.exit(1);
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

main();
