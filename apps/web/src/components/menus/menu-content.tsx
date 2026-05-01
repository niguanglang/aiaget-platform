'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type CreateMenuInput,
  MenuDetail,
  MenuListItem,
  MenuTreeItem,
  MenuType,
  RoleListItem,
  UpdateMenuInput,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  Edit,
  Eye,
  EyeOff,
  FolderTree,
  ListTree,
  Plus,
  Power,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { MenuCenterBackground } from '@/components/menus/menu-center-background';
import { MenuFormPanel, type MenuFormValues } from '@/components/menus/menu-form-panel';
import {
  booleanLabel,
  booleanTone,
  formatDateTime,
  menuTypeLabel,
  menuTypeTone,
} from '@/components/menus/menu-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createMenu,
  deleteMenu,
  disableMenu,
  enableMenu,
  getMenu,
  getMenuOverview,
  getMenuTree,
  listMenuRoleBindings,
  listMenus,
  listRoles,
  updateMenu,
  updateMenuRoleBinding,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

const menuTypes: MenuType[] = ['DIRECTORY', 'MENU', 'BUTTON'];

export function MenuContent() {
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [visible, setVisible] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuDetail | null>(null);
  const [parentForCreate, setParentForCreate] = useState<MenuListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuListItem | MenuDetail | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftMenuIds, setDraftMenuIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

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
  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles({ page: 1, page_size: 200 }),
  });
  const roleBindingsQuery = useQuery({
    queryKey: ['menu-role-bindings'],
    queryFn: listMenuRoleBindings,
  });
  const selectedMenuQuery = useQuery({
    enabled: Boolean(selectedMenuId),
    queryKey: ['menu', selectedMenuId],
    queryFn: () => getMenu(selectedMenuId ?? ''),
  });

  const menuTree = treeQuery.data ?? [];
  const menus = menusQuery.data?.items ?? [];
  const flatTree = useMemo(() => flattenMenuTree(menuTree), [menuTree]);
  const roles = rolesQuery.data?.items ?? [];
  const roleBindings = roleBindingsQuery.data ?? [];
  const selectedMenu = selectedMenuQuery.data ?? menus.find((menu) => menu.id === selectedMenuId) ?? null;
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;
  const selectedRoleBinding = selectedRole ? roleBindings.find((binding) => binding.role_id === selectedRole.id) : null;

  useEffect(() => {
    const firstMenu = flatTree[0];
    if (!selectedMenuId && firstMenu) {
      setSelectedMenuId(firstMenu.id);
    }
  }, [flatTree, selectedMenuId]);

  useEffect(() => {
    const firstRole = roles[0];
    if (!selectedRoleId && firstRole) {
      setSelectedRoleId(firstRole.id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    setDraftMenuIds(selectedRoleBinding?.menu_ids ?? []);
  }, [selectedRoleBinding?.menu_ids, selectedRoleId]);

  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: async (menu) => {
      await refreshMenus();
      setSelectedMenuId(menu.id);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateMenuInput }) => updateMenu(id, values),
    onSuccess: async (menu) => {
      queryClient.setQueryData(['menu', menu.id], menu);
      await refreshMenus();
      setSelectedMenuId(menu.id);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => (enabled ? enableMenu(id) : disableMenu(id)),
    onSuccess: async (menu) => {
      queryClient.setQueryData(['menu', menu.id], menu);
      await refreshMenus();
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: async () => {
      setDeleteTarget(null);
      setSelectedMenuId(null);
      setActionError(null);
      await refreshMenus();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const roleBindingMutation = useMutation({
    mutationFn: ({ roleId, menuIds }: { roleId: string; menuIds: string[] }) =>
      updateMenuRoleBinding(roleId, { menu_ids: menuIds }),
    onSuccess: async () => {
      setRoleError(null);
      await queryClient.invalidateQueries({ queryKey: ['menu-role-bindings'] });
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      await refreshCurrentUser();
    },
    onError: (error: ApiClientError) => setRoleError(error.message),
  });

  async function refreshMenus() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['menu-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] }),
      queryClient.invalidateQueries({ queryKey: ['menus'] }),
      queryClient.invalidateQueries({ queryKey: ['menu-role-bindings'] }),
      queryClient.invalidateQueries({ queryKey: ['roles'] }),
      refreshCurrentUser(),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setType('');
    setStatus('');
    setVisible('');
  }

  function openCreateForm(parent?: MenuListItem | null) {
    setFormError(null);
    setEditingMenu(null);
    setParentForCreate(parent ?? null);
    setFormMode('create');
  }

  async function openEditForm(menu: MenuListItem | MenuDetail) {
    setFormError(null);
    const detail =
      'role_bindings' in menu
        ? menu
        : await queryClient.fetchQuery({
            queryKey: ['menu', menu.id],
            queryFn: () => getMenu(menu.id),
          });

    setEditingMenu(detail);
    setParentForCreate(null);
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode(null);
    setEditingMenu(null);
    setParentForCreate(null);
    setFormError(null);
  }

  function submitForm(values: MenuFormValues) {
    setFormError(null);
    const payload = toMenuPayload(values);

    if (formMode === 'create') {
      createMutation.mutate({
        ...payload,
        code: values.code.trim(),
      } as CreateMenuInput);
      return;
    }

    if (editingMenu) {
      updateMutation.mutate({ id: editingMenu.id, values: payload });
    }
  }

  function toggleDraftMenu(menuId: string) {
    setDraftMenuIds((current) =>
      current.includes(menuId) ? current.filter((id) => id !== menuId) : [...current, menuId],
    );
  }

  function selectAllVisibleMenus() {
    setDraftMenuIds(Array.from(new Set([...draftMenuIds, ...flatTree.map((menu) => menu.id)])));
  }

  function clearDraftMenus() {
    setDraftMenuIds([]);
  }

  function saveRoleBinding() {
    if (!selectedRole) return;
    roleBindingMutation.mutate({
      roleId: selectedRole.id,
      menuIds: draftMenuIds,
    });
  }

  const overview = overviewQuery.data;
  const metrics = [
    { label: '菜单节点', value: `${overview?.total ?? menusQuery.data?.total ?? 0}`, helper: '目录 / 页面 / 按钮' },
    { label: '页面菜单', value: `${overview?.menu_count ?? 0}`, helper: `${overview?.directory_count ?? 0} 个目录` },
    { label: '按钮节点', value: `${overview?.button_count ?? 0}`, helper: '用于操作权限' },
    { label: '异常状态', value: `${(overview?.hidden_count ?? 0) + (overview?.disabled_count ?? 0)}`, helper: '隐藏或停用' },
  ];

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
            <StatusBadge tone="planned">RBAC 菜单授权</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">菜单中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            维护控制台目录、页面和按钮节点，并通过角色菜单授权决定用户能看到哪些入口。
          </p>
        </div>
        <Button className="w-full md:w-auto" disabled={!canWrite} onClick={() => openCreateForm()}>
          <Plus className="size-4" />
          新建菜单
        </Button>
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

      <section className="grid min-w-0 gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="min-w-0">
          <div className="flex items-start justify-between gap-3 border-b p-4">
            <div>
              <h2 className="text-sm font-semibold">菜单树</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">最多三级结构，按钮节点不进入导航。</p>
            </div>
            <Button disabled={!canWrite} onClick={() => openCreateForm()} size="sm" variant="outline">
              <Plus className="size-4" />
              根节点
            </Button>
          </div>

          {treeQuery.isError ? (
            <div className="p-6 text-sm text-destructive">菜单树加载失败。</div>
          ) : treeQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载菜单树...</div>
          ) : flatTree.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canWrite} onClick={() => openCreateForm()}>
                  <Plus className="size-4" />
                  新建菜单
                </Button>
              }
              description="先创建工作台、业务中心或系统管理等根节点，再补充页面和按钮。"
              title="暂无菜单树"
            />
          ) : (
            <div className="grid gap-1 p-3">
              {flatTree.map((menu, index) => (
                <motion.button
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex min-h-10 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    selectedMenuId === menu.id
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-transparent bg-white/45 hover:border-slate-200 hover:bg-white/80',
                  )}
                  initial={{ opacity: 0, y: 6 }}
                  key={menu.id}
                  onClick={() => setSelectedMenuId(menu.id)}
                  style={{ paddingLeft: `${12 + (menu.level - 1) * 18}px` }}
                  transition={{ delay: index * 0.015, duration: 0.18 }}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FolderTree className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{menu.name}</span>
                  </span>
                  <StatusBadge tone={menuTypeTone(menu.type)}>{menuTypeLabel(menu.type)}</StatusBadge>
                </motion.button>
              ))}
            </div>
          )}
        </Card>

        <div className="grid min-w-0 gap-4">
          <Card className="min-w-0">
            <div className="border-b p-4">
              <div className="grid gap-4">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                  <div>
                    <h2 className="text-sm font-semibold">菜单节点</h2>
                    <p className="mt-1 text-sm text-muted-foreground">按名称、编码、路径和权限过滤全部菜单节点。</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    显示 {menus.length} / {menusQuery.data?.total ?? 0}
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_140px_auto]">
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
                </div>
              </div>
            </div>

            {menusQuery.isError ? (
              <div className="p-6 text-sm text-destructive">菜单节点加载失败。</div>
            ) : menusQuery.isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">正在加载菜单节点...</div>
            ) : menus.length === 0 ? (
              <EmptyState
                action={
                  <Button disabled={!canWrite} onClick={() => openCreateForm()}>
                    <Plus className="size-4" />
                    新建菜单
                  </Button>
                }
                description="当前筛选条件没有匹配节点，清空筛选或创建新的菜单。"
                title="暂无菜单节点"
              />
            ) : (
              <MenuTable
                canWrite={canWrite}
                menus={menus}
                onCreateChild={openCreateForm}
                onDelete={setDeleteTarget}
                onEdit={(menu) => void openEditForm(menu)}
                onSelect={setSelectedMenuId}
                onToggle={(menu) => statusMutation.mutate({ id: menu.id, enabled: !menu.enabled })}
                pending={statusMutation.isPending}
                selectedMenuId={selectedMenuId}
              />
            )}
          </Card>

          <MenuDetailCard
            canWrite={canWrite}
            loading={selectedMenuQuery.isLoading}
            menu={selectedMenu}
            onCreateChild={openCreateForm}
            onDelete={setDeleteTarget}
            onEdit={(menu) => void openEditForm(menu)}
            onToggle={(menu) => statusMutation.mutate({ id: menu.id, enabled: !menu.enabled })}
            pending={statusMutation.isPending}
          />
        </div>
      </section>

      <RoleBindingCard
        draftMenuIds={draftMenuIds}
        flatTree={flatTree}
        loading={rolesQuery.isLoading || roleBindingsQuery.isLoading}
        onClear={clearDraftMenus}
        onRoleChange={setSelectedRoleId}
        onSave={saveRoleBinding}
        onSelectAll={selectAllVisibleMenus}
        onToggleMenu={toggleDraftMenu}
        pending={roleBindingMutation.isPending}
        roleError={roleError}
        roles={roles}
        selectedRole={selectedRole}
        selectedRoleId={selectedRoleId}
        canWrite={canWrite}
      />

      {formMode ? (
        <MenuFormPanel
          error={formError}
          isPending={createMutation.isPending || updateMutation.isPending}
          menu={editingMenu}
          menuTree={menuTree}
          mode={formMode}
          onClose={closeForm}
          onSubmit={submitForm}
          parent={parentForCreate}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除菜单节点「${deleteTarget.name}」。如果该节点仍有子节点，后端会拒绝删除。`}
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
  menus,
  onCreateChild,
  onDelete,
  onEdit,
  onSelect,
  onToggle,
  pending,
  selectedMenuId,
}: {
  canWrite: boolean;
  menus: MenuListItem[];
  onCreateChild: (menu: MenuListItem) => void;
  onDelete: (menu: MenuListItem) => void;
  onEdit: (menu: MenuListItem) => void;
  onSelect: (id: string) => void;
  onToggle: (menu: MenuListItem) => void;
  pending: boolean;
  selectedMenuId: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
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
          {menus.map((menu, index) => (
            <motion.tr
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25',
                selectedMenuId === menu.id && 'bg-blue-50/55',
              )}
              initial={{ opacity: 0, y: 8 }}
              key={menu.id}
              onClick={() => onSelect(menu.id)}
              transition={{ delay: index * 0.02, duration: 0.2 }}
            >
              <td className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${(menu.level - 1) * 18}px` }}>
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
              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                <div className="flex gap-2">
                  <Button disabled={!canWrite || menu.type === 'BUTTON'} onClick={() => onCreateChild(menu)} size="sm" title="新建子节点" variant="outline">
                    <Plus className="size-4" />
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onEdit(menu)} size="sm" title="编辑" variant="outline">
                    <Edit className="size-4" />
                  </Button>
                  <Button disabled={!canWrite || pending} onClick={() => onToggle(menu)} size="sm" title={menu.enabled ? '停用' : '启用'} variant="outline">
                    <Power className="size-4" />
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onDelete(menu)} size="sm" title="删除" variant="outline">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MenuDetailCard({
  canWrite,
  loading,
  menu,
  onCreateChild,
  onDelete,
  onEdit,
  onToggle,
  pending,
}: {
  canWrite: boolean;
  loading: boolean;
  menu: MenuDetail | MenuListItem | null;
  onCreateChild: (menu: MenuListItem) => void;
  onDelete: (menu: MenuListItem | MenuDetail) => void;
  onEdit: (menu: MenuListItem | MenuDetail) => void;
  onToggle: (menu: MenuListItem | MenuDetail) => void;
  pending: boolean;
}) {
  return (
    <Card className="min-w-0 p-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-sm font-semibold">节点详情</h2>
          <p className="mt-1 text-sm text-muted-foreground">查看路由、权限、角色绑定和子节点概况。</p>
        </div>
        {menu ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={!canWrite || menu.type === 'BUTTON'} onClick={() => onCreateChild(menu)} size="sm" variant="outline">
              <Plus className="size-4" />
              子节点
            </Button>
            <Button disabled={!canWrite} onClick={() => onEdit(menu)} size="sm" variant="outline">
              <Edit className="size-4" />
              编辑
            </Button>
            <Button disabled={!canWrite || pending} onClick={() => onToggle(menu)} size="sm" variant="outline">
              <Power className="size-4" />
              {menu.enabled ? '停用' : '启用'}
            </Button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-muted-foreground">正在加载节点详情...</div>
      ) : !menu ? (
        <EmptyState
          className="py-8"
          description="从左侧树或表格中选择一个节点，查看它的路由、权限和角色授权。"
          title="未选择菜单节点"
        />
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border bg-muted/15 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{menu.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{menu.code}</div>
              </div>
              <StatusBadge tone={menuTypeTone(menu.type)}>{menuTypeLabel(menu.type)}</StatusBadge>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <DetailLine label="父级节点" value={menu.parent_name ?? '根节点'} />
              <DetailLine label="路由路径" value={menu.path ?? '暂无'} />
              <DetailLine label="组件标识" value={menu.component ?? '暂无'} />
              <DetailLine label="图标标识" value={menu.icon ?? '暂无'} />
              <DetailLine label="权限编码" value={menu.permission_code ?? '无需权限'} />
              <DetailLine label="排序号" value={`${menu.sort_order}`} />
              <DetailLine label="更新时间" value={formatDateTime(menu.updated_at)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone={booleanTone(menu.enabled)}>{booleanLabel(menu.enabled, '已启用', '已停用')}</StatusBadge>
              <StatusBadge tone={booleanTone(menu.visible)}>{booleanLabel(menu.visible, '导航可见', '导航隐藏')}</StatusBadge>
              <StatusBadge tone="planned">{menu.child_count} 个子节点</StatusBadge>
              <StatusBadge tone="planned">{menu.role_count} 个角色</StatusBadge>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border bg-background p-4">
            <div className="text-sm font-semibold">关联信息</div>
            {'children' in menu && menu.children.length > 0 ? (
              <div className="grid gap-2">
                {menu.children.slice(0, 6).map((child) => (
                  <div className="flex items-center justify-between rounded-md border bg-muted/15 px-3 py-2 text-sm" key={child.id}>
                    <span className="truncate">{child.name}</span>
                    <StatusBadge tone={menuTypeTone(child.type)}>{menuTypeLabel(child.type)}</StatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无子节点。</div>
            )}
            {'role_bindings' in menu && menu.role_bindings.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {menu.role_bindings.map((role) => (
                  <StatusBadge key={role.role_id} tone="mock">
                    {role.role_name}
                  </StatusBadge>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                暂无角色绑定，租户管理员仍可访问全部菜单。
              </div>
            )}
            <div className="flex justify-end">
              <Button disabled={!canWrite} onClick={() => onDelete(menu)} size="sm" variant="outline">
                <Trash2 className="size-4" />
                删除节点
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function RoleBindingCard({
  canWrite,
  draftMenuIds,
  flatTree,
  loading,
  onClear,
  onRoleChange,
  onSave,
  onSelectAll,
  onToggleMenu,
  pending,
  roleError,
  roles,
  selectedRole,
  selectedRoleId,
}: {
  canWrite: boolean;
  draftMenuIds: string[];
  flatTree: MenuTreeItem[];
  loading: boolean;
  onClear: () => void;
  onRoleChange: (roleId: string) => void;
  onSave: () => void;
  onSelectAll: () => void;
  onToggleMenu: (menuId: string) => void;
  pending: boolean;
  roleError: string | null;
  roles: RoleListItem[];
  selectedRole: RoleListItem | null;
  selectedRoleId: string | null;
}) {
  return (
    <Card className="min-w-0">
      <div className="flex flex-col justify-between gap-4 border-b p-4 lg:flex-row lg:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="size-4 text-blue-700" />
            <h2 className="text-sm font-semibold">角色菜单授权</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            菜单授权控制页面入口和按钮节点，接口权限仍由权限编码和后端 Guard 二次校验。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canWrite || loading || flatTree.length === 0} onClick={onSelectAll} size="sm" variant="outline">
            <Eye className="size-4" />
            全选当前树
          </Button>
          <Button disabled={!canWrite || loading} onClick={onClear} size="sm" variant="outline">
            <EyeOff className="size-4" />
            清空选择
          </Button>
          <Button disabled={!canWrite || !selectedRole || pending} onClick={onSave} size="sm">
            <Save className="size-4" />
            保存授权
          </Button>
        </div>
      </div>

      {roleError ? (
        <div className="mx-4 mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {roleError}
        </div>
      ) : null}

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载角色授权...</div>
      ) : roles.length === 0 ? (
        <EmptyState
          description="需要先在系统管理中准备角色，才能给角色分配菜单。"
          title="暂无角色"
        />
      ) : (
        <div className="grid gap-4 p-4 xl:grid-cols-[280px_1fr]">
          <div className="grid content-start gap-2">
            {roles.map((role) => (
              <button
                className={cn(
                  'rounded-lg border px-3 py-3 text-left text-sm transition-colors',
                  selectedRoleId === role.id
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                    : 'bg-background hover:bg-muted/40',
                )}
                key={role.id}
                onClick={() => onRoleChange(role.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{role.name}</span>
                  <StatusBadge tone="planned">{role.menu_count ?? 0}</StatusBadge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{role.code}</div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
              <div className="text-sm">
                当前角色：<span className="font-medium">{selectedRole?.name ?? '未选择'}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                已选择 {draftMenuIds.length} / {flatTree.length}
              </div>
            </div>
            <div className="grid max-h-[420px] gap-1 overflow-y-auto p-3">
              {flatTree.map((menu) => (
                <label
                  className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-sm hover:border-slate-200 hover:bg-white/70"
                  key={menu.id}
                  style={{ paddingLeft: `${12 + (menu.level - 1) * 20}px` }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      checked={draftMenuIds.includes(menu.id)}
                      disabled={!canWrite}
                      onChange={() => onToggleMenu(menu.id)}
                      type="checkbox"
                    />
                    <span className="truncate">{menu.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusBadge tone={menuTypeTone(menu.type)}>{menuTypeLabel(menu.type)}</StatusBadge>
                    {menu.permission_code ? (
                      <span className="text-xs text-muted-foreground">{menu.permission_code}</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
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

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[72%] break-words text-right font-medium">{value}</span>
    </div>
  );
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

function toMenuPayload(values: MenuFormValues): UpdateMenuInput {
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
