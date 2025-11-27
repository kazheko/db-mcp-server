export interface ValidationPattern {
  id: string;
  expression: RegExp;
  message?: string;
}

export interface ValidationPolicy {
  id: string;
  deniedStatements: Record<string, string[]>;
  deniedTokens: string[];
  deniedPatterns: ValidationPattern[];
  multiStatementGuards: ValidationPattern[];
  messageTemplates: Record<string, string>;
}

const statementTokens: ValidationPolicy['deniedStatements'] = {
  DDL: ['create', 'alter', 'drop', 'truncate'],
  DML: ['insert', 'update', 'delete', 'merge'],
  TRANSACTION: ['begin tran', 'begin transaction', 'commit', 'rollback', 'save tran'],
  PROCEDURE: ['exec', 'execute', 'sp_', 'call'],
  BATCH_SEPARATOR: ['go'],
  SECURITY: ['grant', 'revoke'],
  BACKUP: ['backup', 'restore'],
  TEMP_TABLE: ['into #', 'into temp', '#']
};

const deniedTokens: string[] = [
  'use ',
  'dbcc',
  'trigger',
  'identity_insert',
  'open tran',
  'close tran'
];

const deniedPatterns: ValidationPattern[] = [
  {
    id: 'SELECT_INTO',
    expression: /select\s+.+\s+into\s+/i,
    message: 'SELECT ... INTO is not allowed'
  },
  {
    id: 'TEMP_TABLE_PATTERN',
    expression: /#\w+/i,
    message: 'Temporary tables are not allowed'
  },
  {
    id: 'PROCEDURE_EXEC',
    expression: /exec\s+\w+/i,
    message: 'Stored procedures are not allowed'
  }
];

const multiStatementGuards: ValidationPattern[] = [
  {
    id: 'MULTI_STATEMENT_SEMICOLON',
    expression: /;\s*\S+/, 
    message: 'Only a single SQL statement may be executed per request'
  },
  {
    id: 'MULTI_STATEMENT_GO',
    expression: /\bGO\b/i,
    message: 'Batch separators such as GO are forbidden'
  }
];

export const defaultValidationPolicy: ValidationPolicy = {
  id: 'mssql-blacklist-v1',
  deniedStatements: statementTokens,
  deniedTokens,
  deniedPatterns,
  multiStatementGuards,
  messageTemplates: {
    DDL: 'DDL statements (CREATE/ALTER/DROP/TRUNCATE) are forbidden',
    DML: 'DML statements (INSERT/UPDATE/DELETE/MERGE) are forbidden',
    TRANSACTION: 'Transaction control statements are forbidden',
    PROCEDURE: 'Stored procedures are forbidden',
    BATCH_SEPARATOR: 'Batch separators such as GO are forbidden',
    SECURITY: 'Privilege changes (GRANT/REVOKE) are not allowed',
    BACKUP: 'Backup and restore operations are not allowed',
    TEMP_TABLE: 'Temporary tables are not allowed',
    DENIED_TOKEN: 'Query contains a forbidden statement',
    MULTI_STATEMENT: 'Only a single SQL statement may be executed per request',
    MISSING_DATABASE: 'database field is required',
    MISSING_QUERY: 'query field is required'
  }
};
