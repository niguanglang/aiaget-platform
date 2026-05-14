'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { MenuDetail, MenuListItem, MenuTreeItem, MenuType } from '@aiaget/shared-types';
import { X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { menuTypeLabel } from '@/components/menus/menu-status';
import { Button } from '@/components/ui/button';

const menuTypes = ['DIRECTORY', 'MENU', 'BUTTON'] as const;

const menuFormSchema = z
  .object({
    parent_id: z.string().optional(),
    name: z.string().min(2, '名称至少需要 2 个字符。'),
    code: z
      .string()
      .regex(/^[a-z][a-z0-9_-]{1,99}$/, '请使用 2-100 位小写字母、数字、下划线或连字符。'),
    type: z.enum(menuTypes),
    path: z.string().optional(),
    component: z.string().optional(),
    icon: z.string().optional(),
    permission_code: z.string().optional(),
    is_external: z.boolean(),
    external_url: z.string().optional(),
    redirect_path: z.string().optional(),
    keep_alive: z.boolean(),
    affix: z.boolean(),
    hide_breadcrumb: z.boolean(),
    route_meta: z.string().optional().refine(isJsonObjectText, '请填写 JSON 对象。'),
    sort_order: z.number().int('请使用整数。').min(0, '最小值为 0。').max(10000, '最大值为 10000。'),
    visible: z.boolean(),
    enabled: z.boolean(),
  })
  .superRefine((values, context) => {
    const externalUrl = values.external_url?.trim();
    if (values.is_external && !externalUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '外链菜单需要填写外链地址。',
        path: ['external_url'],
      });
    }
    if (externalUrl && !isAllowedExternalUrl(externalUrl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: '外链地址需要以 http:// 或 https:// 开头。',
        path: ['external_url'],
      });
    }
  });

export type MenuFormValues = z.infer<typeof menuFormSchema>;

interface MenuFormPanelProps {
  error?: string | null;
  isPending: boolean;
  menu?: MenuDetail | null;
  menuTree: MenuTreeItem[];
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: MenuFormValues) => void;
  parent?: MenuListItem | null;
  presentation?: 'drawer' | 'page';
}

function formDefaults(menu?: MenuDetail | null, parent?: MenuListItem | null): MenuFormValues {
  return {
    parent_id: menu?.parent_id ?? parent?.id ?? '',
    name: menu?.name ?? '',
    code: menu?.code ?? '',
    type: (menu?.type ?? 'MENU') as MenuType,
    path: menu?.path ?? '',
    component: menu?.component ?? '',
    icon: menu?.icon ?? '',
    permission_code: menu?.permission_code ?? '',
    is_external: menu?.is_external ?? false,
    external_url: menu?.external_url ?? '',
    redirect_path: menu?.redirect_path ?? '',
    keep_alive: menu?.keep_alive ?? false,
    affix: menu?.affix ?? false,
    hide_breadcrumb: menu?.hide_breadcrumb ?? false,
    route_meta: menu?.route_meta ? JSON.stringify(menu.route_meta, null, 2) : '',
    sort_order: menu?.sort_order ?? 0,
    visible: menu?.visible ?? true,
    enabled: menu?.enabled ?? true,
  };
}

function isJsonObjectText(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return true;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return Boolean(parsed && typeof parsed === 'object' && !Array.isArray(parsed));
  } catch {
    return false;
  }
}

function isAllowedExternalUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://');
}

