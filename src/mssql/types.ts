export type MssqlQueryRequest = {
  database: string;
  query: string;
  maxRows?: number;
};

export type QueryResultRow = Record<string, unknown>;

export interface QueryAdapter<TRequest, TResult> {
  execute(request: TRequest): Promise<TResult>;
}

export type MssqlConnectionConfig = {
  envVarName: string;
  rawConnectionString: string;
};

export type MssqlQueryResponse = {
  correlationId: string;
  database: string;
  queryResult: QueryResultRow[];
  startedAt: string;
  completedAt: string;
};
