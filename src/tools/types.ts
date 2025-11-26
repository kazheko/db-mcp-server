export type ToolContent = {
  type: 'text';
  text: string;
};

export type ToolDefinition<TInputSchema, TOutputSchema, TRequest> = {
  name: string;
  title: string;
  description: string;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  handler: (params: TRequest) => Promise<{ content: ToolContent[]; structuredContent?: { [x: string]: unknown }; isError?: boolean }>;
};
