import type { QueryAdapter, QueryRequest, QueryResultRow } from '../shared/queries.js';
import { withSqlValidation, formatValidationError } from '../shared/sql-validator.js';
import type { ValidationPolicy } from '../shared/sql-validator.js';
import { defaultPostgresValidationPolicy } from './validation-policy.js';

const metadataAllowPatterns = [
  /pg_catalog/gi,
  /information_schema/gi,
  /pg_class/gi,
  /pg_indexes/gi,
  /pg_stat/gi,
  /pg_namespace/gi
];

const ensureMetadataScope = (query: string) => {
  const matches = metadataAllowPatterns.some((pattern) => pattern.test(query));
  metadataAllowPatterns.forEach((pattern) => pattern.lastIndex = 0);
  if (!matches) {
    throw new Error(
      formatValidationError(
        query,
        'Only metadata queries targeting pg_catalog/information_schema objects are permitted'
      )
    );
  }
};

export const withPostgresValidation = (
  adapter: QueryAdapter<QueryRequest, QueryResultRow[]>,
  policy: ValidationPolicy = defaultPostgresValidationPolicy
): QueryAdapter<QueryRequest, QueryResultRow[]> => {
  const validated = withSqlValidation(adapter, policy);
  return {
    async execute(request) {
      ensureMetadataScope(request.query ?? '');
      return validated.execute(request);
    }
  };
};
