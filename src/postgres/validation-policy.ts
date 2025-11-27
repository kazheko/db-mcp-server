import type { ValidationPattern, ValidationPolicy } from '../shared/sql-validator.js';

const deniedStatements: ValidationPolicy['deniedStatements'] = {
  DDL: ['create', 'alter', 'drop', 'truncate', 'comment on'],
  DML: ['insert', 'update', 'delete', 'merge'],
  TRANSACTION: ['begin', 'commit', 'rollback', 'savepoint', 'release savepoint'],
  PROCEDURE: ['call', 'do', 'perform', 'execute'],
  COPY: ['copy'],
  SECURITY: ['grant', 'revoke', 'set role', 'reset role'],
  MAINTENANCE: ['vacuum', 'analyze', 'cluster', 'reindex'],
  BATCH_SEPARATOR: [';'],
  LOCKING: ['lock table', 'unlock']
};

const deniedTokens: string[] = [
  'listen',
  'notify',
  'set transaction',
  'set session',
  'reset session',
  'alter system',
  'pg_terminate_backend'
];

const deniedPatterns: ValidationPattern[] = [
  {
    id: 'SELECT_INTO',
    expression: /select\s+.+\s+into\s+/i,
    message: 'SELECT ... INTO is not allowed'
  },
  {
    id: 'TEMP_TABLE_PATTERN',
    expression: /temporary\s+table|temp\s+table|create\s+temp/i,
    message: 'Temporary tables are not allowed'
  },
  {
    id: 'COPY_FROM',
    expression: /copy\s+.+\s+from/i,
    message: 'COPY statements are forbidden'
  }
];

const multiStatementGuards: ValidationPattern[] = [
  {
    id: 'MULTI_STATEMENT_SEMICOLON',
    expression: /;\s*\S+/,
    message: 'Only a single SQL statement may be executed per request'
  }
];

export const defaultPostgresValidationPolicy: ValidationPolicy = {
  id: 'postgres-metadata-only-v1',
  deniedStatements,
  deniedTokens,
  deniedPatterns,
  multiStatementGuards,
  messageTemplates: {
    DDL: 'DDL statements are forbidden for metadata queries',
    DML: 'DML statements are forbidden for metadata queries',
    TRANSACTION: 'Transaction control statements are forbidden',
    PROCEDURE: 'Stored procedures/functions are forbidden',
    COPY: 'COPY statements are forbidden',
    SECURITY: 'Security/role changes are forbidden',
    MAINTENANCE: 'Maintenance operations (VACUUM/ANALYZE/etc.) are forbidden',
    BATCH_SEPARATOR: 'Batch separators are forbidden',
    LOCKING: 'Explicit locking statements are forbidden',
    DENIED_TOKEN: 'Query contains a forbidden statement',
    MULTI_STATEMENT: 'Only a single SQL statement may be executed per request',
    MISSING_DATABASE: 'database field is required',
    MISSING_QUERY: 'query field is required'
  }
};
