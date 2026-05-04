import type {
  PublishChannelHealthStatus,
  PublishChannelStatus,
  PublishChannelType,
} from '@aiaget/shared-types';

export const publishChannelTypes: PublishChannelType[] = [
  'WEB_WIDGET',
  'OPEN_API',
  'WECHAT_WORK',
  'DINGTALK',
  'FEISHU',
  'SLACK',
  'CUSTOM_WEBHOOK',
];

export const publishChannelStatuses: PublishChannelStatus[] = [
  'DRAFT',
  'ACTIVE',
  'DISABLED',
  'ERROR',
  'ARCHIVED',
];

export const publishChannelHealthStatuses: PublishChannelHealthStatus[] = [
  'UNKNOWN',
  'HEALTHY',
  'DEGRADED',
  'UNAVAILABLE',
];

export function publishChannelTypeLabel(type: PublishChannelType) {
  const labels: Record<PublishChannelType, string> = {
    WEB_WIDGET: 'Web 组件',
    OPEN_API: '开放 API',
    WECHAT_WORK: '企业微信',
    DINGTALK: '钉钉',
    FEISHU: '飞书',
    SLACK: 'Slack',
    CUSTOM_WEBHOOK: '自定义 Webhook',
  };

  return labels[type] ?? type;
}

export function publishChannelStatusLabel(status: PublishChannelStatus) {
  const labels: Record<PublishChannelStatus, string> = {
    DRAFT: '草稿',
    ACTIVE: '已启用',
    DISABLED: '已停用',
    ERROR: '异常',
    ARCHIVED: '已归档',
  };

  return labels[status] ?? status;
}

export function publishChannelStatusTone(status: PublishChannelStatus) {
  if (status === 'ACTIVE') return 'healthy' as const;
  if (status === 'ERROR') return 'unavailable' as const;
  if (status === 'DRAFT') return 'mock' as const;
  if (status === 'DISABLED' || status === 'ARCHIVED') return 'planned' as const;

  return 'ready' as const;
}

export function publishChannelHealthLabel(status: PublishChannelHealthStatus) {
  const labels: Record<PublishChannelHealthStatus, string> = {
    UNKNOWN: '未检查',
    HEALTHY: '健康',
    DEGRADED: '降级',
    UNAVAILABLE: '不可用',
  };

  return labels[status] ?? status;
}

export function publishChannelHealthTone(status: PublishChannelHealthStatus) {
  if (status === 'HEALTHY') return 'healthy' as const;
  if (status === 'DEGRADED') return 'degraded' as const;
  if (status === 'UNAVAILABLE') return 'unavailable' as const;

  return 'planned' as const;
}

export function formatChannelDateTime(value: string | null | undefined) {
  if (!value) return '暂无';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
