'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type CreateDepartmentInput } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DepartmentCenterBackground } from '@/components/departments/department-center-background';
import { DepartmentFormPanel, type DepartmentFormValues } from '@/components/departments/department-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { createDepartment, getDepartmentTree, listUsers, type ApiClientError } from '@/lib/api-client';
import { nullableText } from './department-ia-shared';

export function DepartmentCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:department:manage'),
  );

  const treeQuery = useQuery({
    queryKey: ['department-tree'],
    queryFn: getDepartmentTree,
  });

  const leadersQuery = useQuery({
    queryKey: ['department-leaders'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: async (department) => {
      queryClient.setQueryData(['department', department.id], department);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['department-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['department-tree'] }),
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
        queryClient.invalidateQueries({ queryKey: ['department-leaders'] }),
        refreshCurrentUser(),
      ]);
      router.push(`/departments/${department.id}`);
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  function submitForm(values: DepartmentFormValues) {
    setFormError(null);
    createMutation.mutate({
      parent_id: nullableText(values.parent_id),
      code: values.code.trim(),
      description: nullableText(values.description),
      leader_user_id: nullableText(values.leader_user_id),
      name: values.name.trim(),
      sort_order: values.sort_order,
      status: values.status,
    } satisfies CreateDepartmentInput);
  }

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <DepartmentCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/departments">
              <ArrowLeft className="size-4" />
              部门组织架构
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">新增页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">新建部门</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            创建新的部门节点，设置上级部门、负责人、编码、排序和启用状态。
          </p>
        </div>
      </section>

      {treeQuery.isError || leadersQuery.isError ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">部门创建数据加载失败。</div>
      ) : treeQuery.isLoading || leadersQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载部门和负责人...</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有新建部门权限。
        </div>
      ) : (
        <DepartmentFormPanel
          departmentTree={treeQuery.data ?? []}
          error={formError}
          isPending={createMutation.isPending}
          leaders={leadersQuery.data?.items ?? []}
          mode="create"
          onClose={() => router.push('/departments')}
          onSubmit={submitForm}
          parent={null}
          presentation="page"
        />
      )}
    </main>
  );
}

