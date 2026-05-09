import type {
  CustomerSuccessOpportunityConfidenceLevel,
  CustomerSuccessOpportunityPriority,
  CustomerSuccessOpportunityRiskLevel,
  CustomerSuccessOpportunityStage,
  CustomerSuccessOpportunityStatus,
  CustomerSuccessOpportunityType,
} from '@aiaget/shared-types';

export const customerSuccessOpportunityTypes: CustomerSuccessOpportunityType[] = [
  'RENEWAL',
  'EXPANSION',
  'UPSELL',
  'CROSS_SELL',
  'RISK_SAVE',
];
export const customerSuccessOpportunityStages: CustomerSuccessOpportunityStage[] = [
  'DISCOVERY',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'ARCHIVED',
];
export const customerSuccessOpportunityStatuses: CustomerSuccessOpportunityStatus[] = ['OPEN', 'AT_RISK', 'WON', 'LOST', 'ARCHIVED'];
export const customerSuccessOpportunityPriorities: CustomerSuccessOpportunityPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const customerSuccessOpportunityConfidenceLevels: CustomerSuccessOpportunityConfidenceLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
export const customerSuccessOpportunityRiskLevels: CustomerSuccessOpportunityRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

export function customerSuccessOpportunityTypeLabel(type: CustomerSuccessOpportunityType | string) {
  return {
    RENEWAL: '续约',
    EXPANSION: '扩展',
    UPSELL: '增购',
    CROSS_SELL: '交叉销售',
    RISK_SAVE: '风险挽留',
  }[type] ?? type;
}

export function customerSuccessOpportunityStageLabel(stage: CustomerSuccessOpportunityStage | string) {
  return {
    DISCOVERY: '机会发现',
    QUALIFICATION: '机会确认',
    PROPOSAL: '方案报价',
    NEGOTIATION: '商务谈判',
    WON: '已赢单',
    LOST: '已输单',
    ARCHIVED: '已归档',
  }[stage] ?? stage;
}

export function customerSuccessOpportunityStatusLabel(status: CustomerSuccessOpportunityStatus | string) {
  return {
    OPEN: '打开',
    AT_RISK: '风险中',
    WON: '赢单',
    LOST: '输单',
    ARCHIVED: '已归档',
  }[status] ?? status;
}

export function customerSuccessOpportunityPriorityLabel(priority: CustomerSuccessOpportunityPriority | string) {
  return {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
  }[priority] ?? priority;
}

export function customerSuccessOpportunityConfidenceLabel(level: CustomerSuccessOpportunityConfidenceLevel | string) {
  return {
    LOW: '低信心',
    MEDIUM: '中信心',
    HIGH: '高信心',
  }[level] ?? level;
}

export function customerSuccessOpportunityRiskLabel(level: CustomerSuccessOpportunityRiskLevel | string) {
  return {
    LOW: '低风险',
    MEDIUM: '中风险',
    HIGH: '高风险',
  }[level] ?? level;
}

export function customerSuccessOpportunityStageTone(stage: CustomerSuccessOpportunityStage | string) {
  if (stage === 'WON') return 'healthy';
  if (stage === 'NEGOTIATION' || stage === 'PROPOSAL') return 'ready';
  if (stage === 'LOST') return 'degraded';
  if (stage === 'ARCHIVED') return 'muted';

  return 'planned';
}

export function customerSuccessOpportunityStatusTone(status: CustomerSuccessOpportunityStatus | string) {
  if (status === 'WON') return 'healthy';
  if (status === 'OPEN') return 'ready';
  if (status === 'AT_RISK' || status === 'LOST') return 'degraded';
  if (status === 'ARCHIVED') return 'muted';

  return 'planned';
}

export function customerSuccessOpportunityPriorityTone(priority: CustomerSuccessOpportunityPriority | string) {
  if (priority === 'HIGH') return 'degraded';
  if (priority === 'MEDIUM') return 'ready';

  return 'planned';
}

export function customerSuccessOpportunityConfidenceTone(level: CustomerSuccessOpportunityConfidenceLevel | string) {
  if (level === 'HIGH') return 'healthy';
  if (level === 'MEDIUM') return 'ready';

  return 'planned';
}

export function customerSuccessOpportunityRiskTone(level: CustomerSuccessOpportunityRiskLevel | string) {
  if (level === 'HIGH') return 'degraded';
  if (level === 'MEDIUM') return 'ready';

  return 'healthy';
}

export function customerSuccessOpportunityScoreTone(score: number) {
  if (score >= 85) return 'healthy';
  if (score >= 60) return 'ready';

  return 'degraded';
}

export function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN', {
    currency: 'CNY',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value ?? 0);
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
