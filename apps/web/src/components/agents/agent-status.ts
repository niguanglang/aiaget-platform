import type { AgentStatus } from '@aiaget/shared-types';

const agentStatusLabels: Record<AgentStatus, string> = {
  DRAFT: '草稿',
  TESTING: '测试中',
  PENDING: '待发布',
  PUBLISHED: '已发布',
  DISABLED: '已停用',
  ARCHIVED: '已归档',
};

export function agentStatusTone(status: AgentStatus) {
  if (status === 'PUBLISHED') return 'healthy';
  if (status === 'TESTING') return 'mock';
  if (status === 'PENDING') return 'degraded';
  if (status === 'DISABLED') return 'unavailable';
  if (status === 'ARCHIVED') return 'planned';

  return 'ready';
}

export function agentStatusLabel(status: AgentStatus) {
  return agentStatusLabels[status] ?? status;
}

export function agentVersionStatusLabel(status: string) {
  return agentStatusLabels[status as AgentStatus] ?? status;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}
