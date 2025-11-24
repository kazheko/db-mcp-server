export type ErrorHandlerOptions = {
  correlationId?: string;
  context?: Record<string, unknown>;
  onError?: (error: unknown) => void;
};

export async function withErrorPassthrough<T>(
  work: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    handleToolError(error, options);
  }
}

export function handleToolError(error: unknown, options: ErrorHandlerOptions = {}): never {
  if (options.onError) {
    options.onError(error);
  } else {
    const prefix = options.correlationId ? `[correlationId=${options.correlationId}] ` : '';
    console.error(`${prefix}Tool execution failed`, { error, context: options.context });
  }

  throw error;
}
