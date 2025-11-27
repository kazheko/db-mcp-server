export { createPostgresAdapter } from './adapter.js';
export { withPostgresValidation } from './validator.js';
export { defaultPostgresValidationPolicy } from './validation-policy.js';
export { loadPostgresConnectionConfig } from '../adapters/postgres-config.js';

export type {
  QueryAdapter as PostgresQueryAdapter,
  QueryRequest as PostgresQueryRequest,
  QueryResultRow as PostgresQueryResultRow,
  QueryResponseEnvelope as PostgresQueryResponse
} from '../shared/queries.js';
