import type {
  CustomerAssessmentDecisionStage,
  CustomerAssessmentStatus,
  CustomerAssessmentType,
} from '@aiaget/shared-types';

export function customerTypeLabel(type: CustomerAssessmentType | string) {
  const labels: Record<string, string> = {
    UNKNOWN: '未判断',
    ANXIOUS: '焦虑型',
    TASK_DRIVEN: '任务型',
    CLEAR: '清醒型',
  };

  return labels[type] ?? type;
}

export function decisionStageLabel(stage: CustomerAssessmentDecisionStage | string) {
  const labels: Record<string, string> = {
    LEARNING: '学习',
    EVALUATION: '评估',
    PROCUREMENT: '采购',
    PILOT: '试点',
    DELIVERY: '交付',
  };

  return labels[stage] ?? stage;
}

export function assessmentStatusLabel(status: CustomerAssessmentStatus | string) {
  const labels: Record<string, string> = {
    DISCOVERY: '发现中',
    QUALIFIED: '已确认',
    NURTURING: '培育中',
    WON: '已赢单',
    LOST: '已流失',
    ARCHIVED: '已归档',
  };

  return labels[status] ?? status;
}

export function assessmentStatusTone(status: CustomerAssessmentStatus | string) {
  if (status === 'QUALIFIED' || status === 'WON') return 'healthy';
  if (status === 'ARCHIVED' || status === 'LOST') return 'degraded';
  if (status === 'NURTURING') return 'planned';

  return 'ready';
}

export function readinessTone(score: number) {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'ready';
  if (score >= 40) return 'planned';

  return 'degraded';
}

export function readinessLabel(score: number) {
  if (score >= 80) return '高准备度';
  if (score >= 60) return '中准备度';
  if (score >= 40) return '低准备度';

  return '需培育';
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
