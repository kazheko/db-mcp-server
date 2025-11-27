import type { QueryAdapter, QueryRequest, QueryResultRow } from '../shared/queries.js';
import { defaultValidationPolicy } from './validation-policy.js';
import { withSqlValidation, formatValidationError } from '../shared/sql-validator.js';
import type { ValidationPolicy } from '../shared/sql-validator.js';

export const withMssqlValidation = (
  adapter: QueryAdapter<QueryRequest, QueryResultRow[]>,
  policy: ValidationPolicy = defaultValidationPolicy
): QueryAdapter<QueryRequest, QueryResultRow[]> => withSqlValidation(adapter, policy);

export { formatValidationError };
