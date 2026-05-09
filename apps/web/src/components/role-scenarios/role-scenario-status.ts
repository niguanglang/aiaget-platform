import type { RoleScenarioPriority, RoleScenarioStatus, RoleScenarioType } from '@aiaget/shared-types';

export const scenarioTypes: RoleScenarioType[] = ['SALES', 'SERVICE', 'OPERATIONS', 'DESIGN', 'TRAINING', 'MANAGEMENT', 'CUSTOM'];
export const scenarioStatuses: RoleScenarioStatus[] = ['DRAFT', 'READY', 'PILOTING', 'ACTIVE', 'ARCHIVED'];
export const scenarioPriorities: RoleScenarioPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

export function scenarioTypeLabel(type: RoleScenarioType | string) {
  return {
    SALES: '售前销售',
    SERVICE: '客户服务',
    OPERATIONS: '运营运维',
    DESIGN: '设计研发',
    TRAINING: '培训赋能',
    MANAGEMENT: '经营管理',
    CUSTOM: '自定义',
  }[type] ?? type;
}

export function scenarioStatusLabel(status: RoleScenarioStatus | string) {
  return {
    DRAFT: '草稿',
    READY: '就绪',
    PILOTING: '试点中',
    ACTIVE: '已启用',
    ARCHIVED: '已归档',
  }[status] ?? status;
}

export function scenarioPriorityLabel(priority: RoleScenarioPriority | string) {
  return {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
  }[priority] ?? priority;
}

export function scenarioStatusTone(status: RoleScenarioStatus | string) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'READY' || status === 'PILOTING') return 'ready';
  if (status === 'ARCHIVED') return 'muted';

  return 'planned';
}

export function scenarioPriorityTone(priority: RoleScenarioPriority | string) {
  if (priority === 'HIGH') return 'degraded';
  if (priority === 'LOW') return 'muted';

  return 'planned';
}

export function impactTone(score: number) {
  if (score >= 85) return 'healthy';
  if (score >= 60) return 'ready';

  return 'planned';
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
