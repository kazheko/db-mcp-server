export type QueryResultRow = Record<string, unknown>;

export type QueryRequest = {
  database: string;
  query: string;
  maxRows?: number;
};

export type QueryResponseEnvelope = {
  correlationId: string;
  database: string;
  queryResult: QueryResultRow[];
  startedAt: string;
  completedAt: string;
  rowCount?: number;
};

export interface QueryAdapter<TRequest = QueryRequest, TResult = QueryResponseEnvelope> {
  execute(request: TRequest): Promise<TResult>;
}
