'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type UpdateRoleInput } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { RoleCenterBackground } from '@/components/roles/role-center-background';
import { RoleFormPanel, type RoleFormValues } from '@/components/roles/role-form-panel';
import { nullableText } from '@/components/roles/role-ia-shared';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getRole, updateRole, type ApiClientError } from '@/lib/api-client';

export function RoleEditContent({ roleId }: { roleId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:role:manage'),
  );

  const roleQuery = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => getRole(roleId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateRoleInput }) => updateRole(id, values),
    onSuccess: async (role) => {
      queryClient.setQueryData(['role', role.id], role);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['roles'] }),
        refreshCurrentUser(),
      ]);
      router.push(`/roles/${role.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: RoleFormValues) {
    setFormError(null);
    updateMutation.mutate({
      id: roleId,
      values: {
        description: nullableText(values.description),
        name: values.name.trim(),
        status: values.status,
      },
    });
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <RoleCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={`/roles/${roleId}`}>
              <ArrowLeft className="size-4" />
              角色详情
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
            {roleQuery.data?.is_system ? <StatusBadge tone="mock">系统角色</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">编辑角色</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            修改角色基础信息和启用状态。角色编码创建后不可修改，接口权限和菜单授权在独立配置页维护。
          </p>
        </div>
      </section>

      {roleQuery.isError ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">角色信息加载失败。</div>
      ) : roleQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载角色信息...</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有编辑角色权限。
        </div>
      ) : (
        <RoleFormPanel
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/roles/${roleId}`)}
          onSubmit={submitForm}
          presentation="page"
          role={roleQuery.data}
        />
      )}
    </main>
  );
}
