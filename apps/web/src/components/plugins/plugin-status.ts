import type {
  PluginHookStatus,
  PluginInstallationStatus,
  PluginRiskLevel,
  PluginRuntimeStatus,
  PluginSourceType,
} from '@aiaget/shared-types';

export const pluginInstallationStatuses: PluginInstallationStatus[] = [
  'PENDING_REVIEW',
  'INSTALLED',
  'ACTIVE',
  'DISABLED',
  'UPGRADING',
  'FAILED',
  'ARCHIVED',
];

export const pluginRuntimeStatuses: PluginRuntimeStatus[] = ['READY', 'RUNNING', 'STOPPED', 'UPGRADING', 'BLOCKED', 'ERROR'];
export const pluginRiskLevels: PluginRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function pluginStatusLabel(status: PluginInstallationStatus | null) {
  if (!status) return '未安装';

  const labels: Record<PluginInstallationStatus, string> = {
    PENDING_REVIEW: '待审核',
    INSTALLED: '已安装',
    ACTIVE: '已启用',
    DISABLED: '已停用',
    UPGRADING: '升级中',
    FAILED: '失败',
    ARCHIVED: '已归档',
  };

  return labels[status] ?? status;
}

export function pluginRuntimeLabel(status: PluginRuntimeStatus) {
  const labels: Record<PluginRuntimeStatus, string> = {
    READY: '就绪',
    RUNNING: '运行中',
    STOPPED: '已停止',
    UPGRADING: '升级中',
    BLOCKED: '已阻断',
    ERROR: '异常',
  };

  return labels[status] ?? status;
}

export function pluginRiskLabel(level: PluginRiskLevel) {
  const labels: Record<PluginRiskLevel, string> = {
    LOW: '低风险',
    MEDIUM: '中风险',
    HIGH: '高风险',
    CRITICAL: '极高风险',
  };

  return labels[level] ?? level;
}

export function pluginSourceLabel(source: PluginSourceType) {
  return source === 'CUSTOM' ? '自定义' : '市场';
}

export function pluginHookStatusLabel(status: PluginHookStatus) {
  const labels: Record<PluginHookStatus, string> = {
    ACTIVE: '启用',
    DISABLED: '停用',
    DELETED: '已删除',
  };

  return labels[status] ?? status;
}

export function pluginStatusTone(status: PluginInstallationStatus | null) {
  if (status === 'ACTIVE') return 'healthy' as const;
  if (status === 'FAILED') return 'unavailable' as const;
  if (status === 'PENDING_REVIEW' || status === 'UPGRADING') return 'degraded' as const;
  if (status === 'DISABLED' || status === 'ARCHIVED') return 'planned' as const;

  return 'ready' as const;
}

export function pluginRuntimeTone(status: PluginRuntimeStatus) {
  if (status === 'READY') return 'ready' as const;
  if (status === 'RUNNING') return 'healthy' as const;
  if (status === 'ERROR') return 'unavailable' as const;
  if (status === 'UPGRADING' || status === 'BLOCKED') return 'degraded' as const;

  return 'planned' as const;
}

export function pluginRiskTone(level: PluginRiskLevel) {
  if (level === 'LOW') return 'healthy' as const;
  if (level === 'MEDIUM') return 'ready' as const;
  if (level === 'HIGH') return 'degraded' as const;

  return 'unavailable' as const;
}

export function pluginHookStatusTone(status: PluginHookStatus) {
  if (status === 'ACTIVE') return 'healthy' as const;
  if (status === 'DISABLED') return 'planned' as const;

  return 'unavailable' as const;
}

export function formatPluginDateTime(value: string | null | undefined) {
  if (!value) return '暂无';

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
