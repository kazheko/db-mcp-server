export type MssqlQueryRequest = {
  database: string;
  query: string;
  maxRows?: number;
};

export type MssqlRecordColumn = {
  name: string;
  type: string;
  nullable?: boolean;
};

export type MssqlRecordRow = string[];

export type MssqlRecordset = {
  columns: MssqlRecordColumn[];
  rows: MssqlRecordRow[];
};

export type MssqlQueryResponse = {
  correlationId: string;
  database: string;
  recordset: MssqlRecordset[];
  startedAt: string;
  completedAt: string;
};

export interface MssqlAdapter {
  execute(request: MssqlQueryRequest): Promise<MssqlRecordset[]>;
}

export type ToolMetadata<TInput, TOutput> = {
  name: string;
  title: string;
  description: string;
  inputSchema: TInput;
  outputSchema: TOutput;
};
