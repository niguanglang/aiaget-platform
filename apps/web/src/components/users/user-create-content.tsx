'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type CreateUserInput } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { defaultRoleCodes, flattenDepartments } from '@/components/users/user-ia-shared';
import { UserFormPanel, type UserFormValues } from '@/components/users/user-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createUser, getDepartmentTree, listRoles, type ApiClientError } from '@/lib/api-client';

export function UserCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canManageUsers = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:user:manage'),
  );

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

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (user) => {
      queryClient.setQueryData(['user', user.id], user);
      await queryClient.invalidateQueries({ queryKey: ['users-center'] });
      router.push(`/users/${user.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: UserFormValues) {
    setFormError(null);

    if (!values.password?.trim()) {
      setFormError('新建用户必须设置初始密码。');
      return;
    }

    createMutation.mutate({
      department_id: values.department_id || null,
      email: values.email.trim(),
      name: values.name.trim(),
      password: values.password,
      roleCodes: values.roleCodes,
      status: values.status,
    } satisfies CreateUserInput);
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <section>
        <Button asChild className="mb-4 w-fit" variant="outline">
          <Link href="/users">
            <ArrowLeft className="size-4" />
            用户管理中心
          </Link>
        </Button>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge tone="ready">新增页</StatusBadge>
          <StatusBadge tone={canManageUsers ? 'healthy' : 'degraded'}>
            {canManageUsers ? '可编辑' : '只读权限'}
          </StatusBadge>
        </div>
        <h1 className="text-2xl font-semibold">新建用户</h1>
      </section>

      {!canManageUsers ? (
        <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-muted-foreground">
          当前账号没有新建用户权限。
        </div>
      ) : rolesQuery.isLoading || departmentsQuery.isLoading ? (
        <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-6 text-sm text-muted-foreground">正在加载部门和角色...</div>
      ) : (
        <UserFormPanel
          canManage={canManageUsers}
          departments={departments}
          error={formError}
          isPending={createMutation.isPending}
          mode="create"
          onClose={() => router.push('/users')}
          onSubmit={submitForm}
          presentation="page"
          roles={roles}
          user={{
            created_at: '',
            department: null,
            department_id: null,
            email: '',
            id: '',
            last_login_at: null,
            name: '',
            roles: roles.filter((role) => defaultRoleCodes(roles).includes(role.code)),
            status: 'ACTIVE',
            tenant_id: '',
            updated_at: '',
          }}
        />
      )}
    </main>
  );
}
