import type { ModelCallStatus, ModelCapability, ModelProviderStatus, ModelProviderType } from '@aiaget/shared-types';

const providerStatusLabels: Record<ModelProviderStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

const callStatusLabels: Record<ModelCallStatus, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
};

const providerTypeLabels: Record<ModelProviderType, string> = {
  OPENAI_COMPATIBLE: 'OpenAI 兼容',
  AZURE_OPENAI: 'Azure OpenAI',
  ANTHROPIC: 'Anthropic',
  LOCAL: '本地模型',
};

const capabilityLabels: Record<ModelCapability, string> = {
  chat: '对话',
  embedding: '向量',
  rerank: '重排',
  vision: '视觉',
  tool_call: '工具调用',
};

export function modelStatusTone(status: ModelProviderStatus | ModelCallStatus) {
  if (status === 'ACTIVE' || status === 'SUCCESS') return 'healthy';
  if (status === 'DISABLED') return 'degraded';

  return 'unavailable';
}

export function modelProviderStatusLabel(status: ModelProviderStatus) {
  return providerStatusLabels[status] ?? status;
}

export function modelCallStatusLabel(status: ModelCallStatus) {
  return callStatusLabels[status] ?? status;
}

export function modelProviderTypeLabel(providerType: ModelProviderType) {
  return providerTypeLabels[providerType] ?? providerType;
}

export function modelCapabilityLabel(capability: ModelCapability) {
  return capabilityLabels[capability] ?? capability;
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
