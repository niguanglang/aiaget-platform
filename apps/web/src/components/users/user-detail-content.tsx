'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission } from '@aiaget/shared-types';
import { ArrowLeft, Edit, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime } from '@/components/agents/agent-status';
import { ConfirmDialog, DetailLine } from '@/components/users/user-ia-shared';
import { userStatusLabel, userStatusTone } from '@/components/users/user-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { deleteUser, getUser, type ApiClientError } from '@/lib/api-client';

export function UserDetailContent({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManageUsers = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:user:manage'),
  );

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      setDeleteOpen(false);
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: ['users-center'] });
      router.push('/users');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const user = userQuery.data;
  const isCurrentUser = currentUser?.user.id === userId;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/users">
              <ArrowLeft className="size-4" />
              用户管理中心
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">用户档案</StatusBadge>
            {user ? <StatusBadge tone={userStatusTone(user.status)}>{userStatusLabel(user.status)}</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">{user?.name ?? '用户详情'}</h1>
        </div>
        {user ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild disabled={!canManageUsers || user.status === 'DELETED'} variant="outline">
              <Link href={`/users/${user.id}/edit`}>
                <Edit className="size-4" />
                编辑
              </Link>
            </Button>
            <Button
              disabled={!canManageUsers || isCurrentUser || user.status === 'DELETED'}
              onClick={() => setDeleteOpen(true)}
              variant="outline"
            >
              <Trash2 className="size-4" />
              删除
            </Button>
          </div>
        ) : null}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {userQuery.isError ? (
        <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-destructive">用户详情加载失败。</Card>
      ) : userQuery.isLoading ? (
        <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-muted-foreground">正在加载用户详情...</Card>
      ) : !user ? (
        <EmptyState title="用户不存在" />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="用户状态" value={userStatusLabel(user.status)} />
            <MetricTile label="所属部门" value={user.department?.name ?? '未归属'} />
            <MetricTile label="角色数量" value={`${user.roles.length}`} />
            <MetricTile label="最近登录" value={user.last_login_at ? formatDateTime(user.last_login_at) : '从未登录'} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4">
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">基础信息</h2>
              </div>
              <div className="grid gap-3 rounded-lg border bg-muted/15 p-4">
                <DetailLine label="名称" value={user.name} />
                <DetailLine label="邮箱" value={user.email} />
                <DetailLine label="状态" value={userStatusLabel(user.status)} />
                <DetailLine label="部门" value={user.department?.name ?? '未归属'} />
                <DetailLine label="最近登录" value={user.last_login_at ? formatDateTime(user.last_login_at) : '从未登录'} />
                <DetailLine label="创建时间" value={formatDateTime(user.created_at)} />
                <DetailLine label="更新时间" value={formatDateTime(user.updated_at)} />
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="size-4 text-blue-700" />
                <h2 className="text-sm font-semibold">角色绑定</h2>
              </div>
              {user.roles.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无角色绑定。</div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {user.roles.map((role) => (
                    <div className="rounded-md border bg-background px-3 py-2 text-sm" key={role.id}>
                      <div className="font-medium">{role.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{role.code}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </>
      )}

      {deleteOpen && user ? (
        <ConfirmDialog
          body={`这会软删除 ${user.email}，用户无法继续登录，但审计历史会保留。`}
          pending={deleteMutation.isPending}
          title="删除用户？"
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate(user.id)}
        />
      ) : null}
    </main>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 break-words text-xl font-semibold">{value}</div>
    </div>
  );
}
