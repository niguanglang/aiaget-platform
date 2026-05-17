'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type UpdateUserInput } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { flattenDepartments } from '@/components/users/user-ia-shared';
import { UserFormPanel, type UserFormValues } from '@/components/users/user-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDepartmentTree, getUser, listRoles, updateUser, type ApiClientError } from '@/lib/api-client';

export function UserEditContent({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canManageUsers = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:user:manage'),
  );

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles({ page: 1, page_size: 200 }),
  });

  const departmentsQuery = useQuery({
    queryKey: ['department-tree'],
    queryFn: getDepartmentTree,
  });

  const roles = rolesQuery.data?.items ?? [];
  const departments = flattenDepartments(departmentsQuery.data ?? []);

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: async (user) => {
      queryClient.setQueryData(['user', user.id], user);
      await queryClient.invalidateQueries({ queryKey: ['users-center'] });
      router.push(`/users/${user.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: UserFormValues) {
    setFormError(null);
    updateMutation.mutate({
      id: userId,
      input: {
        department_id: values.department_id || null,
        name: values.name.trim(),
        password: values.password?.trim() || undefined,
        roleCodes: values.roleCodes,
        status: values.status,
      },
    });
  }

  const user = userQuery.data;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <section>
        <Button asChild className="mb-4 w-fit" variant="outline">
          <Link href={`/users/${userId}`}>
            <ArrowLeft className="size-4" />
            用户详情
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone="ready">编辑页</StatusBadge>
          <StatusBadge tone={canManageUsers ? 'healthy' : 'degraded'}>
            {canManageUsers ? '可编辑' : '只读权限'}
          </StatusBadge>
        </div>
        <h1 className="text-2xl font-semibold">编辑用户</h1>
      </section>

      {userQuery.isError || rolesQuery.isError || departmentsQuery.isError ? (
        <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-destructive">用户编辑数据加载失败。</div>
      ) : userQuery.isLoading || rolesQuery.isLoading || departmentsQuery.isLoading ? (
        <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-muted-foreground">正在加载用户、部门和角色...</div>
      ) : !canManageUsers ? (
        <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-muted-foreground">
          当前账号没有编辑用户权限。
        </div>
      ) : user ? (
        <UserFormPanel
          canManage={canManageUsers}
          departments={departments}
          error={formError}
          isPending={updateMutation.isPending}
          mode="edit"
          onClose={() => router.push(`/users/${userId}`)}
          onSubmit={submitForm}
          presentation="page"
          roles={roles}
          user={user}
        />
      ) : null}
    </main>
  );
}
