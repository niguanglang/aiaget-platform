import type { PromptStatus, PromptTestStatus } from '@aiaget/shared-types';

export function promptStatusTone(status: PromptStatus) {
  if (status === 'PUBLISHED') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  if (status === 'ARCHIVED') return 'unavailable';

  return 'ready';
}

export function promptTestStatusTone(status: PromptTestStatus) {
  return status === 'SUCCESS' ? 'healthy' : 'unavailable';
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
