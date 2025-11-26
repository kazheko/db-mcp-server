import type {
  MssqlQueryRequest,
  QueryAdapter,
  QueryResultRow
} from '../../types/mssql.js';
import {
  defaultValidationPolicy,
  type ValidationPolicy,
  type ValidationPattern
} from './validation-policy.js';

export class MssqlValidator
  implements QueryAdapter<MssqlQueryRequest, QueryResultRow[]>
{
  constructor(
    private readonly adapter: QueryAdapter<MssqlQueryRequest, QueryResultRow[]>,
    private readonly policy: ValidationPolicy = defaultValidationPolicy
  ) {}

  async execute(request: MssqlQueryRequest) {
    validateRequest(request, this.policy);
    return this.adapter.execute(request);
  }
}

export const formatValidationError = (query: string, reason: string) => {
  const normalized = collapseWhitespace(query);
  const snippet = normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
  const display = snippet || '[empty query]';
  return `**Validation Error** ~~${display}~~ — ${reason}`;
};

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const testPattern = (pattern: ValidationPattern, value: string) => {
  const flags = pattern.expression.flags.replace('g', '');
  const regex = new RegExp(pattern.expression.source, flags);
  return regex.test(value);
};

const throwValidationError = (query: string, reason: string) => {
  throw new Error(formatValidationError(query, reason));
};

const ensureSingleStatement = (query: string, policy: ValidationPolicy) => {
  const trimmed = query.trim();
  const withoutTrailingSemicolon = trimmed.replace(/;+\s*$/, '');
  for (const guard of policy.multiStatementGuards) {
    if (testPattern(guard, withoutTrailingSemicolon)) {
      const message = guard.message ?? policy.messageTemplates.MULTI_STATEMENT;
      throwValidationError(query, message ?? 'Only a single SQL statement may be executed per request');
    }
  }
};

const containsToken = (query: string, collapsed: string, token: string) => {
  const normalized = token.toLowerCase().trim();
  if (!normalized) {
    return false;
  }

  if (normalized.includes('#') || normalized.includes('_')) {
    return query.toLowerCase().includes(normalized);
  }

  if (normalized.includes(' ')) {
    return collapsed.includes(normalized.replace(/\s+/g, ' '));
  }

  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(query);
};

const checkStatementsAndTokens = (query: string, policy: ValidationPolicy) => {
  const collapsed = collapseWhitespace(query.toLowerCase());
  const lower = query.toLowerCase();

  for (const [statementId, tokens] of Object.entries(policy.deniedStatements)) {
    for (const token of tokens) {
      if (containsToken(lower, collapsed, token)) {
        const message =
          policy.messageTemplates[statementId] ?? policy.messageTemplates.DENIED_TOKEN ?? 'Query contains a forbidden statement';
        throwValidationError(query, message);
      }
    }
  }

  for (const token of policy.deniedTokens) {
    if (containsToken(lower, collapsed, token)) {
      const message = policy.messageTemplates.DENIED_TOKEN ?? 'Query contains a forbidden statement';
      throwValidationError(query, message);
    }
  }
};

const checkPatterns = (query: string, policy: ValidationPolicy) => {
  for (const pattern of policy.deniedPatterns) {
    if (testPattern(pattern, query)) {
      const message = pattern.message ?? policy.messageTemplates.DENIED_TOKEN ?? 'Query contains a forbidden pattern';
      throwValidationError(query, message);
    }
  }
};

const validateRequest = (request: MssqlQueryRequest, policy: ValidationPolicy) => {
  if (!request.database?.trim()) {
    throwValidationError(request.query ?? '', policy.messageTemplates.MISSING_DATABASE ?? 'database field is required');
  }
  if (!request.query?.trim()) {
    throwValidationError(request.query ?? '', policy.messageTemplates.MISSING_QUERY ?? 'query field is required');
  }

  const sql = request.query;
  ensureSingleStatement(sql, policy);
  checkStatementsAndTokens(sql, policy);
  checkPatterns(sql, policy);
};

export const ACTIVE_POLICY = defaultValidationPolicy;
