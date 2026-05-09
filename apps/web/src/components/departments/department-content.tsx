'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type DepartmentListItem,
  type DepartmentStatus,
  type DepartmentTreeItem,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Edit, Eye, Network, Plus, Power, Search, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DepartmentCenterBackground } from '@/components/departments/department-center-background';
import { flattenDepartmentTree } from '@/components/departments/department-ia-shared';
import {
  departmentStatusLabel,
  departmentStatusTone,
  formatDateTime,
} from '@/components/departments/department-status';
import { ConfirmDialog } from '@/components/roles/role-ia-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteDepartment,
  disableDepartment,
  enableDepartment,
  getDepartmentOverview,
  getDepartmentTree,
  listDepartments,
  type ApiClientError,
} from '@/lib/api-client';

const statuses: DepartmentStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];
type DepartmentStatusTarget = {
  id: string;
  name: string;
  nextStatus: 'ACTIVE' | 'DISABLED';
};

export function DepartmentContent() {
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [parentId, setParentId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DepartmentListItem | null>(null);
  const [departmentStatusTarget, setDepartmentStatusTarget] = useState<DepartmentStatusTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:department:manage'),
  );

  const overviewQuery = useQuery({
    queryKey: ['department-overview'],
    queryFn: getDepartmentOverview,
  });
  const treeQuery = useQuery({
    queryKey: ['department-tree'],
    queryFn: getDepartmentTree,
  });
  const departmentsQuery = useQuery({
    queryKey: ['departments', keyword, status, parentId],
    queryFn: () =>
      listDepartments({
        page: 1,
        page_size: 200,
        keyword,
        status,
        parent_id: parentId,
      }),
  });

  const departmentTree = treeQuery.data ?? [];
  const flatTree = useMemo(() => flattenDepartmentTree(departmentTree), [departmentTree]);
  const departments = departmentsQuery.data?.items ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableDepartment(id) : disableDepartment(id),
    onSuccess: async (department) => {
      queryClient.setQueryData(['department', department.id], department);
      setDepartmentStatusTarget(null);
      setActionError(null);
      await refreshDepartments();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: async () => {
      setDeleteTarget(null);
      setActionError(null);
      await refreshDepartments();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  async function refreshDepartments() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['department-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['department-tree'] }),
      queryClient.invalidateQueries({ queryKey: ['departments'] }),
      refreshCurrentUser(),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setParentId('');
  }

  function confirmDepartmentStatusChange() {
    if (!departmentStatusTarget) return;

    statusMutation.mutate({
      id: departmentStatusTarget.id,
      nextStatus: departmentStatusTarget.nextStatus,
    });
  }

  const overview = overviewQuery.data;
  const metrics = [
    { label: '部门总数', value: `${overview?.total ?? departmentsQuery.data?.total ?? 0}`, helper: '租户范围' },
    { label: '启用部门', value: `${overview?.active_count ?? 0}`, helper: `${overview?.disabled_count ?? 0} 个停用` },
    { label: '已归属成员', value: `${overview?.member_count ?? 0}`, helper: '用户部门属性' },
    { label: '根部门', value: `${overview?.root_count ?? 0}`, helper: '一级组织' },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <DepartmentCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M32</StatusBadge>
            <StatusBadge tone="healthy">组织架构</StatusBadge>
            <StatusBadge tone="planned">ABAC 属性源</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">部门组织架构中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            维护租户部门树、负责人和成员归属，让用户具备真实部门属性，支撑后续数据范围与资源授权。
          </p>
        </div>
        <Button asChild className="w-full md:w-auto" disabled={!canWrite}>
          <Link href="/departments/create">
            <Plus className="size-4" />
            新建部门
          </Link>
        </Button>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="min-w-0">
          <div className="flex items-start justify-between gap-3 border-b p-4">
            <div>
              <h2 className="text-sm font-semibold">组织树</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">最多六级结构，用于用户部门归属。</p>
            </div>
            <Button asChild disabled={!canWrite} size="sm" variant="outline">
              <Link href="/departments/create">
                <Plus className="size-4" />
                根部门
              </Link>
            </Button>
          </div>

          {treeQuery.isError ? (
            <div className="p-6 text-sm text-destructive">组织树加载失败。</div>
          ) : treeQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载组织树...</div>
          ) : flatTree.length === 0 ? (
            <EmptyState
              action={
                <Button asChild disabled={!canWrite}>
                  <Link href="/departments/create">
                    <Plus className="size-4" />
                    新建部门
                  </Link>
                </Button>
              }
              description="先创建总部或一级业务部门，再补充下级组织。"
              title="暂无部门"
            />
          ) : (
            <div className="grid gap-1 p-3">
              {flatTree.map((department, index) => (
                <DepartmentTreeRow department={department} index={index} key={department.id} />
              ))}
            </div>
          )}
        </Card>

        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">部门清单</h2>
                  <p className="mt-1 text-sm text-muted-foreground">按名称、编码、描述、状态和父级部门过滤。</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {departments.length} / {departmentsQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_140px_190px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索名称、编码、描述"
                    value={keyword}
                  />
                </label>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                  <option value="">全部状态</option>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {departmentStatusLabel(item)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setParentId(event.target.value)} value={parentId}>
                  <option value="">全部父级</option>
                  {flatTree.map((department) => (
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
          </div>

          {departmentsQuery.isError ? (
            <div className="p-6 text-sm text-destructive">部门清单加载失败。</div>
          ) : departmentsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载部门清单...</div>
          ) : departments.length === 0 ? (
            <EmptyState
              action={
                <Button asChild disabled={!canWrite}>
                  <Link href="/departments/create">
                    <Plus className="size-4" />
                    新建部门
                  </Link>
                </Button>
              }
              description="当前筛选条件没有匹配部门，清空筛选或创建新的部门。"
              title="暂无部门"
            />
          ) : (
            <DepartmentTable
              canWrite={canWrite}
              departments={departments}
              onDelete={setDeleteTarget}
              onToggle={(department) =>
                setDepartmentStatusTarget({
                  id: department.id,
                  name: department.name,
                  nextStatus: department.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
              pending={statusMutation.isPending}
            />
          )}
        </Card>
      </section>

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue-700" />
              <h2 className="text-sm font-semibold">权限策略准备度</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              用户归属部门后，`subject.department_id` 可以用于 ABAC 条件、知识库密级过滤和 Agent 使用范围。
            </p>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[480px]">
            <div className="rounded-md border bg-muted/20 px-3 py-2">主体属性：department_id</div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">数据范围：本部门 / 子部门</div>
            <div className="rounded-md border bg-muted/20 px-3 py-2">资源授权：部门可见</div>
          </div>
        </div>
      </Card>

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除部门「${deleteTarget.name}」。如果该部门仍有子部门或成员，后端会拒绝删除。`}
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

function DepartmentTreeRow({ department, index }: { department: DepartmentTreeItem; index: number }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-transparent bg-white/45 px-3 py-2 text-sm transition-colors hover:border-slate-200 hover:bg-white/80"
      initial={{ opacity: 0, y: 6 }}
      style={{ paddingLeft: `${12 + (department.level - 1) * 18}px` }}
      transition={{ delay: index * 0.015, duration: 0.18 }}
    >
      <Link className="flex min-w-0 flex-1 items-center gap-2" href={`/departments/${department.id}`}>
        <Network className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{department.name}</span>
      </Link>
      <StatusBadge tone={departmentStatusTone(department.status)}>{departmentStatusLabel(department.status)}</StatusBadge>
    </motion.div>
  );
}

function DepartmentTable({
  canWrite,
  departments,
  onDelete,
  onToggle,
  pending,
}: {
  canWrite: boolean;
  departments: DepartmentListItem[];
  onDelete: (department: DepartmentListItem) => void;
  onToggle: (department: DepartmentListItem) => void;
  pending: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['名称', '编码', '负责人', '成员', '状态', '排序', '更新时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {departments.map((department, index) => (
            <motion.tr
              animate={{ opacity: 1, y: 0 }}
              className="border-b transition-colors last:border-0 hover:bg-muted/25"
              initial={{ opacity: 0, y: 8 }}
              key={department.id}
              transition={{ delay: index * 0.02, duration: 0.2 }}
            >
              <td className="px-4 py-3">
                <Link className="flex min-w-0 items-center gap-2" href={`/departments/${department.id}`} style={{ paddingLeft: `${(department.level - 1) * 18}px` }}>
                  <Network className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{department.name}</div>
                    <div className="text-xs text-muted-foreground">父级：{department.parent_name ?? '根部门'}</div>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{department.code}</td>
              <td className="px-4 py-3 text-muted-foreground">{department.leader?.name ?? '未指定'}</td>
              <td className="px-4 py-3 text-muted-foreground">{department.member_count}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={departmentStatusTone(department.status)}>
                  {departmentStatusLabel(department.status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{department.sort_order}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(department.updated_at)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button asChild size="sm" title="查看" variant="outline">
                    <Link href={`/departments/${department.id}`}>
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild disabled={!canWrite} size="sm" title="编辑" variant="outline">
                    <Link href={`/departments/${department.id}/edit`}>
                      <Edit className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    disabled={!canWrite || pending || department.status === 'DELETED'}
                    onClick={() => onToggle(department)}
                    size="sm"
                    title={department.status === 'ACTIVE' ? '停用' : '启用'}
                    variant="outline"
                  >
                    <Power className="size-4" />
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onDelete(department)} size="sm" title="删除" variant="outline">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
