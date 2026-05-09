import type {
  DeliveryReviewResult,
  DeliveryReviewSatisfactionLevel,
  DeliveryReviewStage,
  DeliveryReviewStatus,
} from '@aiaget/shared-types';

export const deliveryReviewStages: DeliveryReviewStage[] = [
  'PILOT_ACCEPTANCE',
  'FINAL_ACCEPTANCE',
  'EXPANSION_REVIEW',
  'RENEWAL_REVIEW',
];
export const deliveryReviewResults: DeliveryReviewResult[] = ['PASSED', 'PARTIAL', 'FAILED', 'DEFERRED'];
export const deliveryReviewStatuses: DeliveryReviewStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'COMPLETED',
  'ACTION_REQUIRED',
  'ARCHIVED',
];
export const deliveryReviewSatisfactionLevels: DeliveryReviewSatisfactionLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

export function deliveryReviewStageLabel(stage: DeliveryReviewStage | string) {
  return {
    PILOT_ACCEPTANCE: '试点验收',
    FINAL_ACCEPTANCE: '最终验收',
    EXPANSION_REVIEW: '扩展复盘',
    RENEWAL_REVIEW: '续约复盘',
  }[stage] ?? stage;
}

export function deliveryReviewResultLabel(result: DeliveryReviewResult | string) {
  return {
    PASSED: '已通过',
    PARTIAL: '部分通过',
    FAILED: '未通过',
    DEFERRED: '已延期',
  }[result] ?? result;
}

export function deliveryReviewStatusLabel(status: DeliveryReviewStatus | string) {
  return {
    DRAFT: '草稿',
    IN_REVIEW: '复盘中',
    COMPLETED: '已完成',
    ACTION_REQUIRED: '待改进',
    ARCHIVED: '已归档',
  }[status] ?? status;
}

export function deliveryReviewSatisfactionLabel(level: DeliveryReviewSatisfactionLevel | string) {
  return {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    VERY_HIGH: '很高',
  }[level] ?? level;
}

export function deliveryReviewResultTone(result: DeliveryReviewResult | string) {
  if (result === 'PASSED') return 'healthy';
  if (result === 'PARTIAL') return 'ready';
  if (result === 'FAILED') return 'degraded';

  return 'planned';
}

export function deliveryReviewStatusTone(status: DeliveryReviewStatus | string) {
  if (status === 'COMPLETED') return 'healthy';
  if (status === 'ACTION_REQUIRED') return 'degraded';
  if (status === 'ARCHIVED') return 'muted';
  if (status === 'IN_REVIEW') return 'ready';

  return 'planned';
}

export function deliveryReviewSatisfactionTone(level: DeliveryReviewSatisfactionLevel | string) {
  if (level === 'VERY_HIGH' || level === 'HIGH') return 'healthy';
  if (level === 'LOW') return 'degraded';

  return 'planned';
}

export function deliveryReviewScoreTone(score: number) {
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
