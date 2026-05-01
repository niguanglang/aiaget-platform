'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type CreateDepartmentInput,
  DepartmentDetail,
  DepartmentListItem,
  DepartmentStatus,
  DepartmentTreeItem,
  UpdateDepartmentInput,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Edit, Network, Plus, Power, Search, ShieldCheck, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DepartmentCenterBackground } from '@/components/departments/department-center-background';
import { DepartmentFormPanel, type DepartmentFormValues } from '@/components/departments/department-form-panel';
import {
  departmentStatusLabel,
  departmentStatusTone,
  formatDateTime,
} from '@/components/departments/department-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createDepartment,
  deleteDepartment,
  disableDepartment,
  enableDepartment,
  getDepartment,
  getDepartmentOverview,
  getDepartmentTree,
  listDepartments,
  listUsers,
  updateDepartment,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

const statuses: DepartmentStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];

export function DepartmentContent() {
  const queryClient = useQueryClient();
  const { currentUser, refreshCurrentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [parentId, setParentId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentDetail | null>(null);
  const [parentForCreate, setParentForCreate] = useState<DepartmentTreeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentListItem | DepartmentDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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
  const leadersQuery = useQuery({
    queryKey: ['department-leaders'],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 100,
        status: 'ACTIVE',
      }),
  });
  const selectedDepartmentQuery = useQuery({
    enabled: Boolean(selectedDepartmentId),
    queryKey: ['department', selectedDepartmentId],
    queryFn: () => getDepartment(selectedDepartmentId ?? ''),
  });

  const departmentTree = treeQuery.data ?? [];
  const flatTree = useMemo(() => flattenDepartmentTree(departmentTree), [departmentTree]);
  const departments = departmentsQuery.data?.items ?? [];
  const leaders = leadersQuery.data?.items ?? [];
  const selectedDepartment =
    selectedDepartmentQuery.data ?? departments.find((department) => department.id === selectedDepartmentId) ?? null;

  useEffect(() => {
    const firstDepartment = flatTree[0];
    if (!selectedDepartmentId && firstDepartment) {
      setSelectedDepartmentId(firstDepartment.id);
    }
  }, [flatTree, selectedDepartmentId]);

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: async (department) => {
      await refreshDepartments();
      setSelectedDepartmentId(department.id);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateDepartmentInput }) => updateDepartment(id, values),
    onSuccess: async (department) => {
      queryClient.setQueryData(['department', department.id], department);
      await refreshDepartments();
      setSelectedDepartmentId(department.id);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableDepartment(id) : disableDepartment(id),
    onSuccess: async (department) => {
      queryClient.setQueryData(['department', department.id], department);
      setActionError(null);
      await refreshDepartments();
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: async () => {
      setDeleteTarget(null);
      setSelectedDepartmentId(null);
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
      queryClient.invalidateQueries({ queryKey: ['department-leaders'] }),
      refreshCurrentUser(),
    ]);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setParentId('');
  }

  function openCreateForm(parent?: DepartmentTreeItem | null) {
    setFormError(null);
    setEditingDepartment(null);
    setParentForCreate(parent ?? null);
    setFormMode('create');
  }

  async function openEditForm(department: DepartmentListItem | DepartmentDetail) {
    setFormError(null);
    const detail =
      'members' in department
        ? department
        : await queryClient.fetchQuery({
            queryKey: ['department', department.id],
            queryFn: () => getDepartment(department.id),
          });

    setEditingDepartment(detail);
    setParentForCreate(null);
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode(null);
    setEditingDepartment(null);
    setParentForCreate(null);
    setFormError(null);
  }

  function submitForm(values: DepartmentFormValues) {
    const payload = toDepartmentPayload(values);

    if (formMode === 'create') {
      createMutation.mutate({
        ...payload,
        code: values.code.trim(),
      } as CreateDepartmentInput);
      return;
    }

    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, values: payload });
    }
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
        <Button className="w-full md:w-auto" disabled={!canWrite} onClick={() => openCreateForm()}>
          <Plus className="size-4" />
          新建部门
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
            <Button disabled={!canWrite} onClick={() => openCreateForm()} size="sm" variant="outline">
              <Plus className="size-4" />
              根部门
            </Button>
          </div>

          {treeQuery.isError ? (
            <div className="p-6 text-sm text-destructive">组织树加载失败。</div>
          ) : treeQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载组织树...</div>
          ) : flatTree.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canWrite} onClick={() => openCreateForm()}>
                  <Plus className="size-4" />
                  新建部门
                </Button>
              }
              description="先创建总部或一级业务部门，再补充下级组织。"
              title="暂无部门"
            />
          ) : (
            <div className="grid gap-1 p-3">
              {flatTree.map((department, index) => (
                <motion.button
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex min-h-10 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    selectedDepartmentId === department.id
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-transparent bg-white/45 hover:border-slate-200 hover:bg-white/80',
                  )}
                  initial={{ opacity: 0, y: 6 }}
                  key={department.id}
                  onClick={() => setSelectedDepartmentId(department.id)}
                  style={{ paddingLeft: `${12 + (department.level - 1) * 18}px` }}
                  transition={{ delay: index * 0.015, duration: 0.18 }}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Network className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{department.name}</span>
                  </span>
                  <StatusBadge tone={departmentStatusTone(department.status)}>
                    {departmentStatusLabel(department.status)}
                  </StatusBadge>
                </motion.button>
              ))}
            </div>
          )}
        </Card>

        <div className="grid min-w-0 gap-4">
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
                  <Button disabled={!canWrite} onClick={() => openCreateForm()}>
                    <Plus className="size-4" />
                    新建部门
                  </Button>
                }
                description="当前筛选条件没有匹配部门，清空筛选或创建新的部门。"
                title="暂无部门"
              />
            ) : (
              <DepartmentTable
                canWrite={canWrite}
                departments={departments}
                onCreateChild={(department) => openCreateForm(findTreeNode(flatTree, department.id))}
                onDelete={setDeleteTarget}
                onEdit={(department) => void openEditForm(department)}
                onSelect={setSelectedDepartmentId}
                onToggle={(department) =>
                  statusMutation.mutate({
                    id: department.id,
                    nextStatus: department.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                  })
                }
                pending={statusMutation.isPending}
                selectedDepartmentId={selectedDepartmentId}
              />
            )}
          </Card>

          <DepartmentDetailCard
            canWrite={canWrite}
            department={selectedDepartment}
            loading={selectedDepartmentQuery.isLoading}
            onCreateChild={(department) => openCreateForm(findTreeNode(flatTree, department.id))}
            onDelete={setDeleteTarget}
            onEdit={(department) => void openEditForm(department)}
            onToggle={(department) =>
              statusMutation.mutate({
                id: department.id,
                nextStatus: department.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
              })
            }
            pending={statusMutation.isPending}
          />
        </div>
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

      {formMode ? (
        <DepartmentFormPanel
          department={editingDepartment}
          departmentTree={departmentTree}
          error={formError}
          isPending={createMutation.isPending || updateMutation.isPending}
          leaders={leaders}
          mode={formMode}
          onClose={closeForm}
          onSubmit={submitForm}
          parent={parentForCreate}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除部门「${deleteTarget.name}」。如果该部门仍有子部门或成员，后端会拒绝删除。`}
          pending={deleteMutation.isPending}
          title="删除部门？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function DepartmentTable({
  canWrite,
  departments,
  onCreateChild,
  onDelete,
  onEdit,
  onSelect,
  onToggle,
  pending,
  selectedDepartmentId,
}: {
  canWrite: boolean;
  departments: DepartmentListItem[];
  onCreateChild: (department: DepartmentListItem) => void;
  onDelete: (department: DepartmentListItem) => void;
  onEdit: (department: DepartmentListItem) => void;
  onSelect: (id: string) => void;
  onToggle: (department: DepartmentListItem) => void;
  pending: boolean;
  selectedDepartmentId: string | null;
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
              className={cn(
                'cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25',
                selectedDepartmentId === department.id && 'bg-blue-50/55',
              )}
              initial={{ opacity: 0, y: 8 }}
              key={department.id}
              onClick={() => onSelect(department.id)}
              transition={{ delay: index * 0.02, duration: 0.2 }}
            >
              <td className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${(department.level - 1) * 18}px` }}>
                  <Network className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{department.name}</div>
                    <div className="text-xs text-muted-foreground">父级：{department.parent_name ?? '根部门'}</div>
                  </div>
                </div>
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
              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                <div className="flex gap-2">
                  <Button disabled={!canWrite} onClick={() => onCreateChild(department)} size="sm" title="新建子部门" variant="outline">
                    <Plus className="size-4" />
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onEdit(department)} size="sm" title="编辑" variant="outline">
                    <Edit className="size-4" />
                  </Button>
                  <Button disabled={!canWrite || pending} onClick={() => onToggle(department)} size="sm" title={department.status === 'ACTIVE' ? '停用' : '启用'} variant="outline">
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

