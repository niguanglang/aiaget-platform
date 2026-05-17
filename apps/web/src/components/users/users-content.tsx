'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type UserListItem, type UserStatus } from '@aiaget/shared-types';
import { Edit, Eye, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime } from '@/components/agents/agent-status';
import { ConfirmDialog, flattenDepartments } from '@/components/users/user-ia-shared';
import { userStatusLabel, userStatusTone } from '@/components/users/user-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteUser, getDepartmentTree, listRoles, listUsers, type ApiClientError } from '@/lib/api-client';

const statuses: UserStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];

export function UsersContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManageUsers = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:user:manage'),
  );

  const usersQuery = useQuery({
    queryKey: ['users-center', keyword, status, departmentId],
    queryFn: () =>
      listUsers({
        department_id: departmentId,
        keyword,
        page: 1,
        page_size: 50,
        status,
      }),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles({ page: 1, page_size: 200 }),
  });

  const departmentsQuery = useQuery({
    queryKey: ['department-tree'],
    queryFn: getDepartmentTree,
  });

  const users = usersQuery.data?.items ?? [];
  const roles = rolesQuery.data?.items ?? [];
  const departments = flattenDepartments(departmentsQuery.data ?? []);

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      setDeleteTarget(null);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['users-center'] });
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const metrics = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === 'ACTIVE');
    const disabledUsers = users.filter((user) => user.status === 'DISABLED');
    const assignedDepartments = users.filter((user) => user.department_id);
    const roleBindings = users.reduce((sum, user) => sum + user.roles.length, 0);

    return [
      { label: '用户总数', value: `${usersQuery.data?.total ?? users.length}` },
      { label: '启用用户', value: `${activeUsers.length}` },
      { label: '停用用户', value: `${disabledUsers.length}` },
      { label: '部门归属', value: `${assignedDepartments.length}` },
      { label: '角色绑定', value: `${roleBindings}` },
      { label: '可用角色', value: `${roles.length}` },
    ];
  }, [roles.length, users, usersQuery.data?.total]);

  function refreshAll() {
    void Promise.all([
      usersQuery.refetch(),
      rolesQuery.refetch(),
      departmentsQuery.refetch(),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setDepartmentId('');
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">系统管理</StatusBadge>
            <StatusBadge tone="healthy">用户主体</StatusBadge>
            <StatusBadge tone={canManageUsers ? 'mock' : 'planned'}>
              {canManageUsers ? '可管理' : '仅查看'}
            </StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">用户管理中心</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageUsers ? (
            <Button asChild>
              <Link href="/users/create">
                <Plus className="size-4" />
                新建用户
              </Link>
            </Button>
          ) : (
            <Button disabled>
              <Plus className="size-4" />
              新建用户
            </Button>
          )}
          <Button onClick={refreshAll} type="button" variant="outline">
            <RefreshCw className="size-4" />
            刷新
          </Button>
        </div>
      </section>

      {actionError || usersQuery.isError || rolesQuery.isError || departmentsQuery.isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError ?? '用户管理数据加载失败，请检查接口权限。'}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {usersQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => <div className="h-24 rounded-xl border border-slate-200/80 bg-white/[0.9]" key={index} />)
          : metrics.map((metric) => <MetricTile key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <Card className="grid gap-4 rounded-xl border border-slate-200/80 bg-white/[0.9] p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-sm font-semibold">用户清单</h2>
          <div className="grid gap-2 md:grid-cols-[1fr_140px_180px_auto]">
            <label className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                className="min-w-0 bg-transparent outline-none"
                onChange={(event) => setKeyword(event.target.value)}
                aria-label="搜索名称或邮箱"
                value={keyword}
              />
            </label>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="">全部状态</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {userStatusLabel(item)}
                </option>
              ))}
            </select>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setDepartmentId(event.target.value)} value={departmentId}>
              <option value="">全部部门</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {'　'.repeat(Math.max(0, department.level - 1))}
                  {department.name}
                </option>
              ))}
            </select>
            <Button onClick={clearFilters} type="button" variant="outline">
              清空
            </Button>
          </div>
        </div>

        {usersQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">正在加载用户...</div>
        ) : users.length === 0 ? (
          <EmptyState
            action={
              canManageUsers ? (
                <Button asChild>
                  <Link href="/users/create">
                    <Plus className="size-4" />
                    新建用户
                  </Link>
                </Button>
              ) : null
            }
            title="暂无用户"
          />
        ) : (
          <UserTable
            canManageUsers={canManageUsers}
            currentUserId={currentUser?.user.id ?? null}
            onDelete={setDeleteTarget}
            users={users}
          />
        )}
      </Card>

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除 ${deleteTarget.email}，用户无法继续登录，但审计历史会保留。`}
          pending={deleteMutation.isPending}
          title="删除用户？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function UserTable({
  canManageUsers,
  currentUserId,
  onDelete,
  users,
}: {
  canManageUsers: boolean;
  currentUserId: string | null;
  onDelete: (user: UserListItem) => void;
  users: UserListItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['用户', '部门', '状态', '角色', '最近登录', '更新时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentUser = currentUserId === user.id;

            return (
              <tr className="border-b transition-colors last:border-0 hover:bg-muted/25" key={user.id}>
                <td className="px-4 py-3">
                  <div className="grid max-w-sm gap-1">
                    <Link className="font-medium hover:text-primary" href={`/users/${user.id}`}>
                      {user.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.department?.name ?? '未归属'}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={userStatusTone(user.status)}>{userStatusLabel(user.status)}</StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-[260px] flex-wrap gap-1">
                    {user.roles.slice(0, 3).map((role) => (
                      <span className="rounded-md border px-2 py-0.5 text-xs" key={role.id}>
                        {role.name}
                      </span>
                    ))}
                    {user.roles.length > 3 ? (
                      <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                        +{user.roles.length - 3}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.last_login_at ? formatDateTime(user.last_login_at) : '从未登录'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(user.updated_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" type="button" variant="outline">
                      <Link href={`/users/${user.id}`}>
                        <Eye className="size-4" />
                        查看
                      </Link>
                    </Button>
                    <Button
                      asChild
                      aria-disabled={!canManageUsers || user.status === 'DELETED'}
                      className={!canManageUsers || user.status === 'DELETED' ? 'pointer-events-none opacity-60' : undefined}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Link href={`/users/${user.id}/edit`}>
                        <Edit className="size-4" />
                        编辑
                      </Link>
                    </Button>
                    <Button
                      disabled={!canManageUsers || isCurrentUser || user.status === 'DELETED'}
                      onClick={() => onDelete(user)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Trash2 className="size-4" />
                      删除
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
