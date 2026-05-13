'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type MenuTreeItem } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, ListTree, Save } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { RoleCenterBackground } from '@/components/roles/role-center-background';
import { flattenMenuTree } from '@/components/roles/role-ia-shared';
import { roleStatusLabel, roleStatusTone } from '@/components/roles/role-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMenuTree, getRole, listMenuRoleBindings, updateMenuRoleBinding, type ApiClientError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export function RoleMenusContent({ roleId }: { roleId: string }) {
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [draftMenuIds, setDraftMenuIds] = useState<string[]>([]);
  const [menuError, setMenuError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:role:manage'),
  );

  const roleQuery = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => getRole(roleId),
  });

  const menuTreeQuery = useQuery({
    queryKey: ['menu-tree'],
    queryFn: getMenuTree,
  });

  const roleBindingsQuery = useQuery({
    queryKey: ['menu-role-bindings'],
    queryFn: listMenuRoleBindings,
  });

  const role = roleQuery.data;
  const grantableTree = useMemo(() => removeButtonMenuNodes(menuTreeQuery.data ?? []), [menuTreeQuery.data]);
  const flatTree = useMemo(() => flattenMenuTree(grantableTree), [grantableTree]);
  const selectedRoleBinding = useMemo(
    () => (role ? (roleBindingsQuery.data ?? []).find((binding) => binding.role_id === role.id) : null),
    [role, roleBindingsQuery.data],
  );

  useEffect(() => {
    const grantableIds = new Set(flatTree.map((menu) => menu.id));
    setDraftMenuIds((selectedRoleBinding?.menu_ids ?? []).filter((menuId) => grantableIds.has(menuId)));
  }, [flatTree, selectedRoleBinding?.menu_ids]);

  const menuBindingMutation = useMutation({
    mutationFn: ({ menuIds }: { menuIds: string[] }) => updateMenuRoleBinding(roleId, { menu_ids: menuIds }),
    onSuccess: async () => {
      setMenuError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['roles'] }),
        queryClient.invalidateQueries({ queryKey: ['role', roleId] }),
        queryClient.invalidateQueries({ queryKey: ['menu-role-bindings'] }),
        refreshCurrentUser(),
      ]);
    },
    onError: (error: ApiClientError) => setMenuError(error.message),
  });

  function toggleMenu(menu: MenuTreeItem) {
    setDraftMenuIds((current) => {
      const nextSelection = new Set(current);

      if (nextSelection.has(menu.id)) {
        nextSelection.delete(menu.id);
        for (const descendantId of collectDescendantMenuIds(menu)) {
          nextSelection.delete(descendantId);
        }
      } else {
        nextSelection.add(menu.id);
        for (const ancestorId of collectAncestorMenuIds(menu, grantableTree)) {
          nextSelection.add(ancestorId);
        }
      }

      return Array.from(nextSelection);
    });
  }

  function saveMenuBinding() {
    if (!role || !canWrite) return;
    menuBindingMutation.mutate({ menuIds: draftMenuIds });
  }

  const menuTypeCounts = useMemo(
    () =>
      flatTree.reduce(
        (acc, item) => {
          acc[item.type] += 1;
          return acc;
        },
        { BUTTON: 0, DIRECTORY: 0, MENU: 0 } as Record<MenuTreeItem['type'], number>,
      ),
    [flatTree],
  );

  const metrics = [
    { label: '当前已选', value: `${draftMenuIds.length}`, helper: '导航入口' },
    { label: '菜单总数', value: `${flatTree.length}`, helper: `${menuTypeCounts.DIRECTORY} 个目录` },
    { label: '页面菜单', value: `${menuTypeCounts.MENU}`, helper: '按钮权限单独授权' },
    { label: '角色状态', value: role?.status ? roleStatusLabel(role.status) : '暂无', helper: role?.code ?? roleId },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <RoleCenterBackground />

      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={`/roles/${roleId}`}>
              <ArrowLeft className="size-4" />
              角色详情
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">配置页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读'}</StatusBadge>
            {role ? <StatusBadge tone={roleStatusTone(role.status)}>{roleStatusLabel(role.status)}</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">菜单授权配置</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canWrite || menuTreeQuery.isLoading || flatTree.length === 0} onClick={() => setDraftMenuIds(flatTree.map((menu) => menu.id))} variant="outline">
            <Eye className="size-4" />
            全选菜单
          </Button>
          <Button disabled={!canWrite || menuTreeQuery.isLoading} onClick={() => setDraftMenuIds([])} variant="outline">
            <EyeOff className="size-4" />
            清空菜单
          </Button>
          <Button disabled={!canWrite || !role || menuBindingMutation.isPending} onClick={saveMenuBinding}>
            <Save className="size-4" />
            保存菜单授权
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {menuError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {menuError}
        </div>
      ) : null}

      {roleQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">角色信息加载失败。</Card>
      ) : roleQuery.isLoading || menuTreeQuery.isLoading || roleBindingsQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载菜单树...</Card>
      ) : flatTree.length === 0 ? (
        <EmptyState description="菜单树为空。" title="暂无菜单节点" />
      ) : (
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ListTree className="size-4 text-blue-700" />
                  <h2 className="text-sm font-semibold">菜单授权矩阵</h2>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  当前角色：<span className="font-medium text-foreground">{role?.name ?? '未选择'}</span>
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                已选择 {draftMenuIds.length} / {flatTree.length}
              </div>
            </div>
          </div>

          <div className="grid max-h-[620px] gap-1 overflow-y-auto p-4">
            {flatTree.map((menu, index) => (
              <MenuCheckbox
                checked={draftMenuIds.includes(menu.id)}
                disabled={!canWrite}
                index={index}
                key={menu.id}
                menu={menu}
                onToggle={() => toggleMenu(menu)}
              />
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}

function removeButtonMenuNodes(items: MenuTreeItem[]): MenuTreeItem[] {
  return items
    .filter((item) => item.type !== 'BUTTON')
    .map((item) => ({
      ...item,
      children: removeButtonMenuNodes(item.children),
    }));
}

function collectAncestorMenuIds(menu: MenuTreeItem, menuTree: MenuTreeItem[]) {
  const output: string[] = [];
  const menuById = new Map(flattenMenuTree(menuTree).map((item) => [item.id, item]));
  let parentId = menu.parent_id;

  while (parentId) {
    output.push(parentId);
    parentId = menuById.get(parentId)?.parent_id ?? null;
  }

  return output;
}

function collectDescendantMenuIds(menu: MenuTreeItem) {
  const output: string[] = [];

  function visit(nodes: MenuTreeItem[]) {
    for (const node of nodes) {
      output.push(node.id);
      visit(node.children);
    }
  }

  visit(menu.children);

  return output;
}

function MenuCheckbox({
  checked,
  disabled,
  index,
  menu,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  index: number;
  menu: MenuTreeItem;
  onToggle: () => void;
}) {
  return (
    <motion.label
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
        checked ? 'border-blue-200 bg-blue-50/70' : 'border-transparent hover:border-slate-200 hover:bg-muted/30',
        disabled && 'cursor-not-allowed opacity-70',
      )}
      initial={{ opacity: 0, y: 6 }}
      style={{ paddingLeft: `${12 + (menu.level - 1) * 20}px` }}
      transition={{ delay: index * 0.012, duration: 0.16 }}
    >
      <span className="flex min-w-0 items-center gap-2">
        <input checked={checked} disabled={disabled} onChange={onToggle} type="checkbox" />
        <span className="min-w-0">
          <span className="block truncate font-medium">{menu.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{menu.path ?? menu.code}</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <StatusBadge tone={menu.type === 'BUTTON' ? 'mock' : 'planned'}>{menu.type}</StatusBadge>
        {menu.permission_code ? (
          <span className="hidden max-w-[240px] truncate text-xs text-muted-foreground md:inline">
            {menu.permission_code}
          </span>
        ) : null}
      </span>
    </motion.label>
  );
}
