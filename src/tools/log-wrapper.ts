import type { ToolContent, ToolDefinition } from './types.js';

export const withLogging = <TInputSchema, TOutputSchema, TRequest>(
  inner: ToolDefinition<TInputSchema, TOutputSchema, TRequest>
): ToolDefinition<TInputSchema, TOutputSchema, TRequest> => {
  const handler: ToolDefinition<TInputSchema, TOutputSchema, TRequest>['handler'] = async (params) => {
    try {
      return await inner.handler(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text' as ToolContent['type'],
            text: `Error: ${message}`
          }
        ],
        isError: true
      };
    }
  };

  return {
    name: inner.name,
    title: inner.title,
    description: inner.description,
    inputSchema: inner.inputSchema,
    outputSchema: inner.outputSchema,
    handler
  };
};
