import type {
  MonitorEventSourceType,
  MonitorEventStatus,
  MonitorModule,
  MonitorRunStepType,
} from '@aiaget/shared-types';

const moduleLabels: Record<MonitorModule, string> = {
  agent: '智能体',
  prompt: '提示词',
  model: '模型',
  knowledge: '知识库',
  tool: '工具',
  conversation: '会话',
  user: '用户',
  tenant: '租户',
  auth: '认证',
  system: '系统',
};

const statusLabels: Record<MonitorEventStatus, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  DEGRADED: '降级',
};

const sourceTypeLabels: Record<MonitorEventSourceType, string> = {
  operation: '操作日志',
  model_call: '模型调用',
  tool_call: '工具调用',
  knowledge_recall: '检索日志',
  conversation_run: '会话运行',
  conversation_step: '运行步骤',
};

const stepTypeLabels: Record<MonitorRunStepType, string> = {
  prompt: '上下文',
  tool: '工具',
  knowledge: '检索',
  model: '模型',
  response: '响应',
};

export function monitorStatusTone(status: MonitorEventStatus) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'DEGRADED') return 'degraded';
  return 'unavailable';
}

export function monitorModuleLabel(module: MonitorModule) {
  return moduleLabels[module] ?? module;
}

export function monitorStatusLabel(status: MonitorEventStatus) {
  return statusLabels[status] ?? status;
}

export function monitorSourceTypeLabel(sourceType: MonitorEventSourceType) {
  return sourceTypeLabels[sourceType] ?? sourceType;
}

export function monitorStepTypeLabel(stepType: MonitorRunStepType | null | undefined) {
  if (!stepType) return '-';
  return stepTypeLabels[stepType] ?? stepType;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatLatency(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${value} ms`;
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `$${value.toFixed(6)}`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
