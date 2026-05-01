import type {
  ToolAuthType,
  ToolCallStatus,
  ToolMethod,
  ToolRiskLevel,
  ToolStatus,
  ToolType,
} from '@aiaget/shared-types';

const statusLabels: Record<ToolStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

const callStatusLabels: Record<ToolCallStatus, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  APPROVAL_REQUIRED: '等待审批',
  REJECTED: '已拒绝',
};

const typeLabels: Record<ToolType, string> = {
  HTTP: 'HTTP',
};

const methodLabels: Record<ToolMethod, string> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

const riskLabels: Record<ToolRiskLevel, string> = {
  LOW: '低风险',
  MEDIUM: '中风险',
  HIGH: '高风险',
};

const authLabels: Record<ToolAuthType, string> = {
  NONE: '无鉴权',
  BEARER: 'Bearer Token',
  API_KEY_HEADER: '请求头密钥',
  API_KEY_QUERY: '查询参数密钥',
  BASIC: '基础认证',
};

export function toolStatusTone(status: ToolStatus | ToolCallStatus) {
  if (status === 'ACTIVE' || status === 'SUCCESS') return 'healthy';
  if (status === 'DISABLED' || status === 'APPROVAL_REQUIRED') return 'degraded';
  return 'unavailable';
}

export function toolStatusLabel(status: ToolStatus) {
  return statusLabels[status] ?? status;
}

export function toolCallStatusLabel(status: ToolCallStatus) {
  return callStatusLabels[status] ?? status;
}

export function toolTypeLabel(type: ToolType) {
  return typeLabels[type] ?? type;
}

export function toolMethodLabel(method: ToolMethod) {
  return methodLabels[method] ?? method;
}

export function toolRiskLabel(level: ToolRiskLevel) {
  return riskLabels[level] ?? level;
}

export function toolAuthLabel(type: ToolAuthType) {
  return authLabels[type] ?? type;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

export function formatLatency(value: number) {
  return `${value} ms`;
}
