import type {
  CustomerSuccessPlanHealthLevel,
  CustomerSuccessPlanPriority,
  CustomerSuccessPlanStage,
  CustomerSuccessPlanStatus,
} from '@aiaget/shared-types';

export const customerSuccessPlanStages: CustomerSuccessPlanStage[] = [
  'DISCOVERY',
  'EXPANSION_DESIGN',
  'PILOT_ROLLOUT',
  'RENEWAL_PREP',
  'CLOSED',
];
export const customerSuccessPlanStatuses: CustomerSuccessPlanStatus[] = ['DRAFT', 'ACTIVE', 'BLOCKED', 'COMPLETED', 'ARCHIVED'];
export const customerSuccessPlanPriorities: CustomerSuccessPlanPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const customerSuccessPlanHealthLevels: CustomerSuccessPlanHealthLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

export function customerSuccessPlanStageLabel(stage: CustomerSuccessPlanStage | string) {
  return {
    DISCOVERY: '机会发现',
    EXPANSION_DESIGN: '扩展设计',
    PILOT_ROLLOUT: '试点推广',
    RENEWAL_PREP: '续约准备',
    CLOSED: '已关闭',
  }[stage] ?? stage;
}

export function customerSuccessPlanStatusLabel(status: CustomerSuccessPlanStatus | string) {
  return {
    DRAFT: '草稿',
    ACTIVE: '进行中',
    BLOCKED: '受阻',
    COMPLETED: '已完成',
    ARCHIVED: '已归档',
  }[status] ?? status;
}

export function customerSuccessPlanPriorityLabel(priority: CustomerSuccessPlanPriority | string) {
  return {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
  }[priority] ?? priority;
}

export function customerSuccessPlanHealthLabel(level: CustomerSuccessPlanHealthLevel | string) {
  return {
    LOW: '低健康',
    MEDIUM: '中健康',
    HIGH: '高健康',
  }[level] ?? level;
}

export function customerSuccessPlanStatusTone(status: CustomerSuccessPlanStatus | string) {
  if (status === 'COMPLETED') return 'healthy';
  if (status === 'ACTIVE') return 'ready';
  if (status === 'BLOCKED') return 'degraded';
  if (status === 'ARCHIVED') return 'muted';

  return 'planned';
}

export function customerSuccessPlanPriorityTone(priority: CustomerSuccessPlanPriority | string) {
  if (priority === 'HIGH') return 'degraded';
  if (priority === 'MEDIUM') return 'ready';

  return 'planned';
}

export function customerSuccessPlanHealthTone(level: CustomerSuccessPlanHealthLevel | string) {
  if (level === 'HIGH') return 'healthy';
  if (level === 'MEDIUM') return 'ready';

  return 'degraded';
}

export function customerSuccessPlanScoreTone(score: number) {
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
