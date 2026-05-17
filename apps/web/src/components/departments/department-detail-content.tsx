'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type DepartmentDetail, type DepartmentListItem } from '@aiaget/shared-types';
import { ArrowLeft, Edit, Power, Trash2, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { departmentStatusLabel, departmentStatusTone, formatDateTime } from '@/components/departments/department-status';
import { ConfirmDialog, DetailLine } from '@/components/roles/role-ia-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteDepartment,
  disableDepartment,
  enableDepartment,
  getDepartment,
  type ApiClientError,
} from '@/lib/api-client';

type DepartmentStatusTarget = {
  id: string;
  name: string;
  nextStatus: 'ACTIVE' | 'DISABLED';
};

export function DepartmentDetailContent({ departmentId }: { departmentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<DepartmentDetail | DepartmentListItem | null>(null);
  const [departmentStatusTarget, setDepartmentStatusTarget] = useState<DepartmentStatusTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:department:manage'),
  );

  const departmentQuery = useQuery({
    queryKey: ['department', departmentId],
    queryFn: () => getDepartment(departmentId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableDepartment(id) : disableDepartment(id),
    onSuccess: async (department) => {
      queryClient.setQueryData(['department', department.id], department);
      setDepartmentStatusTarget(null);
      setActionError(null);
      await refreshDepartment();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: async () => {
      setDeleteTarget(null);
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['department-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['department-tree'] }),
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
        refreshCurrentUser(),
      ]);
      router.push('/departments');
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  async function refreshDepartment() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['department', departmentId] }),
      queryClient.invalidateQueries({ queryKey: ['department-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['department-tree'] }),
      queryClient.invalidateQueries({ queryKey: ['departments'] }),
      refreshCurrentUser(),
    ]);
  }

  function confirmDepartmentStatusChange() {
    if (!departmentStatusTarget) return;

    statusMutation.mutate({
      id: departmentStatusTarget.id,
      nextStatus: departmentStatusTarget.nextStatus,
    });
  }

  const department = departmentQuery.data;
  const metrics = useMemo(
    () => [
      { label: '成员数量', value: `${department?.member_count ?? 0}`, helper: '已归属用户' },
      { label: '下级部门', value: `${department?.child_count ?? 0}`, helper: '组织树引用' },
      { label: '排序号', value: `${department?.sort_order ?? 0}`, helper: '列表排序' },
      { label: '状态', value: department ? departmentStatusLabel(department.status) : '暂无', helper: '组织状态' },
    ],
    [department],
  );

  return (
    <main className="mx-auto grid w-full max-w-none gap-6 bg-background px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button asChild className="mb-4 w-fit" variant="outline">
            <Link href="/departments">
              <ArrowLeft className="size-4" />
              部门组织架构
            </Link>
          </Button>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">部门档案</StatusBadge>
            {department ? <StatusBadge tone={departmentStatusTone(department.status)}>{departmentStatusLabel(department.status)}</StatusBadge> : null}
          </div>
          <h1 className="text-2xl font-semibold">{department?.name ?? '部门详情'}</h1>
        </div>

        {department ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild disabled={!canWrite || department.status === 'DELETED'} variant="outline">
              <Link href={`/departments/${department.id}/edit`}>
                <Edit className="size-4" />
                编辑
              </Link>
            </Button>
            <Button
              disabled={!canWrite || statusMutation.isPending || department.status === 'DELETED'}
              onClick={() =>
                setDepartmentStatusTarget({
                  id: department.id,
                  name: department.name,
                  nextStatus: department.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
              variant="outline"
            >
              <Power className="size-4" />
              {department.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
            <Button disabled={!canWrite || department.children.length > 0 || department.members.length > 0} onClick={() => setDeleteTarget(department)} variant="outline">
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

      {departmentQuery.isError ? (
        <Card className="p-6 text-sm text-destructive">部门详情加载失败。</Card>
      ) : departmentQuery.isLoading ? (
        <Card className="p-6 text-sm text-muted-foreground">正在加载部门详情...</Card>
      ) : !department ? (
        <EmptyState description="未找到该部门，可能已被删除或无权限访问。" title="部门不存在" />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <InfoTile helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">基础信息</h2>
                  <p className="mt-1 text-sm text-muted-foreground">组织身份、状态和审计时间。</p>
                </div>
                <StatusBadge tone={departmentStatusTone(department.status)}>{departmentStatusLabel(department.status)}</StatusBadge>
              </div>

              <div className="mt-4 rounded-lg border bg-muted/15 p-4">
                <div className="text-lg font-semibold">{department.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{department.code}</div>
                <p className="mt-3 min-h-10 text-sm leading-6 text-muted-foreground">
                  {department.description || '暂无部门描述。'}
                </p>
                <div className="mt-4 grid gap-3 text-sm">
                  <DetailLine label="父级部门" value={department.parent_name ?? '根部门'} />
                  <DetailLine label="负责人" value={department.leader?.name ?? '未指定'} />
                  <DetailLine label="成员数量" value={`${department.member_count}`} />
                  <DetailLine label="下级部门" value={`${department.child_count}`} />
                  <DetailLine label="创建时间" value={formatDateTime(department.created_at)} />
                  <DetailLine label="更新时间" value={formatDateTime(department.updated_at)} />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <UsersRound className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">组织关系</h2>
              </div>

              <div className="grid gap-4">
                <div className="rounded-md border bg-background p-4">
                  <div className="text-sm font-medium">下级部门</div>
                  {'children' in department && department.children.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {department.children.map((child) => (
                        <StatusBadge key={child.id} tone="mock">
                          {child.name}
                        </StatusBadge>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无下级部门。</div>
                  )}
                </div>

                <div className="rounded-md border bg-background p-4">
                  <div className="text-sm font-medium">成员列表</div>
                  {department.members.length > 0 ? (
                    <div className="mt-3 grid max-h-[260px] gap-2 overflow-y-auto">
                      {department.members.map((member) => (
                        <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/15 px-3 py-2 text-sm" key={member.id}>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{member.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                          </div>
                          <StatusBadge tone={member.status === 'ACTIVE' ? 'healthy' : 'planned'}>
                            {member.status === 'ACTIVE' ? '启用' : '停用'}
                          </StatusBadge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无成员。</div>
                  )}
                </div>
              </div>
            </Card>
          </section>
        </>
      )}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除 ${department?.name ?? '该部门'}，若存在成员或下级部门则不能删除。`}
          pending={deleteMutation.isPending}
          title="删除部门？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
      {departmentStatusTarget ? (
        <ConfirmDialog
          body={
            departmentStatusTarget.nextStatus === 'DISABLED'
              ? `确认更新部门状态：停用部门「${departmentStatusTarget.name}」后，该部门将不再作为可用组织属性参与新授权配置。`
              : `确认更新部门状态：启用部门「${departmentStatusTarget.name}」后，该部门会重新进入组织架构和 ABAC 属性范围。`
          }
          confirmLabel={departmentStatusTarget.nextStatus === 'DISABLED' ? '确认停用' : '确认启用'}
          pending={statusMutation.isPending}
          title="确认更新部门状态"
          onCancel={() => setDepartmentStatusTarget(null)}
          onConfirm={confirmDepartmentStatusChange}
        />
      ) : null}
    </main>
  );
}

function InfoTile({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 break-words text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}