export function MenuFormPanel({
  error,
  isPending,
  menu,
  menuTree,
  mode,
  onClose,
  onSubmit,
  parent,
  presentation = 'drawer',
}: MenuFormPanelProps) {
  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: formDefaults(menu, parent),
  });
  const currentType = form.watch('type');
  const parentOptions = useMemo(() => flattenParentOptions(menuTree, menu?.id), [menuTree, menu?.id]);
  const isEditing = mode === 'edit';

  useEffect(() => {
    form.reset(formDefaults(menu, parent));
  }, [form, menu, mode, parent]);

  const isPage = presentation === 'page';

  return (
    <section
      className={
        isPage
          ? 'grid rounded-lg border bg-background shadow-sm'
          : 'fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l bg-background shadow-xl'
      }
    >
      <div className="border-b p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? '编辑菜单节点' : '新建菜单节点'}</h2>
          </div>
          {isPage ? null : (
            <Button onClick={onClose} size="icon" type="button" variant="ghost">
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <form className={isPage ? 'grid gap-5 p-6' : 'grid flex-1 gap-5 overflow-y-auto p-6'} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-sm font-semibold">基础信息</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="名称" message={form.formState.errors.name?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="例如：菜单管理"
                {...form.register('name')}
              />
            </Field>

            <Field label="编码" message={form.formState.errors.code?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none read-only:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="例如：menus"
                readOnly={isEditing}
                {...form.register('code')}
              />
            </Field>

            <Field label="多级菜单父级 / 层级路径" message={form.formState.errors.parent_id?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('parent_id')}>
                <option value="">根节点</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="节点类型" message={form.formState.errors.type?.message}>
              <select className="h-10 rounded-md border bg-background px-3 text-sm" {...form.register('type')}>
                {menuTypes.map((type) => (
                  <option key={type} value={type}>
                    {menuTypeLabel(type)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-sm font-semibold">路由信息</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="路由路径" message={form.formState.errors.path?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={currentType !== 'MENU'}
                placeholder="/menus"
                {...form.register('path')}
              />
            </Field>

            <Field label="组件标识" message={form.formState.errors.component?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={currentType !== 'MENU'}
                placeholder="menus/page"
                {...form.register('component')}
              />
            </Field>

            <Field label="图标标识" message={form.formState.errors.icon?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="ListTree"
                {...form.register('icon')}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-sm font-semibold">权限控制</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="权限编码" message={form.formState.errors.permission_code?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="system:menu:view"
                {...form.register('permission_code')}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-sm font-semibold">显示控制</div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
            <Field label="排序号" message={form.formState.errors.sort_order?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                min="0"
                step="1"
                type="number"
                {...form.register('sort_order', { valueAsNumber: true })}
              />
            </Field>

            <label className="flex h-10 items-center gap-2 self-end rounded-md border bg-background px-3 text-sm">
              <input type="checkbox" {...form.register('visible')} />
              导航可见
            </label>

            <label className="flex h-10 items-center gap-2 self-end rounded-md border bg-background px-3 text-sm">
              <input type="checkbox" {...form.register('enabled')} />
              启用节点
            </label>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-sm font-semibold">高级配置</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex h-10 items-center gap-2 self-end rounded-md border bg-background px-3 text-sm">
              <input type="checkbox" {...form.register('is_external')} />
              外链菜单
            </label>

            <Field label="外链地址" message={form.formState.errors.external_url?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted"
                disabled={!form.watch('is_external')}
                placeholder="https://example.com"
                {...form.register('external_url')}
              />
            </Field>

            <Field label="重定向地址" message={form.formState.errors.redirect_path?.message}>
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="/dashboard"
                {...form.register('redirect_path')}
              />
            </Field>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <input type="checkbox" {...form.register('keep_alive')} />
                缓存页面
              </label>
              <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                <input type="checkbox" {...form.register('affix')} />
                固定标签
              </label>
              <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm sm:col-span-2">
                <input type="checkbox" {...form.register('hide_breadcrumb')} />
                面包屑隐藏
              </label>
            </div>

            <Field label="路由元信息" message={form.formState.errors.route_meta?.message}>
              <textarea
                className="min-h-28 resize-y rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring md:col-span-2"
                placeholder={'{\n  "activeMenu": "/menus"\n}'}
                {...form.register('route_meta')}
              />
              <span className="text-xs font-normal text-muted-foreground">填写 JSON 对象，留空表示不设置扩展元信息。</span>
            </Field>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className={isPage ? '-mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4' : 'sticky bottom-0 -mx-6 mt-auto flex justify-end gap-2 border-t bg-background px-6 py-4'}>
          <Button onClick={onClose} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            {isEditing ? '保存修改' : '新建菜单'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function flattenParentOptions(items: MenuTreeItem[], excludeId?: string | null) {
  const output: Array<{ id: string; label: string }> = [];
  const excludedIds = collectSubtreeIds(items, excludeId);

  function visit(nodes: MenuTreeItem[], level: number, ancestors: string[]) {
    for (const node of nodes) {
      if (excludedIds.has(node.id)) continue;

      const path = [...ancestors, node.name];
      if (node.type !== 'BUTTON') {
        output.push({
          id: node.id,
          label: `${'　'.repeat(Math.max(0, level - 1))}${path.join(' / ')}（${menuTypeLabel(node.type)}）`,
        });
      }
      visit(node.children, level + 1, path);
    }
  }

  visit(items, 1, []);

  return output;
}

function collectSubtreeIds(items: MenuTreeItem[], targetId?: string | null) {
  const output = new Set<string>();
  if (!targetId) return output;

  function collect(node: MenuTreeItem) {
    output.add(node.id);
    for (const child of node.children) collect(child);
  }

  function visit(nodes: MenuTreeItem[]) {
    for (const node of nodes) {
      if (node.id === targetId) {
        collect(node);
        return;
      }
      visit(node.children);
    }
  }

  visit(items);

  return output;
}

function Field({
  children,
  label,
  message,
}: {
  children: React.ReactNode;
  label: string;
  message?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {message ? <span className="text-xs text-destructive">{message}</span> : null}
    </label>
  );
}
