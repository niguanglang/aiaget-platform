import type {
  SecurityPolicyDecision,
  SecurityPolicyEffect,
  SecurityPolicyStatus,
} from '@aiaget/shared-types';

export function securityPolicyStatusLabel(status: SecurityPolicyStatus) {
  const labels: Record<SecurityPolicyStatus, string> = {
    ACTIVE: '生效中',
    DISABLED: '已停用',
    DELETED: '已删除',
  };

  return labels[status] ?? status;
}

export function securityPolicyStatusTone(status: SecurityPolicyStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'planned';
  return 'unavailable';
}

export function securityPolicyEffectLabel(effect: SecurityPolicyEffect) {
  return effect === 'ALLOW' ? '允许' : '拒绝';
}

export function securityPolicyEffectTone(effect: SecurityPolicyEffect) {
  return effect === 'ALLOW' ? 'healthy' : 'degraded';
}

export function securityPolicyDecisionLabel(decision: SecurityPolicyDecision) {
  const labels: Record<SecurityPolicyDecision, string> = {
    ALLOW: '允许',
    DENY: '拒绝',
    NO_MATCH: '未命中',
  };

  return labels[decision] ?? decision;
}

export function securityPolicyDecisionTone(decision: SecurityPolicyDecision) {
  if (decision === 'ALLOW') return 'healthy';
  if (decision === 'DENY') return 'degraded';
  return 'planned';
}

export function formatDateTime(value: string | null) {
  if (!value) return '暂无';

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
