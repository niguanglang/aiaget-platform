import type { AuditEventStatus, AuditEventSourceType } from '@aiaget/shared-types';

const sourceLabels: Record<AuditEventSourceType, string> = {
  login: '登录',
  operation: '操作',
  approval_audit: '审批审计',
};

const statusLabels: Record<AuditEventStatus, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  DEGRADED: '降级',
};

export function auditStatusTone(status: AuditEventStatus) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'DEGRADED') return 'degraded';
  return 'unavailable';
}

export function auditSourceLabel(source: AuditEventSourceType) {
  return sourceLabels[source] ?? source;
}

export function auditStatusLabel(status: AuditEventStatus) {
  return statusLabels[status] ?? status;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
