import type { DepartmentStatus } from '@aiaget/shared-types';

export function departmentStatusLabel(status: DepartmentStatus) {
  const labels: Record<DepartmentStatus, string> = {
    ACTIVE: '启用',
    DISABLED: '停用',
    DELETED: '已删除',
  };

  return labels[status] ?? status;
}

export function departmentStatusTone(status: DepartmentStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'planned';
  return 'unavailable';
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