function DepartmentDetailCard({
  canWrite,
  department,
  loading,
  onCreateChild,
  onDelete,
  onEdit,
  onToggle,
  pending,
}: {
  canWrite: boolean;
  department: DepartmentDetail | DepartmentListItem | null;
  loading: boolean;
  onCreateChild: (department: DepartmentListItem) => void;
  onDelete: (department: DepartmentDetail | DepartmentListItem) => void;
  onEdit: (department: DepartmentDetail | DepartmentListItem) => void;
  onToggle: (department: DepartmentDetail | DepartmentListItem) => void;
  pending: boolean;
}) {
  return (
    <Card className="min-w-0 p-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-sm font-semibold">部门详情</h2>
          <p className="mt-1 text-sm text-muted-foreground">查看负责人、成员和下级部门概况。</p>
        </div>
        {department ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={!canWrite} onClick={() => onCreateChild(department)} size="sm" variant="outline">
              <Plus className="size-4" />
              子部门
            </Button>
            <Button disabled={!canWrite} onClick={() => onEdit(department)} size="sm" variant="outline">
              <Edit className="size-4" />
              编辑
            </Button>
            <Button disabled={!canWrite || pending} onClick={() => onToggle(department)} size="sm" variant="outline">
              <Power className="size-4" />
              {department.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-muted-foreground">正在加载部门详情...</div>
      ) : !department ? (
        <EmptyState
          className="py-8"
          description="从组织树或表格中选择一个部门，查看负责人、成员和下级部门。"
          title="未选择部门"
        />
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border bg-muted/15 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{department.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{department.code}</div>
              </div>
              <StatusBadge tone={departmentStatusTone(department.status)}>
                {departmentStatusLabel(department.status)}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <DetailLine label="父级部门" value={department.parent_name ?? '根部门'} />
              <DetailLine label="负责人" value={department.leader?.name ?? '未指定'} />
              <DetailLine label="成员数量" value={`${department.member_count}`} />
              <DetailLine label="下级部门" value={`${department.child_count}`} />
              <DetailLine label="排序号" value={`${department.sort_order}`} />
              <DetailLine label="更新时间" value={formatDateTime(department.updated_at)} />
            </div>
            <p className="mt-4 rounded-md border border-dashed p-3 text-sm leading-6 text-muted-foreground">
              {department.description ?? '暂无部门描述。'}
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UsersRound className="size-4 text-muted-foreground" />
              成员列表
            </div>
            {'members' in department && department.members.length > 0 ? (
              <div className="grid max-h-[260px] gap-2 overflow-y-auto">
                {department.members.map((member) => (
                  <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/15 px-3 py-2 text-sm" key={member.id}>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{member.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                    </div>
                    <StatusBadge tone={member.status === 'ACTIVE' ? 'healthy' : 'planned'}>{member.status === 'ACTIVE' ? '启用' : '停用'}</StatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无成员。</div>
            )}
            {'children' in department && department.children.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {department.children.slice(0, 8).map((child) => (
                  <StatusBadge key={child.id} tone="mock">
                    {child.name}
                  </StatusBadge>
                ))}
              </div>
            ) : null}
            <div className="flex justify-end">
              <Button disabled={!canWrite} onClick={() => onDelete(department)} size="sm" variant="outline">
                <Trash2 className="size-4" />
                删除部门
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function ConfirmDialog({
  body,
  onCancel,
  onConfirm,
  pending,
  title,
}: {
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">
            确认删除
          </Button>
        </div>
      </Card>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[72%] break-words text-right font-medium">{value}</span>
    </div>
  );
}

function flattenDepartmentTree(items: DepartmentTreeItem[]) {
  const output: DepartmentTreeItem[] = [];

  function visit(nodes: DepartmentTreeItem[]) {
    for (const node of nodes) {
      output.push(node);
      visit(node.children);
    }
  }

  visit(items);

  return output;
}

function findTreeNode(items: DepartmentTreeItem[], id: string) {
  return items.find((item) => item.id === id) ?? null;
}

function toDepartmentPayload(values: DepartmentFormValues): UpdateDepartmentInput {
  return {
    parent_id: nullableText(values.parent_id),
    name: values.name.trim(),
    description: nullableText(values.description),
    leader_user_id: nullableText(values.leader_user_id),
    sort_order: values.sort_order,
    status: values.status,
  };
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
