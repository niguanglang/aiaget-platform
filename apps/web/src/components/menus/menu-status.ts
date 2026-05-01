import type { MenuType } from '@aiaget/shared-types';

export function menuTypeLabel(type: MenuType) {
  const labels: Record<MenuType, string> = {
    DIRECTORY: '目录',
    MENU: '页面',
    BUTTON: '按钮',
  };

  return labels[type] ?? type;
}

export function menuTypeTone(type: MenuType) {
  if (type === 'DIRECTORY') return 'planned';
  if (type === 'MENU') return 'mock';
  return 'degraded';
}

export function booleanLabel(value: boolean, enabledText = '是', disabledText = '否') {
  return value ? enabledText : disabledText;
}

export function booleanTone(value: boolean) {
  return value ? 'healthy' : 'planned';
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
