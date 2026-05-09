import type {
  CustomerSuccessActionPriority,
  CustomerSuccessActionRiskLevel,
  CustomerSuccessActionStatus,
  CustomerSuccessActionType,
} from '@aiaget/shared-types';

export const customerSuccessActionTypes: CustomerSuccessActionType[] = [
  'MEETING',
  'ASSET_REUSE',
  'ROLLOUT',
  'TRAINING',
  'RENEWAL',
  'RISK_REVIEW',
  'FOLLOW_UP',
];
export const customerSuccessActionStatuses: CustomerSuccessActionStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED', 'ARCHIVED'];
export const customerSuccessActionPriorities: CustomerSuccessActionPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const customerSuccessActionRiskLevels: CustomerSuccessActionRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

export function customerSuccessActionTypeLabel(type: CustomerSuccessActionType | string) {
  return {
    MEETING: '客户会议',
    ASSET_REUSE: '资产复用',
    ROLLOUT: '推广落地',
    TRAINING: '培训赋能',
    RENEWAL: '续约推进',
    RISK_REVIEW: '风险复盘',
    FOLLOW_UP: '跟进行动',
  }[type] ?? type;
}

export function customerSuccessActionStatusLabel(status: CustomerSuccessActionStatus | string) {
  return {
    TODO: '待处理',
    IN_PROGRESS: '进行中',
    BLOCKED: '受阻',
    DONE: '已完成',
    CANCELLED: '已取消',
    ARCHIVED: '已归档',
  }[status] ?? status;
}

export function customerSuccessActionPriorityLabel(priority: CustomerSuccessActionPriority | string) {
  return {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
  }[priority] ?? priority;
}

export function customerSuccessActionRiskLabel(level: CustomerSuccessActionRiskLevel | string) {
  return {
    LOW: '低风险',
    MEDIUM: '中风险',
    HIGH: '高风险',
  }[level] ?? level;
}

export function customerSuccessActionStatusTone(status: CustomerSuccessActionStatus | string) {
  if (status === 'DONE') return 'healthy';
  if (status === 'IN_PROGRESS') return 'ready';
  if (status === 'BLOCKED') return 'degraded';
  if (status === 'CANCELLED' || status === 'ARCHIVED') return 'muted';

  return 'planned';
}

export function customerSuccessActionPriorityTone(priority: CustomerSuccessActionPriority | string) {
  if (priority === 'HIGH') return 'degraded';
  if (priority === 'MEDIUM') return 'ready';

  return 'planned';
}

export function customerSuccessActionRiskTone(level: CustomerSuccessActionRiskLevel | string) {
  if (level === 'HIGH') return 'degraded';
  if (level === 'MEDIUM') return 'ready';

  return 'healthy';
}

export function customerSuccessActionScoreTone(score: number) {
  if (score >= 85) return 'healthy';
  if (score >= 60) return 'ready';

  return 'degraded';
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
