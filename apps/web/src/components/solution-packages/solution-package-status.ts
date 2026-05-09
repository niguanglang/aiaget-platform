import type {
  SolutionPackageCustomerType,
  SolutionPackagePriority,
  SolutionPackageStage,
  SolutionPackageStatus,
} from '@aiaget/shared-types';

export const solutionCustomerTypes: SolutionPackageCustomerType[] = ['UNKNOWN', 'ANXIOUS', 'TASK_DRIVEN', 'CLEAR'];
export const solutionStages: SolutionPackageStage[] = ['DISCOVERY', 'SOLUTION_DESIGN', 'PILOT_DESIGN', 'DELIVERY_PLAN', 'EXPANSION'];
export const solutionStatuses: SolutionPackageStatus[] = ['DRAFT', 'REVIEWING', 'APPROVED', 'DELIVERING', 'CLOSED', 'ARCHIVED'];
export const solutionPriorities: SolutionPackagePriority[] = ['LOW', 'MEDIUM', 'HIGH'];

export function solutionCustomerTypeLabel(type: SolutionPackageCustomerType | string) {
  return {
    UNKNOWN: '未判断',
    ANXIOUS: '焦虑型',
    TASK_DRIVEN: '任务型',
    CLEAR: '清醒型',
  }[type] ?? type;
}

export function solutionStageLabel(stage: SolutionPackageStage | string) {
  return {
    DISCOVERY: '诊断',
    SOLUTION_DESIGN: '方案设计',
    PILOT_DESIGN: '试点设计',
    DELIVERY_PLAN: '交付计划',
    EXPANSION: '扩展复制',
  }[stage] ?? stage;
}

export function solutionStatusLabel(status: SolutionPackageStatus | string) {
  return {
    DRAFT: '草稿',
    REVIEWING: '评审中',
    APPROVED: '已通过',
    DELIVERING: '交付中',
    CLOSED: '已关闭',
    ARCHIVED: '已归档',
  }[status] ?? status;
}

export function solutionPriorityLabel(priority: SolutionPackagePriority | string) {
  return {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
  }[priority] ?? priority;
}

export function solutionStatusTone(status: SolutionPackageStatus | string) {
  if (status === 'APPROVED' || status === 'DELIVERING') return 'ready';
  if (status === 'CLOSED') return 'healthy';
  if (status === 'ARCHIVED') return 'muted';

  return 'planned';
}

export function solutionPriorityTone(priority: SolutionPackagePriority | string) {
  if (priority === 'HIGH') return 'degraded';
  if (priority === 'LOW') return 'muted';

  return 'planned';
}

export function solutionScoreTone(score: number) {
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
