import type { AgentStatus } from '@aiaget/shared-types';

export function agentStatusTone(status: AgentStatus) {
  if (status === 'PUBLISHED') return 'healthy';
  if (status === 'TESTING') return 'mock';
  if (status === 'PENDING') return 'degraded';
  if (status === 'DISABLED') return 'unavailable';
  if (status === 'ARCHIVED') return 'planned';

  return 'ready';
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}
