import type { ToolApprovalStatus, ToolCallStatus, ToolCallTriggerSource } from '@aiaget/shared-types';

const approvalStatusLabels: Record<ToolApprovalStatus, string> = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
};

const executionStatusLabels: Record<ToolCallStatus, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  APPROVAL_REQUIRED: '等待审批',
  REJECTED: '已拒绝',
};

const triggerSourceLabels: Record<ToolCallTriggerSource, string> = {
  TEST: '测试调用',
  RUNTIME: '运行时调用',
};

export function approvalStatusLabel(status: ToolApprovalStatus) {
  return approvalStatusLabels[status] ?? status;
}

export function approvalStatusTone(status: ToolApprovalStatus) {
  if (status === 'APPROVED') return 'healthy';
  if (status === 'PENDING') return 'planned';
  return 'unavailable';
}

export function executionStatusLabel(status: ToolCallStatus) {
  return executionStatusLabels[status] ?? status;
}

export function executionStatusTone(status: ToolCallStatus) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'APPROVAL_REQUIRED') return 'planned';
  if (status === 'REJECTED') return 'degraded';
  return 'unavailable';
}

export function triggerSourceLabel(source: ToolCallTriggerSource) {
  return triggerSourceLabels[source] ?? source;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function formatLatency(value: number) {
  return `${value} ms`;
}
