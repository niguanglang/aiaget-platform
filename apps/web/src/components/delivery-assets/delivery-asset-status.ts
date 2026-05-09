import type { DeliveryAssetStatus, DeliveryAssetType, DeliveryAssetVisibility } from '@aiaget/shared-types';

export const deliveryAssetTypes: DeliveryAssetType[] = [
  'SOLUTION_TEMPLATE',
  'ACCEPTANCE_CHECKLIST',
  'RISK_CHECKLIST',
  'PROMPT_SOP',
  'CUSTOMER_CASE',
  'REPORT_ARCHIVE',
];
export const deliveryAssetStatuses: DeliveryAssetStatus[] = ['DRAFT', 'REVIEWING', 'PUBLISHED', 'RETIRED', 'ARCHIVED'];
export const deliveryAssetVisibilities: DeliveryAssetVisibility[] = ['PRIVATE', 'TEAM', 'TENANT', 'PUBLIC'];

export function deliveryAssetTypeLabel(type: DeliveryAssetType | string) {
  return {
    SOLUTION_TEMPLATE: '方案模板',
    ACCEPTANCE_CHECKLIST: '验收清单',
    RISK_CHECKLIST: '风险清单',
    PROMPT_SOP: 'Prompt SOP',
    CUSTOMER_CASE: '客户案例',
    REPORT_ARCHIVE: '报告归档',
  }[type] ?? type;
}

export function deliveryAssetStatusLabel(status: DeliveryAssetStatus | string) {
  return {
    DRAFT: '草稿',
    REVIEWING: '评审中',
    PUBLISHED: '已发布',
    RETIRED: '已退役',
    ARCHIVED: '已归档',
  }[status] ?? status;
}

export function deliveryAssetVisibilityLabel(visibility: DeliveryAssetVisibility | string) {
  return {
    PRIVATE: '私有',
    TEAM: '团队',
    TENANT: '租户',
    PUBLIC: '公开',
  }[visibility] ?? visibility;
}

export function deliveryAssetStatusTone(status: DeliveryAssetStatus | string) {
  if (status === 'PUBLISHED') return 'healthy';
  if (status === 'REVIEWING') return 'ready';
  if (status === 'RETIRED') return 'planned';
  if (status === 'ARCHIVED') return 'muted';

  return 'planned';
}

export function deliveryAssetVisibilityTone(visibility: DeliveryAssetVisibility | string) {
  if (visibility === 'PUBLIC') return 'degraded';
  if (visibility === 'TENANT') return 'ready';
  if (visibility === 'TEAM') return 'healthy';

  return 'planned';
}

export function deliveryAssetScoreTone(score: number) {
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
