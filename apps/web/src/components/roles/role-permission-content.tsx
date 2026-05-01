'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type CreateRoleInput,
  type PermissionCatalogGroup,
  type PermissionCatalogItem,
  type RoleDetail,
  type RoleListItem,
  type RoleStatus,
  type UpdateRoleInput,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  Edit,
  KeyRound,
  ListTree,
  Plus,
  Power,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { RoleCenterBackground } from '@/components/roles/role-center-background';
import { RoleFormPanel, type RoleFormValues } from '@/components/roles/role-form-panel';
import { actionLabel, formatDateTime, roleStatusLabel, roleStatusTone } from '@/components/roles/role-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createRole,
  deleteRole,
  disableRole,
  enableRole,
  getRole,
  getRoleOverview,
  listRolePermissionCatalog,
  listRoles,
  updateRole,
  updateRolePermissions,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

const statuses: RoleStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];

export function RolePermissionContent() {
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleListItem | RoleDetail | null>(null);
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:role:manage'),
  );

  const overviewQuery = useQuery({
    queryKey: ['role-overview'],
    queryFn: getRoleOverview,
  });
  const rolesQuery = useQuery({
    queryKey: ['roles', keyword, status],
    queryFn: () =>
      listRoles({
        page: 1,
        page_size: 200,
        keyword,
        status,
      }),
  });
  const catalogQuery = useQuery({
    queryKey: ['role-permission-catalog'],
    queryFn: listRolePermissionCatalog,
  });
  const selectedRoleQuery = useQuery({
    enabled: Boolean(selectedRoleId),
    queryKey: ['role', selectedRoleId],
    queryFn: () => getRole(selectedRoleId ?? ''),
  });

  const roles = rolesQuery.data?.items ?? [];
  const catalog = catalogQuery.data ?? [];
  const selectedRole = selectedRoleQuery.data ?? roles.find((role) => role.id === selectedRoleId) ?? null;
  const selectedRoleIsAdmin = selectedRole?.code === 'tenant_admin';
  const allPermissionIds = useMemo(() => flattenPermissionCatalog(catalog).map((permission) => permission.id), [catalog]);

  useEffect(() => {
    if (!selectedRoleId && roles[0]) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if ('permissions' in (selectedRole ?? {})) {
      setDraftPermissionIds((selectedRole as RoleDetail).permissions.map((permission) => permission.id));
    } else {
      setDraftPermissionIds([]);
    }
  }, [selectedRole]);

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: async (role) => {
      setSelectedRoleId(role.id);
      await refreshRoles();
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateRoleInput }) => updateRole(id, values),
    onSuccess: async (role) => {
      queryClient.setQueryData(['role', role.id], role);
      setSelectedRoleId(role.id);
      await refreshRoles();
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableRole(id) : disableRole(id),
    onSuccess: async (role) => {
      queryClient.setQueryData(['role', role.id], role);
      setActionError(null);
      await refreshRoles();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      setDeleteTarget(null);
      setSelectedRoleId(null);
      setActionError(null);
      await refreshRoles();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const permissionMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      updateRolePermissions(roleId, { permission_ids: permissionIds }),
    onSuccess: async (role) => {
      queryClient.setQueryData(['role', role.id], role);
      setPermissionError(null);
      await refreshRoles();
      await refreshCurrentUser();
    },
    onError: (error: ApiClientError) => setPermissionError(error.message),
  });

  async function refreshRoles() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['role-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['roles'] }),
      queryClient.invalidateQueries({ queryKey: ['role-permission-catalog'] }),
      queryClient.invalidateQueries({ queryKey: ['menu-role-bindings'] }),
      refreshCurrentUser(),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
  }

  function openCreateForm() {
    setFormError(null);
    setEditingRole(null);
    setFormMode('create');
  }

  async function openEditForm(role: RoleListItem | RoleDetail) {
    setFormError(null);
    const detail =
      'permissions' in role
        ? role
        : await queryClient.fetchQuery({
            queryKey: ['role', role.id],
            queryFn: () => getRole(role.id),
          });

    setEditingRole(detail);
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode(null);
    setEditingRole(null);
    setFormError(null);
  }

  function submitForm(values: RoleFormValues) {
    const payload = {
      name: values.name.trim(),
      description: nullableText(values.description),
      status: values.status,
    };

    if (formMode === 'create') {
      createMutation.mutate({
        ...payload,
        code: values.code.trim(),
        permission_ids: [],
      } as CreateRoleInput);
      return;
    }

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, values: payload });
    }
  }

  function togglePermission(permissionId: string) {
    setDraftPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    );
  }

  function selectModulePermissions(group: PermissionCatalogGroup) {
    const moduleIds = group.resources.flatMap((resource) => resource.permissions.map((permission) => permission.id));
    setDraftPermissionIds((current) => Array.from(new Set([...current, ...moduleIds])));
  }

  function clearModulePermissions(group: PermissionCatalogGroup) {
    const moduleIds = new Set(group.resources.flatMap((resource) => resource.permissions.map((permission) => permission.id)));
    setDraftPermissionIds((current) => current.filter((permissionId) => !moduleIds.has(permissionId)));
  }

  function savePermissions() {
    if (!selectedRole) return;
    permissionMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: draftPermissionIds,
    });
  }

  const overview = overviewQuery.data;
  const metrics = [
    { label: '角色总数', value: `${overview?.total ?? rolesQuery.data?.total ?? 0}`, helper: `${overview?.custom_count ?? 0} 个自定义` },
    { label: '启用角色', value: `${overview?.active_count ?? 0}`, helper: `${overview?.disabled_count ?? 0} 个停用` },
    { label: '用户绑定', value: `${overview?.user_binding_count ?? 0}`, helper: '用户角色关系' },
    { label: '权限绑定', value: `${overview?.permission_binding_count ?? 0}`, helper: `${overview?.menu_binding_count ?? 0} 个菜单绑定` },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <RoleCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M34</StatusBadge>
            <StatusBadge tone="healthy">RBAC 授权</StatusBadge>
            <StatusBadge tone="planned">权限编码矩阵</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">角色权限中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            维护租户角色、接口权限、菜单引用和用户绑定，形成菜单可见、按钮可点、接口可控的权限闭环。
          </p>
        </div>
        <Button className="w-full md:w-auto" disabled={!canWrite} onClick={openCreateForm}>
          <Plus className="size-4" />
          新建角色
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

      <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-sm font-semibold">角色目录</h2>
                  <p className="mt-1 text-sm text-muted-foreground">按角色名称、编码和状态筛选租户内角色。</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {roles.length} / {rolesQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-[1fr_160px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索角色名称、编码"
                    value={keyword}
                  />
                </label>
                <select
                  className="h-9 rounded-md border bg-background/80 px-3 text-sm"
                  onChange={(event) => setStatus(event.target.value)}
                  value={status}
                >
                  <option value="">全部状态</option>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {roleStatusLabel(item)}
                    </option>
                  ))}
                </select>
                <Button onClick={clearFilters} type="button" variant="outline">
                  清空
                </Button>
              </div>
            </div>
          </div>

          {rolesQuery.isError ? (
            <div className="p-6 text-sm text-destructive">角色目录加载失败。</div>
          ) : rolesQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载角色目录...</div>
          ) : roles.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canWrite} onClick={openCreateForm}>
                  <Plus className="size-4" />
                  新建角色
                </Button>
              }
              description="当前筛选条件没有匹配角色，可以清空筛选或新建自定义角色。"
              title="暂无角色"
            />
          ) : (
            <RoleTable
              canWrite={canWrite}
              onDelete={setDeleteTarget}
              onEdit={(role) => void openEditForm(role)}
              onSelect={setSelectedRoleId}
              onToggle={(role) =>
                statusMutation.mutate({
                  id: role.id,
                  nextStatus: role.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
              pending={statusMutation.isPending}
              roles={roles}
              selectedRoleId={selectedRoleId}
            />
          )}
        </Card>

        <RoleDetailCard
          canWrite={canWrite}
          loading={selectedRoleQuery.isLoading}
          onDelete={setDeleteTarget}
          onEdit={(role) => void openEditForm(role)}
          onToggle={(role) =>
            statusMutation.mutate({
              id: role.id,
              nextStatus: role.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
            })
          }
          pending={statusMutation.isPending}
          role={selectedRole}
        />
      </section>

      <PermissionMatrix
        allPermissionIds={allPermissionIds}
        canWrite={canWrite && !selectedRoleIsAdmin}
        catalog={catalog}
        draftPermissionIds={draftPermissionIds}
        loading={catalogQuery.isLoading || selectedRoleQuery.isLoading}
        onClearAll={() => setDraftPermissionIds([])}
        onClearModule={clearModulePermissions}
        onSave={savePermissions}
        onSelectAll={() => setDraftPermissionIds(allPermissionIds)}
        onSelectModule={selectModulePermissions}
        onTogglePermission={togglePermission}
        pending={permissionMutation.isPending}
        permissionError={permissionError}
        selectedRole={selectedRole}
      />

      {formMode ? (
        <RoleFormPanel
          error={formError}
          isPending={createMutation.isPending || updateMutation.isPending}
          mode={formMode}
          onClose={closeForm}
          onSubmit={submitForm}
          role={editingRole}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除角色「${deleteTarget.name}」。系统角色或已绑定用户的角色会被后端拒绝删除。`}
          pending={deleteMutation.isPending}
          title="删除角色？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function RoleTable({
  canWrite,
  onDelete,
  onEdit,
  onSelect,
  onToggle,
  pending,
  roles,
  selectedRoleId,
}: {
  canWrite: boolean;
  onDelete: (role: RoleListItem) => void;
  onEdit: (role: RoleListItem) => void;
  onSelect: (id: string) => void;
  onToggle: (role: RoleListItem) => void;
  pending: boolean;
  roles: RoleListItem[];
  selectedRoleId: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['角色', '状态', '类型', '用户', '权限', '菜单', '更新时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((role, index) => (
            <motion.tr
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25',
                selectedRoleId === role.id && 'bg-blue-50/55',
              )}
              initial={{ opacity: 0, y: 8 }}
              key={role.id}
              onClick={() => onSelect(role.id)}
              transition={{ delay: index * 0.02, duration: 0.2 }}
            >
              <td className="px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{role.name}</div>
                  <div className="text-xs text-muted-foreground">{role.code}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={roleStatusTone(role.status)}>{roleStatusLabel(role.status)}</StatusBadge>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={role.is_system ? 'mock' : 'planned'}>{role.is_system ? '系统角色' : '自定义角色'}</StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{role.user_count}</td>
              <td className="px-4 py-3 text-muted-foreground">{role.permission_count}</td>
              <td className="px-4 py-3 text-muted-foreground">{role.menu_count}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(role.updated_at)}</td>
              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                <div className="flex gap-2">
                  <Button disabled={!canWrite} onClick={() => onEdit(role)} size="sm" title="编辑" variant="outline">
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    disabled={!canWrite || pending || (role.is_system && role.status === 'ACTIVE')}
                    onClick={() => onToggle(role)}
                    size="sm"
                    title={role.status === 'ACTIVE' ? '停用' : '启用'}
                    variant="outline"
                  >
                    <Power className="size-4" />
                  </Button>
                  <Button
                    disabled={!canWrite || role.is_system || role.user_count > 0}
                    onClick={() => onDelete(role)}
                    size="sm"
                    title="删除"
                    variant="outline"
                  >
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

function RoleDetailCard({
  canWrite,
  loading,
  onDelete,
  onEdit,
  onToggle,
  pending,
  role,
}: {
  canWrite: boolean;
  loading: boolean;
  onDelete: (role: RoleListItem | RoleDetail) => void;
  onEdit: (role: RoleListItem | RoleDetail) => void;
  onToggle: (role: RoleListItem | RoleDetail) => void;
  pending: boolean;
  role: RoleListItem | RoleDetail | null;
}) {
  return (
    <Card className="min-w-0 p-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-sm font-semibold">角色详情</h2>
          <p className="mt-1 text-sm text-muted-foreground">查看角色状态、用户引用、菜单引用和权限数量。</p>
        </div>
        {role ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={!canWrite} onClick={() => onEdit(role)} size="sm" variant="outline">
              <Edit className="size-4" />
              编辑
            </Button>
            <Button
              disabled={!canWrite || pending || (role.is_system && role.status === 'ACTIVE')}
              onClick={() => onToggle(role)}
              size="sm"
              variant="outline"
            >
              <Power className="size-4" />
              {role.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-muted-foreground">正在加载角色详情...</div>
      ) : !role ? (
        <EmptyState
          className="py-8"
          description="从左侧角色目录选择一个角色，查看用户、菜单和权限绑定。"
          title="未选择角色"
        />
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="rounded-lg border bg-muted/15 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{role.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{role.code}</div>
              </div>
              <StatusBadge tone={roleStatusTone(role.status)}>{roleStatusLabel(role.status)}</StatusBadge>
            </div>
            <p className="mt-3 min-h-10 text-sm leading-6 text-muted-foreground">
              {role.description || '暂无角色描述。'}
            </p>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <DetailLine label="角色类型" value={role.is_system ? '系统角色' : '自定义角色'} />
              <DetailLine label="绑定用户" value={`${role.user_count}`} />
              <DetailLine label="接口权限" value={`${role.permission_count}`} />
              <DetailLine label="菜单入口" value={`${role.menu_count}`} />
              <DetailLine label="创建时间" value={formatDateTime(role.created_at)} />
              <DetailLine label="更新时间" value={formatDateTime(role.updated_at)} />
            </div>
          </div>

          {'users' in role ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ReferencePanel
                emptyText="暂无用户绑定。"
                icon={<UsersRound className="size-4 text-blue-700" />}
                title="用户引用"
              >
                {role.users.slice(0, 6).map((user) => (
                  <div className="rounded-md border bg-background px-3 py-2 text-sm" key={user.id}>
                    <div className="font-medium">{user.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge tone={user.status === 'ACTIVE' ? 'healthy' : 'planned'}>
                        {user.status === 'ACTIVE' ? '启用' : '停用'}
                      </StatusBadge>
                      <StatusBadge tone="planned">{user.department?.name ?? '未归属部门'}</StatusBadge>
                    </div>
                  </div>
                ))}
              </ReferencePanel>

              <ReferencePanel
                emptyText="暂无菜单绑定。"
                icon={<ListTree className="size-4 text-blue-700" />}
                title="菜单引用"
              >
                {role.menus.slice(0, 8).map((menu) => (
                  <div className="rounded-md border bg-background px-3 py-2 text-sm" key={menu.id}>
                    <div className="font-medium">{menu.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{menu.path ?? menu.code}</div>
                  </div>
                ))}
              </ReferencePanel>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              选择角色后会显示用户和菜单引用详情。
            </div>
          )}

          <div className="flex justify-end">
            <Button disabled={!canWrite || role.is_system || role.user_count > 0} onClick={() => onDelete(role)} size="sm" variant="outline">
              <Trash2 className="size-4" />
              删除角色
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function PermissionMatrix({
  allPermissionIds,
  canWrite,
  catalog,
  draftPermissionIds,
  loading,
  onClearAll,
  onClearModule,
  onSave,
  onSelectAll,
  onSelectModule,
  onTogglePermission,
  pending,
  permissionError,
  selectedRole,
}: {
  allPermissionIds: string[];
  canWrite: boolean;
  catalog: PermissionCatalogGroup[];
  draftPermissionIds: string[];
  loading: boolean;
  onClearAll: () => void;
  onClearModule: (group: PermissionCatalogGroup) => void;
  onSave: () => void;
  onSelectAll: () => void;
  onSelectModule: (group: PermissionCatalogGroup) => void;
  onTogglePermission: (permissionId: string) => void;
  pending: boolean;
  permissionError: string | null;
  selectedRole: RoleListItem | RoleDetail | null;
}) {
  return (
    <Card className="min-w-0">
      <div className="flex flex-col justify-between gap-4 border-b p-4 lg:flex-row lg:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="size-4 text-blue-700" />
            <h2 className="text-sm font-semibold">权限编码矩阵</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            权限按模块和资源分组，保存后会立即影响后端 Guard；菜单授权仍在菜单中心维护。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canWrite || loading || allPermissionIds.length === 0} onClick={onSelectAll} size="sm" variant="outline">
            <KeyRound className="size-4" />
            全选权限
          </Button>
          <Button disabled={!canWrite || loading} onClick={onClearAll} size="sm" variant="outline">
            清空权限
          </Button>
          <Button disabled={!canWrite || !selectedRole || pending} onClick={onSave} size="sm">
            <Save className="size-4" />
            保存权限
          </Button>
        </div>
      </div>

      {permissionError ? (
        <div className="mx-4 mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {permissionError}
        </div>
      ) : null}

      {selectedRole?.code === 'tenant_admin' ? (
        <div className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          租户管理员是内置全权限角色，权限由种子数据维护，当前页面仅展示不允许修改。
        </div>
      ) : null}

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载权限目录...</div>
      ) : catalog.length === 0 ? (
        <EmptyState description="权限编码目录为空，请先确认后端权限种子数据。" title="暂无权限编码" />
      ) : (
        <div className="grid gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3">
            <div className="text-sm">
              当前角色：<span className="font-medium">{selectedRole?.name ?? '未选择'}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              已选择 {draftPermissionIds.length} / {allPermissionIds.length}
            </div>
          </div>

          <div className="columns-1 gap-4 lg:columns-2">
            {catalog.map((group, index) => (
              <motion.section
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 break-inside-avoid rounded-lg border bg-background/75"
                initial={{ opacity: 0, y: 8 }}
                key={group.module}
                transition={{ delay: index * 0.025, duration: 0.2 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                  <div>
                    <h3 className="text-sm font-semibold">{group.module_label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{group.module}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button disabled={!canWrite} onClick={() => onSelectModule(group)} size="sm" variant="outline">
                      全选
                    </Button>
                    <Button disabled={!canWrite} onClick={() => onClearModule(group)} size="sm" variant="outline">
                      清空
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 p-4">
                  {group.resources.map((resource) => (
                    <div className="rounded-md border bg-muted/10 p-3" key={`${group.module}-${resource.resource}`}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{resource.resource_label}</div>
                        <StatusBadge tone="planned">{resource.resource}</StatusBadge>
                      </div>
                      <div className="grid gap-2">
                        {resource.permissions.map((permission) => (
                          <PermissionCheckbox
                            checked={draftPermissionIds.includes(permission.id)}
                            disabled={!canWrite}
                            key={permission.id}
                            onToggle={() => onTogglePermission(permission.id)}
                            permission={permission}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function PermissionCheckbox({
  checked,
  disabled,
  onToggle,
  permission,
}: {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  permission: PermissionCatalogItem;
}) {
  return (
    <label
      className={cn(
        'flex min-h-11 items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
        checked ? 'border-blue-200 bg-blue-50/70' : 'border-slate-200 bg-background hover:bg-muted/30',
        disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span className="flex min-w-0 items-start gap-2">
        <input checked={checked} className="mt-1" disabled={disabled} onChange={onToggle} type="checkbox" />
        <span className="min-w-0">
          <span className="block truncate font-medium">{permission.name}</span>
          <span className="block break-all text-xs text-muted-foreground">{permission.code}</span>
        </span>
      </span>
      <StatusBadge tone={permission.action === 'view' ? 'healthy' : 'mock'}>{actionLabel(permission.action)}</StatusBadge>
    </label>
  );
}

function ReferencePanel({
  children,
  emptyText,
  icon,
  title,
}: {
  children: React.ReactNode;
  emptyText: string;
  icon: React.ReactNode;
  title: string;
}) {
  const isEmpty = Array.isArray(children) && children.length === 0;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {isEmpty ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="grid gap-2">{children}</div>
      )}
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

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[72%] break-words text-right font-medium">{value}</span>
    </div>
  );
}

function flattenPermissionCatalog(catalog: PermissionCatalogGroup[]) {
  return catalog.flatMap((group) => group.resources.flatMap((resource) => resource.permissions));
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
