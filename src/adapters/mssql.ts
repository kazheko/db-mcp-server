import type {
  MssqlAdapter,
  MssqlQueryRequest,
  QueryResultRow
} from '../types/mssql.js';

const DEFAULT_ROW_COUNT = 3;
const ERROR_TOKENS = ['RAISEERROR', 'THROW', 'SCRIPT_TIMEOUT'];

type StubTemplate = {
  columns: { name: string; type: string; nullable?: boolean }[];
  rows: string[][];
};

const templates: Record<string, StubTemplate> = {
  employees: {
    columns: [
      { name: 'EmployeeId', type: 'int' },
      { name: 'FullName', type: 'nvarchar' },
      { name: 'Title', type: 'nvarchar', nullable: true }
    ],
    rows: [
      ['1001', 'Ada Lovelace', 'Principal Engineer'],
      ['1002', 'Grace Hopper', 'Distinguished Scientist'],
      ['1003', 'Radia Perlman', 'Fellow'],
      ['1004', 'Margaret Hamilton', 'Director of R&D']
    ]
  },
  schemas: {
    columns: [
      { name: 'SchemaName', type: 'nvarchar' },
      { name: 'ObjectCount', type: 'int' }
    ],
    rows: [
      ['dbo', '142'],
      ['hr', '38'],
      ['sales', '56'],
      ['audit', '17']
    ]
  },
  default: {
    columns: [
      { name: 'ColumnName', type: 'nvarchar' },
      { name: 'DataType', type: 'nvarchar' }
    ],
    rows: [
      ['SampleColumn', 'nvarchar'],
      ['SampleValue', 'int'],
      ['SampleFlag', 'bit'],
      ['SampleCreatedAt', 'datetime2']
    ]
  }
};

function pickTemplate(query: string): StubTemplate {
  const matched = Object.entries(templates).find(([key]) =>
    key !== 'default' && query.toLowerCase().includes(key)
  );
  return matched?.[1] ?? templates.default;
}

export class StubMssqlAdapter implements MssqlAdapter {
  async execute(request: MssqlQueryRequest): Promise<QueryResultRow[]> {
    this.throwIfErrorScenario(request.query);
    const template = pickTemplate(request.query);
    const requestedRows = this.getRequestedRowCount(request.maxRows);
    const rows = this.buildRows(template.rows, requestedRows);

    return rows.map((row) => this.rowToObject(template.columns, row));
  }

  private buildRows(baseRows: string[][], maxRows: number): string[][] {
    const result: string[][] = [];
    for (let i = 0; i < maxRows; i += 1) {
      const sourceRow = baseRows[i % baseRows.length];
      result.push([...sourceRow]);
    }
    return result;
  }

  private rowToObject(
    columns: StubTemplate['columns'],
    row: string[]
  ): QueryResultRow {
    return columns.reduce<QueryResultRow>((acc, column, index) => {
      acc[column.name] = row[index] ?? null;
      return acc;
    }, {});
  }

  private getRequestedRowCount(maxRows?: number): number {
    if (typeof maxRows === 'number' && Number.isFinite(maxRows) && maxRows > 0) {
      return Math.min(Math.floor(maxRows), 50);
    }
    return DEFAULT_ROW_COUNT;
  }

  private throwIfErrorScenario(query: string): void {
    const normalized = query.toUpperCase();
    if (ERROR_TOKENS.some((token) => normalized.includes(token))) {
      throw new Error('Script timeout simulated by MSSQL adapter stub');
    }
  }
}
