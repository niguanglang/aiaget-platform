'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type MenuListItem, type MenuTreeItem, type MenuType } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { ChevronDown, ChevronRight, Edit, Eye, ListTree, Plus, Power, RefreshCw, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { MenuCenterBackground } from '@/components/menus/menu-center-background';
import { booleanLabel, booleanTone, formatDateTime, menuTypeLabel, menuTypeTone } from '@/components/menus/menu-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteMenu,
  disableMenu,
  enableMenu,
  getMenuOverview,
  getMenuTree,
  listMenus,
  type ApiClientError,
} from '@/lib/api-client';

const menuTypes: MenuType[] = ['DIRECTORY', 'MENU', 'BUTTON'];

export function MenuContent() {
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [visible, setVisible] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<MenuListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:menu:manage'),
  );

  const overviewQuery = useQuery({
    queryKey: ['menu-overview'],
    queryFn: getMenuOverview,
  });
  const treeQuery = useQuery({
    queryKey: ['menu-tree'],
    queryFn: getMenuTree,
  });
  const menusQuery = useQuery({
    queryKey: ['menus', keyword, type, status, visible],
    queryFn: () =>
      listMenus({
        page: 1,
        page_size: 200,
        keyword,
        type,
        status,
        visible: visible === '' ? undefined : visible === 'true',
      }),
  });

  const menuTree = treeQuery.data ?? [];
  const flatTree = useMemo(() => flattenVisibleMenuTree(menuTree, collapsedIds), [menuTree, collapsedIds]);
  const totalTreeNodes = useMemo(() => countMenuTree(menuTree), [menuTree]);
  const hasActiveFilters = Boolean(keyword || type || status || visible);
  const menus = hasActiveFilters ? menusQuery.data?.items ?? [] : flatTree;

  const overview = overviewQuery.data;
  const metrics = [
    { label: '菜单节点', value: `${overview?.total ?? menusQuery.data?.total ?? 0}`, helper: '目录 / 页面 / 按钮' },
    { label: '页面菜单', value: `${overview?.menu_count ?? 0}`, helper: `${overview?.directory_count ?? 0} 个目录` },
    { label: '按钮节点', value: `${overview?.button_count ?? 0}`, helper: '用于操作权限' },
    { label: '异常状态', value: `${(overview?.hidden_count ?? 0) + (overview?.disabled_count ?? 0)}`, helper: '隐藏或停用' },
  ];

  const statusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => (enabled ? enableMenu(id) : disableMenu(id)),
    onSuccess: async () => {
      await refreshMenus();
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: async () => {
      setDeleteTarget(null);
      setActionError(null);
      await refreshMenus();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  async function refreshMenus() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['menu-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] }),
      queryClient.invalidateQueries({ queryKey: ['menus'] }),
      refreshCurrentUser(),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setType('');
    setStatus('');
    setVisible('');
  }

  function collapseAll() {
    setCollapsedIds(new Set(flattenMenuTree(menuTree).filter((menu) => menu.children.length > 0).map((menu) => menu.id)));
  }

  function expandAll() {
    setCollapsedIds(new Set());
  }

  function toggleCollapsed(menu: MenuTreeItem) {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(menu.id)) {
        next.delete(menu.id);
      } else {
        next.add(menu.id);
      }
      return next;
    });
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MenuCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M31</StatusBadge>
            <StatusBadge tone="healthy">动态导航</StatusBadge>
            <StatusBadge tone="planned">菜单定义</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">菜单中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            维护控制台目录、页面和按钮节点。角色菜单授权已移动到角色权限中心，当前页面只负责菜单定义。
          </p>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/menus/create">
              <Plus className="size-4" />
              新建菜单
            </Link>
          </Button>
        ) : (
          <Button className="w-full md:w-auto" disabled>
            <Plus className="size-4" />
            新建菜单
          </Button>
        )}
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card className="border-blue-100 bg-blue-50/55 p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-semibold text-blue-900">角色菜单授权已迁移</div>
            <p className="mt-1 text-sm leading-6 text-blue-800/80">
              菜单中心只维护节点定义、路由和权限标识；给角色分配菜单入口请前往角色权限中心处理。
            </p>
          </div>
          <StatusBadge tone="healthy">职责已拆分</StatusBadge>
        </div>
      </Card>

      <Card className="min-w-0">
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">菜单树表</h2>
                <p className="mt-1 text-sm text-muted-foreground">树形表格用于查询和进入详情，创建和编辑在独立路由完成。</p>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {menus.length} / {hasActiveFilters ? menusQuery.data?.total ?? 0 : totalTreeNodes}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_140px_auto_auto_auto_auto]">
              <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称、编码、路径"
                  value={keyword}
                />
              </label>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setType(event.target.value)} value={type}>
                <option value="">全部类型</option>
                {menuTypes.map((item) => (
                  <option key={item} value={item}>
                    {menuTypeLabel(item)}
                  </option>
                ))}
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                <option value="">全部状态</option>
                <option value="ENABLED">已启用</option>
                <option value="DISABLED">已停用</option>
              </select>
              <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setVisible(event.target.value)} value={visible}>
                <option value="">全部可见性</option>
                <option value="true">导航可见</option>
                <option value="false">导航隐藏</option>
              </select>
              <Button onClick={clearFilters} type="button" variant="outline">
                清空
              </Button>
              <Button disabled={hasActiveFilters} onClick={expandAll} type="button" variant="outline">
                展开全部
              </Button>
              <Button disabled={hasActiveFilters} onClick={collapseAll} type="button" variant="outline">
                折叠全部
              </Button>
              <Button onClick={() => void refreshMenus()} type="button" variant="outline">
                <RefreshCw className="size-4" />
                刷新
              </Button>
            </div>
          </div>
        </div>

        {treeQuery.isError || menusQuery.isError ? (
          <div className="p-6 text-sm text-destructive">菜单节点加载失败。</div>
        ) : treeQuery.isLoading || menusQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载菜单节点...</div>
        ) : menus.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/menus/create">
                    <Plus className="size-4" />
                    新建菜单
                  </Link>
                </Button>
              ) : null
            }
            description="当前筛选条件没有匹配节点，清空筛选或创建新的菜单。"
            title="暂无菜单节点"
          />
        ) : (
          <MenuTable
            canWrite={canWrite}
            collapsedIds={collapsedIds}
            filterMode={hasActiveFilters}
            menus={menus}
            onDelete={setDeleteTarget}
            onToggle={(menu) => statusMutation.mutate({ id: menu.id, enabled: !menu.enabled })}
            onToggleCollapsed={toggleCollapsed}
            pending={statusMutation.isPending}
          />
        )}
      </Card>

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除菜单节点「${deleteTarget.name}」。如果该节点仍有子节点、角色绑定或插件菜单绑定，后端会拒绝删除。`}
          pending={deleteMutation.isPending}
          title="删除菜单节点？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function MenuTable({
  canWrite,
  collapsedIds,
  filterMode,
  menus,
  onDelete,
  onToggle,
  onToggleCollapsed,
  pending,
}: {
  canWrite: boolean;
  collapsedIds: Set<string>;
  filterMode: boolean;
  menus: Array<MenuTreeItem | MenuListItem>;
  onDelete: (menu: MenuListItem) => void;
  onToggle: (menu: MenuListItem) => void;
  onToggleCollapsed: (menu: MenuTreeItem) => void;
  pending: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['名称', '编码', '类型', '路径', '权限编码', '状态', '可见', '角色', '更新时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {menus.map((menu, index) => {
            const treeMenu = isTreeItem(menu) ? menu : null;
            const hasChildren = treeMenu !== null && treeMenu.children.length > 0;

            return (
              <motion.tr
                animate={{ opacity: 1, y: 0 }}
                className="border-b transition-colors last:border-0 hover:bg-muted/25"
                initial={{ opacity: 0, y: 8 }}
                key={menu.id}
                transition={{ delay: index * 0.015, duration: 0.18 }}
              >
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${(menu.level - 1) * 18}px` }}>
                    {treeMenu && hasChildren && !filterMode ? (
                      <Button className="size-7" onClick={() => onToggleCollapsed(treeMenu)} size="icon" type="button" variant="ghost">
                        {collapsedIds.has(menu.id) ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                    ) : (
                      <span className="size-7" />
                    )}
                    <ListTree className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{menu.name}</div>
                      <div className="text-xs text-muted-foreground">父级：{menu.parent_name ?? '根节点'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{menu.code}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={menuTypeTone(menu.type)}>{menuTypeLabel(menu.type)}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{menu.path ?? '暂无'}</td>
                <td className="px-4 py-3 text-muted-foreground">{menu.permission_code ?? '无需权限'}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={booleanTone(menu.enabled)}>{booleanLabel(menu.enabled, '已启用', '已停用')}</StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={booleanTone(menu.visible)}>{booleanLabel(menu.visible, '可见', '隐藏')}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{menu.role_count}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(menu.updated_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button asChild size="sm" title="查看" variant="outline">
                      <Link href={`/menus/${menu.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    {canWrite && menu.type !== 'BUTTON' ? (
                      <Button asChild size="sm" title="新建子节点" variant="outline">
                        <Link href={`/menus/create?parentId=${menu.id}`}>
                          <Plus className="size-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button disabled size="sm" title="新建子节点" variant="outline">
                        <Plus className="size-4" />
                      </Button>
                    )}
                    {canWrite ? (
                      <Button asChild size="sm" title="编辑" variant="outline">
                        <Link href={`/menus/${menu.id}/edit`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button disabled size="sm" title="编辑" variant="outline">
                        <Edit className="size-4" />
                      </Button>
                    )}
                    <Button disabled={!canWrite || pending} onClick={() => onToggle(menu)} size="sm" title={menu.enabled ? '停用' : '启用'} variant="outline">
                      <Power className="size-4" />
                    </Button>
                    <Button disabled={!canWrite} onClick={() => onDelete(menu)} size="sm" title="删除" variant="outline">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmDialog({
  body,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            确认删除
          </Button>
        </div>
      </Card>
    </div>
  );
}

function flattenVisibleMenuTree(items: MenuTreeItem[], collapsedIds: Set<string>) {
  const output: MenuTreeItem[] = [];

  function visit(nodes: MenuTreeItem[]) {
    for (const node of nodes) {
      output.push(node);
      if (!collapsedIds.has(node.id)) {
        visit(node.children);
      }
    }
  }

  visit(items);

  return output;
}

function flattenMenuTree(items: MenuTreeItem[]) {
  const output: MenuTreeItem[] = [];

  function visit(nodes: MenuTreeItem[]) {
    for (const node of nodes) {
      output.push(node);
      visit(node.children);
    }
  }

  visit(items);

  return output;
}

function countMenuTree(items: MenuTreeItem[]) {
  return flattenMenuTree(items).length;
}

function isTreeItem(menu: MenuTreeItem | MenuListItem): menu is MenuTreeItem {
  return 'children' in menu;
}
