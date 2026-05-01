import type {
  ConversationMessageRole,
  ConversationRunStatus,
  ConversationStatus,
  ToolCallStatus,
} from '@aiaget/shared-types';

const conversationStatusLabels: Record<ConversationStatus, string> = {
  ACTIVE: '进行中',
  ARCHIVED: '已归档',
};

const runStatusLabels: Record<ConversationRunStatus, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
};

const messageRoleLabels: Record<ConversationMessageRole, string> = {
  USER: '用户',
  ASSISTANT: '助手',
  SYSTEM: '系统',
  TOOL: '工具',
};

const toolCallStatusLabels: Record<ToolCallStatus, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  APPROVAL_REQUIRED: '等待审批',
  REJECTED: '已拒绝',
};

export function conversationStatusTone(status: ConversationStatus | ConversationRunStatus | ToolCallStatus) {
  if (status === 'ACTIVE' || status === 'SUCCESS') return 'healthy';
  if (status === 'ARCHIVED' || status === 'APPROVAL_REQUIRED') return 'planned';
  return 'unavailable';
}

export function conversationStatusLabel(status: ConversationStatus) {
  return conversationStatusLabels[status] ?? status;
}

export function conversationRunStatusLabel(status: ConversationRunStatus) {
  return runStatusLabels[status] ?? status;
}

export function conversationMessageRoleLabel(role: ConversationMessageRole) {
  return messageRoleLabels[role] ?? role;
}

export function conversationToolCallStatusLabel(status: ToolCallStatus) {
  return toolCallStatusLabels[status] ?? status;
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
