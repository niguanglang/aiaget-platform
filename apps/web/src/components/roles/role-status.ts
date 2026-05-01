import type { RoleStatus } from '@aiaget/shared-types';

export function roleStatusLabel(status: RoleStatus) {
  const labels: Record<RoleStatus, string> = {
    ACTIVE: '启用',
    DISABLED: '停用',
    DELETED: '已删除',
  };

  return labels[status] ?? status;
}

export function roleStatusTone(status: RoleStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'planned';
  return 'unavailable';
}

export function actionLabel(action: string) {
  const labels: Record<string, string> = {
    handle: '处理',
    manage: '管理',
    view: '查看',
  };

  return labels[action] ?? action;
}

export function formatDateTime(value: string | null) {
  if (!value) return '暂无';

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
