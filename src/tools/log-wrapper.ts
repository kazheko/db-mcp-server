import type { ToolContent, ToolDefinition } from './types.js';

export class LogWrapper<TInputSchema, TOutputSchema, TRequest>
  implements ToolDefinition<TInputSchema, TOutputSchema, TRequest>
{
  readonly name;
  readonly title;
  readonly description;
  readonly inputSchema;
  readonly outputSchema;

  constructor(private readonly inner: ToolDefinition<TInputSchema, TOutputSchema, TRequest>) {
    this.name = inner.name;
    this.title = inner.title;
    this.description = inner.description;
    this.inputSchema = inner.inputSchema;
    this.outputSchema = inner.outputSchema;
  }

  handler = async (params: TRequest) => {
    try {
      return await this.inner.handler(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text' as ToolContent['type'],
            text: `Tool execution failed: ${message}`
          }
        ]
      };
    }
  };
}
