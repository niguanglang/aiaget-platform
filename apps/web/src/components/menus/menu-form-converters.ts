import type { CreateMenuInput, MenuType, UpdateMenuInput } from '@aiaget/shared-types';

import type { MenuFormValues } from '@/components/menus/menu-form-panel';

export function toCreateMenuInput(values: MenuFormValues): CreateMenuInput {
  const type = values.type as MenuType;

  return {
    parent_id: nullableText(values.parent_id),
    name: values.name.trim(),
    code: values.code.trim(),
    type,
    path: type === 'MENU' ? nullableText(values.path) : null,
    component: type === 'MENU' ? nullableText(values.component) : null,
    icon: nullableText(values.icon),
    permission_code: nullableText(values.permission_code),
    sort_order: values.sort_order,
    visible: values.visible,
    enabled: values.enabled,
  };
}

export function toUpdateMenuInput(values: MenuFormValues): UpdateMenuInput {
  const type = values.type as MenuType;

  return {
    parent_id: nullableText(values.parent_id),
    name: values.name.trim(),
    type,
    path: type === 'MENU' ? nullableText(values.path) : null,
    component: type === 'MENU' ? nullableText(values.component) : null,
    icon: nullableText(values.icon),
    permission_code: nullableText(values.permission_code),
    sort_order: values.sort_order,
    visible: values.visible,
    enabled: values.enabled,
  };
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
