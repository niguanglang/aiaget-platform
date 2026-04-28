import type { ModelCallStatus, ModelProviderStatus } from '@aiaget/shared-types';

export function modelStatusTone(status: ModelProviderStatus | ModelCallStatus) {
  if (status === 'ACTIVE' || status === 'SUCCESS') return 'healthy';
  if (status === 'DISABLED') return 'degraded';

  return 'unavailable';
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function formatMoney(value: number) {
  return `$${value.toFixed(6)}`;
}
