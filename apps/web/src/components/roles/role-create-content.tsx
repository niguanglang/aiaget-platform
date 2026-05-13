'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type CreateRoleInput } from '@aiaget/shared-types';
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
import { createRole, type ApiClientError } from '@/lib/api-client';

export function RoleCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:role:manage'),
  );

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: async (role) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['roles'] }),
        refreshCurrentUser(),
      ]);
      queryClient.setQueryData(['role', role.id], role);
      router.push(`/roles/${role.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: RoleFormValues) {
    setFormError(null);
    createMutation.mutate({
      code: values.code.trim(),
      description: nullableText(values.description),
      name: values.name.trim(),
      permission_ids: [],
      status: values.status,
    } satisfies CreateRoleInput);
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
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
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建角色</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            定义角色名称、编码、描述和启用状态。创建后可分配接口权限和菜单入口。
          </p>
        </div>
      </section>

      {!canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建角色权限。
        </div>
      ) : (
        <RoleFormPanel
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/roles')}
          onSubmit={submitForm}
          presentation="page"
        />
      )}
    </main>
  );
}
