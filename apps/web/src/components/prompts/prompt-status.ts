import type { PromptStatus, PromptTestStatus, PromptType, PromptVariableType } from '@aiaget/shared-types';

const promptStatusLabels: Record<PromptStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  DISABLED: '已停用',
  ARCHIVED: '已归档',
};

const promptTestStatusLabels: Record<PromptTestStatus, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
};

const promptTypeLabels: Record<PromptType, string> = {
  SYSTEM: '系统',
  USER: '用户',
  ASSISTANT: '助手',
  TOOL: '工具',
};

const promptVariableTypeLabels: Record<PromptVariableType, string> = {
  string: '字符串',
  number: '数字',
  boolean: '布尔值',
  json: 'JSON',
};

export function promptStatusTone(status: PromptStatus) {
  if (status === 'PUBLISHED') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  if (status === 'ARCHIVED') return 'unavailable';

  return 'ready';
}

export function promptTestStatusTone(status: PromptTestStatus) {
  return status === 'SUCCESS' ? 'healthy' : 'unavailable';
}

export function promptStatusLabel(status: PromptStatus) {
  return promptStatusLabels[status] ?? status;
}

export function promptTestStatusLabel(status: PromptTestStatus) {
  return promptTestStatusLabels[status] ?? status;
}

export function promptTypeLabel(type: PromptType) {
  return promptTypeLabels[type] ?? type;
}

export function promptVariableTypeLabel(type: PromptVariableType) {
  return promptVariableTypeLabels[type] ?? type;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}
