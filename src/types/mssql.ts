export type MssqlQueryRequest = {
  database: string;
  query: string;
  maxRows?: number;
};

export type QueryResultRow = Record<string, unknown>;

export type MssqlQueryResponse = {
  correlationId: string;
  database: string;
  queryResult: QueryResultRow[];
  startedAt: string;
  completedAt: string;
};

export interface MssqlAdapter {
  execute(request: MssqlQueryRequest): Promise<QueryResultRow[]>;
}
