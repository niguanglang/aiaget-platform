import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  SecurityPolicyCondition,
  SecurityPolicyDecision,
  SecurityPolicyEffect,
} from '@aiaget/shared-types';

import { SECURITY_POLICY_OPERATORS } from './dto/list-security-policies.dto';

export interface EvaluationInput {
  subject: Record<string, unknown>;
  resource: Record<string, unknown>;
  action: string;
  actionAliases?: string[];
  context?: Record<string, unknown> | null;
}

export interface PolicyLike {
  id: string;
  code: string;
  name: string;
  effect: string;
  resourceType: string;
  action: string;
  priority: number;
  conditions: Prisma.JsonValue | null;
}

export interface EvaluationResult {
  decision: SecurityPolicyDecision;
  matchedPolicy: PolicyLike | null;
  reason: string;
  checkedCount: number;
}

interface NormalizedCondition extends SecurityPolicyCondition {}

export function evaluateSecurityPolicies(policies: PolicyLike[], input: EvaluationInput): EvaluationResult {
  const resourceType = normalizeString(input.resource.type ?? input.resource.resource_type ?? input.resource.resourceType);
  const actions = Array.from(new Set([input.action, ...(input.actionAliases ?? [])].map(normalizeString).filter((item): item is string => Boolean(item))));
  const ordered = [...policies].sort((left, right) => {
    if (right.priority !== left.priority) return right.priority - left.priority;
    if (left.effect !== right.effect) return left.effect === 'DENY' ? -1 : 1;
    return left.code.localeCompare(right.code);
  });

  let checkedCount = 0;
  let allowMatch: PolicyLike | null = null;

  for (const policy of ordered) {
    checkedCount += 1;

    if (!matchesText(policy.resourceType, resourceType)) continue;
    if (!actions.some((action) => matchesText(policy.action, action))) continue;

    const conditionResult = conditionsMatch(policy.conditions, input);
    if (!conditionResult.matched) continue;

    if (policy.effect === 'DENY') {
      return {
        decision: 'DENY',
        matchedPolicy: policy,
        reason: `命中拒绝策略 ${policy.name}。`,
        checkedCount,
      };
    }

    allowMatch = policy;
    break;
  }

  if (allowMatch) {
    return {
      decision: 'ALLOW',
      matchedPolicy: allowMatch,
      reason: `命中允许策略 ${allowMatch.name}。`,
      checkedCount,
    };
  }

  return {
    decision: 'NO_MATCH',
    matchedPolicy: null,
    reason: '未命中任何生效策略，保持默认无匹配结果。',
    checkedCount,
  };
}

export function normalizeConditions(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null) {
    return value === null ? Prisma.JsonNull : [];
  }

  if (!isPlainObject(value) && !Array.isArray(value)) {
    throw new BadRequestException('conditions must be a JSON object or array');
  }

  const conditions = extractConditions(value);
  conditions.forEach(validateCondition);

  return value as Prisma.InputJsonValue;
}

function conditionsMatch(value: Prisma.JsonValue | null, input: EvaluationInput) {
  const conditions = extractConditions(value);
  if (conditions.length === 0) {
    return { matched: true };
  }

  return {
    matched: conditions.every((condition) => matchCondition(condition, input)),
  };
}

function extractConditions(value: unknown): NormalizedCondition[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as NormalizedCondition[];
  if (!isPlainObject(value)) return [];

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.all)) return record.all as NormalizedCondition[];
  if (Array.isArray(record.conditions)) return record.conditions as NormalizedCondition[];
  if (record.path || record.field) return [record as unknown as NormalizedCondition];

  return [];
}

function validateCondition(condition: NormalizedCondition) {
  if (!condition || typeof condition !== 'object') {
    throw new BadRequestException('Each condition must be a JSON object');
  }

  if (typeof condition.path !== 'string' || !condition.path.trim()) {
    throw new BadRequestException('Each condition requires a non-empty path');
  }

  if (!SECURITY_POLICY_OPERATORS.includes(condition.operator)) {
    throw new BadRequestException(`Unsupported condition operator: ${condition.operator}`);
  }
}

function matchCondition(condition: NormalizedCondition, input: EvaluationInput) {
  const actual = getByPath(
    {
      subject: input.subject,
      resource: input.resource,
      context: input.context ?? {},
    },
    condition.path,
  );

  switch (condition.operator) {
    case 'eq':
      return looseEqual(actual, condition.value);
    case 'neq':
      return !looseEqual(actual, condition.value);
    case 'in':
      return Array.isArray(condition.value) && condition.value.some((item) => looseEqual(actual, item));
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.some((item) => looseEqual(actual, item));
    case 'contains':
      if (Array.isArray(actual)) return actual.some((item) => looseEqual(item, condition.value));
      return typeof actual === 'string' && typeof condition.value === 'string'
        ? actual.includes(condition.value)
        : false;
    case 'exists': {
      const expected = condition.value === undefined ? true : Boolean(condition.value);
      return expected ? actual !== undefined && actual !== null : actual === undefined || actual === null;
    }
    default:
      return false;
  }
}

function getByPath(root: Record<string, unknown>, path: string) {
  const parts = path.split('.').filter(Boolean);
  let current: unknown = root;

  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function matchesText(pattern: string, value: string | null) {
  if (pattern === '*') return true;
  if (!value) return false;
  return pattern.toLowerCase() === value.toLowerCase();
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function looseEqual(left: unknown, right: unknown) {
  if (left === right) return true;
  if (left === null || left === undefined || right === null || right === undefined) return false;
  return String(left) === String(right);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizePolicyEffect(effect: string): SecurityPolicyEffect {
  return effect === 'ALLOW' ? 'ALLOW' : 'DENY';
}
