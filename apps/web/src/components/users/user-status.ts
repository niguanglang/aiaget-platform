import type { UserStatus } from '@aiaget/shared-types';

export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

export function userStatusLabel(status: UserStatus) {
  return userStatusLabels[status] ?? status;
}

export function userStatusTone(status: UserStatus) {
  if (status === 'ACTIVE') return 'healthy';
  if (status === 'DISABLED') return 'degraded';
  return 'unavailable';
}
