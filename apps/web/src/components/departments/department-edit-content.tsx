'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type UpdateDepartmentInput } from '@aiaget/shared-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DepartmentCenterBackground } from '@/components/departments/department-center-background';
import { DepartmentFormPanel, type DepartmentFormValues } from '@/components/departments/department-form-panel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDepartment, getDepartmentTree, listUsers, updateDepartment, type ApiClientError } from '@/lib/api-client';
import { nullableText } from './department-ia-shared';

export function DepartmentEditContent({ departmentId }: { departmentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:department:manage'),
  );

  const departmentQuery = useQuery({
    queryKey: ['department', departmentId],
    queryFn: () => getDepartment(departmentId),
  });

  const treeQuery = useQuery({
    queryKey: ['department-tree'],
    queryFn: getDepartmentTree,
  });

  const leadersQuery = useQuery({
    queryKey: ['department-leaders'],
    queryFn: () => listUsers({ page: 1, page_size: 100, status: 'ACTIVE' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateDepartmentInput }) => updateDepartment(id, values),
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
    updateMutation.mutate({
      id: departmentId,
      values: {
        parent_id: nullableText(values.parent_id),
        description: nullableText(values.description),
        leader_user_id: nullableText(values.leader_user_id),
        name: values.name.trim(),
        sort_order: values.sort_order,
        status: values.status,
      },
    });
  }

  const department = departmentQuery.data;

  return (
    <main className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:px-6">
      <DepartmentCenterBackground />

      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href={`/departments/${departmentId}`}>
              <ArrowLeft className="size-4" />
              部门详情
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">编辑页</StatusBadge>
            <StatusBadge tone={canWrite ? 'healthy' : 'degraded'}>{canWrite ? '可编辑' : '只读权限'}</StatusBadge>
            {department?.status ? <StatusBadge tone={department.status === 'ACTIVE' ? 'healthy' : 'planned'}>{department.status}</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">编辑部门</h1>
        </div>
      </section>

      {departmentQuery.isError || treeQuery.isError || leadersQuery.isError ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-destructive">部门编辑数据加载失败。</div>
      ) : departmentQuery.isLoading || treeQuery.isLoading || leadersQuery.isLoading ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">正在加载部门、组织树和负责人...</div>
      ) : !canWrite ? (
        <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
          当前账号没有编辑部门权限。
        </div>
      ) : department ? (
        <DepartmentFormPanel
          department={department}
          departmentTree={treeQuery.data ?? []}
          error={formError}
          isPending={updateMutation.isPending}
          leaders={leadersQuery.data?.items ?? []}
          mode="edit"
          onClose={() => router.push(`/departments/${departmentId}`)}
          onSubmit={submitForm}
          presentation="page"
        />
      ) : null}
    </main>
  );
}
