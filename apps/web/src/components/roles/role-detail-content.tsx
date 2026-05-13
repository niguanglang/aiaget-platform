'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type RoleDetail } from '@aiaget/shared-types';
import { ArrowLeft, Edit, KeyRound, ListTree, Power, ShieldCheck, Trash2, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { RoleCenterBackground } from '@/components/roles/role-center-background';
import { ConfirmDialog, DetailLine, ReferencePanel } from '@/components/roles/role-ia-shared';
import { actionLabel, formatDateTime, roleStatusLabel, roleStatusTone } from '@/components/roles/role-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteRole, disableRole, enableRole, getRole, type ApiClientError } from '@/lib/api-client';

type RoleStatusTarget = {
  id: string;
  name: string;
  nextStatus: 'ACTIVE' | 'DISABLED';
};

export function RoleDetailContent({ roleId }: { roleId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<RoleDetail | null>(null);
  const [roleStatusTarget, setRoleStatusTarget] = useState<RoleStatusTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:role:manage'),
  );

  const roleQuery = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => getRole(roleId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableRole(id) : disableRole(id),
    onSuccess: async (role) => {
      queryClient.setQueryData(['role', role.id], role);
      setRoleStatusTarget(null);
      setActionError(null);
      await refreshRole();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      setDeleteTarget(null);
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['roles'] }),
        refreshCurrentUser(),
      ]);
      router.push('/roles');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  async function refreshRole() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['role', roleId] }),
      queryClient.invalidateQueries({ queryKey: ['role-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['roles'] }),
      refreshCurrentUser(),
    ]);
  }

  function confirmRoleStatusChange() {
    if (!roleStatusTarget) return;

    statusMutation.mutate({
      id: roleStatusTarget.id,
      nextStatus: roleStatusTarget.nextStatus,
    });
  }

  const role = roleQuery.data;
  const metrics = useMemo(
    () => [
      { label: '绑定用户', value: `${role?.user_count ?? 0}`, helper: '用户角色引用' },
      { label: '接口权限', value: `${role?.permission_count ?? 0}`, helper: '权限编码数量' },
      { label: '菜单入口', value: `${role?.menu_count ?? 0}`, helper: '目录和页面菜单' },
      { label: '角色类型', value: role?.is_system ? '系统' : '自定义', helper: role?.status ? roleStatusLabel(role.status) : '暂无' },
    ],
    [role],
  );

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <RoleCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/roles">
              <ArrowLeft className="size-4" />
              角色权限中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">角色档案</StatusBadge>
            {role ? <StatusBadge tone={roleStatusTone(role.status)}>{roleStatusLabel(role.status)}</StatusBadge> : null}
            {role?.is_system ? <StatusBadge tone="mock">系统角色</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">{role?.name ?? '角色详情'}</h1>
        </div>

        {role ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild disabled={!canWrite} variant="outline">
              <Link href={`/roles/${role.id}/edit`}>
                <Edit className="size-4" />
                编辑
              </Link>
            </Button>
            <Button
              asChild
              aria-disabled={!canWrite || role.code === 'tenant_admin'}
              className={!canWrite || role.code === 'tenant_admin' ? 'pointer-events-none opacity-60' : undefined}
              variant="outline"
            >
              <Link href={`/roles/${role.id}/permissions`}>
                <KeyRound className="size-4" />
                权限配置
              </Link>
            </Button>
            <Button
              asChild
              aria-disabled={!canWrite}
              className={!canWrite ? 'pointer-events-none opacity-60' : undefined}
              variant="outline"
            >
              <Link href={`/roles/${role.id}/menus`}>
                <ListTree className="size-4" />
                菜单授权
              </Link>
            </Button>
            <Button
              disabled={!canWrite || statusMutation.isPending || role.status === 'DELETED' || (role.is_system && role.status === 'ACTIVE')}
              onClick={() =>
                setRoleStatusTarget({
                  id: role.id,
                  name: role.name,
                  nextStatus: role.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
              variant="outline"
            >
              <Power className="size-4" />
              {role.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
          </div>
        ) : null}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {roleQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">角色详情加载失败。</Card>
      ) : roleQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载角色详情...</Card>
      ) : !role ? (
        <EmptyState description="未找到该角色，可能已被删除或无权限访问。" title="角色不存在" />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">基础信息</h2>
                  <p className="mt-1 text-sm text-muted-foreground">角色身份、状态和审计时间。</p>
                </div>
                <StatusBadge tone={roleStatusTone(role.status)}>{roleStatusLabel(role.status)}</StatusBadge>
              </div>

              <div className="mt-4 rounded-lg border bg-muted/15 p-4">
                <div className="text-lg font-semibold">{role.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{role.code}</div>
                <p className="mt-3 min-h-10 text-sm leading-6 text-muted-foreground">
                  {role.description || '暂无角色描述。'}
                </p>
                <div className="mt-4 grid gap-3 text-sm">
                  <DetailLine label="角色类型" value={role.is_system ? '系统角色' : '自定义角色'} />
                  <DetailLine label="租户 ID" value={role.tenant_id} />
                  <DetailLine label="创建时间" value={formatDateTime(role.created_at)} />
                  <DetailLine label="更新时间" value={formatDateTime(role.updated_at)} />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  disabled={!canWrite || role.is_system || role.user_count > 0}
                  onClick={() => setDeleteTarget(role)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="size-4" />
                  删除角色
                </Button>
              </div>
            </Card>

            <div className="grid gap-4">
              <ReferencePanel
                emptyText="暂无用户绑定。"
                icon={<UsersRound className="size-4 text-blue-700" />}
                title="用户引用"
              >
                {role.users.slice(0, 8).map((user) => (
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
                {role.menus.slice(0, 10).map((menu) => (
                  <div className="rounded-md border bg-background px-3 py-2 text-sm" key={menu.id}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{menu.name}</div>
                      <StatusBadge tone={menu.type === 'BUTTON' ? 'mock' : 'planned'}>{menu.type}</StatusBadge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{menu.path ?? menu.code}</div>
                    {menu.permission_code ? (
                      <div className="mt-1 break-all text-xs text-muted-foreground">{menu.permission_code}</div>
                    ) : null}
                  </div>
                ))}
              </ReferencePanel>
            </div>
          </section>

          <Card className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue-700" />
              <h2 className="text-sm font-semibold">权限编码</h2>
            </div>
            {role.permissions.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无接口权限绑定。</div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {role.permissions.slice(0, 24).map((permission) => (
                  <div className="rounded-md border bg-background px-3 py-2 text-sm" key={permission.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{permission.name}</span>
                      <StatusBadge tone={permission.action === 'view' ? 'healthy' : 'mock'}>
                        {actionLabel(permission.action)}
                      </StatusBadge>
                    </div>
                    <div className="mt-1 break-all text-xs text-muted-foreground">{permission.code}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除角色「${deleteTarget.name}」。系统角色或已绑定用户的角色会被后端拒绝删除。`}
          pending={deleteMutation.isPending}
          title="删除角色？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
      {roleStatusTarget ? (
        <ConfirmDialog
          body={
            roleStatusTarget.nextStatus === 'DISABLED'
              ? `确认更新角色状态：停用角色「${roleStatusTarget.name}」后，相关用户会失去该角色提供的菜单、接口和资源操作入口。`
              : `确认更新角色状态：启用角色「${roleStatusTarget.name}」后，相关用户会重新获得该角色配置的权限入口。`
          }
          confirmLabel={roleStatusTarget.nextStatus === 'DISABLED' ? '确认停用' : '确认启用'}
          pending={statusMutation.isPending}
          title="确认更新角色状态"
          onCancel={() => setRoleStatusTarget(null)}
          onConfirm={confirmRoleStatusChange}
        />
      ) : null}
    </main>
  );
}
