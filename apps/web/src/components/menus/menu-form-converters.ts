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
    is_external: values.is_external,
    external_url: values.is_external ? nullableText(values.external_url) : null,
    redirect_path: nullableText(values.redirect_path),
    keep_alive: values.keep_alive,
    affix: values.affix,
    hide_breadcrumb: values.hide_breadcrumb,
    route_meta: parseRouteMeta(values.route_meta),
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
    is_external: values.is_external,
    external_url: values.is_external ? nullableText(values.external_url) : null,
    redirect_path: nullableText(values.redirect_path),
    keep_alive: values.keep_alive,
    affix: values.affix,
    hide_breadcrumb: values.hide_breadcrumb,
    route_meta: parseRouteMeta(values.route_meta),
    sort_order: values.sort_order,
    visible: values.visible,
    enabled: values.enabled,
  };
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function parseRouteMeta(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const parsed = JSON.parse(trimmed) as unknown;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
}
