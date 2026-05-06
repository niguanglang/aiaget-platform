'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type RoleListItem, type RoleStatus } from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Edit, Eye, KeyRound, ListTree, Plus, Power, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { RoleCenterBackground } from '@/components/roles/role-center-background';
import { ConfirmDialog } from '@/components/roles/role-ia-shared';
import { formatDateTime, roleStatusLabel, roleStatusTone } from '@/components/roles/role-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteRole,
  disableRole,
  enableRole,
  getRoleOverview,
  listRoles,
  type ApiClientError,
} from '@/lib/api-client';

const statuses: RoleStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];

export function RolePermissionContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RoleListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const roles = rolesQuery.data?.items ?? [];
  const total = rolesQuery.data?.total ?? 0;

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
      setActionError(null);
      await refreshRoles();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  async function refreshRoles() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['role-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['roles'] }),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
  }

  const overview = overviewQuery.data;
  const metrics = useMemo(
    () => [
      {
        label: '角色总数',
        value: `${overview?.total ?? total}`,
        helper: `${overview?.custom_count ?? roles.filter((role) => !role.is_system).length} 个自定义`,
      },
      {
        label: '启用角色',
        value: `${overview?.active_count ?? roles.filter((role) => role.status === 'ACTIVE').length}`,
        helper: `${overview?.disabled_count ?? roles.filter((role) => role.status === 'DISABLED').length} 个停用`,
      },
      {
        label: '用户绑定',
        value: `${overview?.user_binding_count ?? roles.reduce((sum, role) => sum + role.user_count, 0)}`,
        helper: '用户角色关系',
      },
      {
        label: '权限绑定',
        value: `${overview?.permission_binding_count ?? roles.reduce((sum, role) => sum + role.permission_count, 0)}`,
        helper: `${overview?.menu_binding_count ?? roles.reduce((sum, role) => sum + role.menu_count, 0)} 个菜单绑定`,
      },
    ],
    [overview, roles, total],
  );

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
            <StatusBadge tone="ready">角色中心</StatusBadge>
            <StatusBadge tone="healthy">列表职责</StatusBadge>
            <StatusBadge tone="planned">授权独立配置</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">角色权限中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            列表页用于查询角色、识别状态和执行单条生命周期操作。完整详情、接口权限矩阵和菜单授权矩阵进入独立页面维护。
          </p>
        </div>
        {canWrite ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/roles/create">
              <Plus className="size-4" />
              新建角色
            </Link>
          </Button>
        ) : (
          <Button className="w-full md:w-auto" disabled>
            <Plus className="size-4" />
            新建角色
          </Button>
        )}
      </motion.section>

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.04, duration: 0.32, ease: 'easeOut' }}
      >
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </motion.section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <Card>
        <div className="border-b p-4">
          <div className="grid gap-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold">角色清单</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  搜索、筛选、启停角色，并进入详情页或独立配置页维护授权。
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                显示 {roles.length} / {total}
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
          <div className="p-6 text-sm text-destructive">角色清单加载失败。</div>
        ) : rolesQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载角色清单...</div>
        ) : roles.length === 0 ? (
          <EmptyState
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/roles/create">
                    <Plus className="size-4" />
                    新建角色
                  </Link>
                </Button>
              ) : null
            }
            description="当前筛选条件没有匹配角色，可以清空筛选或新建自定义角色。"
            title="暂无角色"
          />
        ) : (
          <RoleTable
            canWrite={canWrite}
            onDelete={setDeleteTarget}
            onToggle={(role) =>
              statusMutation.mutate({
                id: role.id,
                nextStatus: role.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
              })
            }
            pending={statusMutation.isPending}
            roles={roles}
          />
        )}
      </Card>

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
  onToggle,
  pending,
  roles,
}: {
  canWrite: boolean;
  onDelete: (role: RoleListItem) => void;
  onToggle: (role: RoleListItem) => void;
  pending: boolean;
  roles: RoleListItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
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
              className="border-b transition-colors last:border-0 hover:bg-muted/25"
              initial={{ opacity: 0, y: 8 }}
              key={role.id}
              transition={{ delay: index * 0.02, duration: 0.2 }}
            >
              <td className="px-4 py-3">
                <div className="grid max-w-md gap-1">
                  <Link className="font-medium hover:text-primary" href={`/roles/${role.id}`}>
                    {role.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{role.code}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">{role.description || '暂无描述'}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={roleStatusTone(role.status)}>{roleStatusLabel(role.status)}</StatusBadge>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={role.is_system ? 'mock' : 'planned'}>
                  {role.is_system ? '系统角色' : '自定义角色'}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{role.user_count}</td>
              <td className="px-4 py-3 text-muted-foreground">{role.permission_count}</td>
              <td className="px-4 py-3 text-muted-foreground">{role.menu_count}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(role.updated_at)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/roles/${role.id}`}>
                      <Eye className="size-4" />
                      查看
                    </Link>
                  </Button>
                  <Button
                    asChild
                    aria-disabled={!canWrite}
                    className={!canWrite ? 'pointer-events-none opacity-60' : undefined}
                    size="sm"
                    variant="outline"
                  >
                    <Link href={`/roles/${role.id}/edit`}>
                      <Edit className="size-4" />
                      编辑
                    </Link>
                  </Button>
                  <Button
                    asChild
                    aria-disabled={!canWrite || role.code === 'tenant_admin'}
                    className={!canWrite || role.code === 'tenant_admin' ? 'pointer-events-none opacity-60' : undefined}
                    size="sm"
                    variant="outline"
                  >
                    <Link href={`/roles/${role.id}/permissions`}>
                      <KeyRound className="size-4" />
                      权限
                    </Link>
                  </Button>
                  <Button
                    asChild
                    aria-disabled={!canWrite}
                    className={!canWrite ? 'pointer-events-none opacity-60' : undefined}
                    size="sm"
                    variant="outline"
                  >
                    <Link href={`/roles/${role.id}/menus`}>
                      <ListTree className="size-4" />
                      菜单
                    </Link>
                  </Button>
                  <Button
                    disabled={!canWrite || pending || role.status === 'DELETED' || (role.is_system && role.status === 'ACTIVE')}
                    onClick={() => onToggle(role)}
                    size="sm"
                    variant="outline"
                  >
                    <Power className="size-4" />
                    {role.status === 'ACTIVE' ? '停用' : '启用'}
                  </Button>
                  <Button
                    disabled={!canWrite || role.is_system || role.user_count > 0}
                    onClick={() => onDelete(role)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="size-4" />
                    删除
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
