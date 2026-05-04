'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type DataScopePreviewResult,
  type DataScopeResourceType,
  type DataScopeType,
  type DepartmentTreeItem,
  type ReplaceRoleDataScopeInput,
  type RoleDataScopeItem,
  type RoleDataScopeValue,
  type RoleListItem,
  type UserListItem,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  GitBranch,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { DataScopeBackground } from '@/components/data-scopes/data-scope-background';
import {
  dataScopeResourceLabels,
  dataScopeResourceOrder,
  dataScopeTypeDescriptions,
  dataScopeTypeLabels,
  dataScopeTypeTone,
  formatDateTime,
} from '@/components/data-scopes/data-scope-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getDataScopeOverview,
  getDepartmentTree,
  getRoleDataScopes,
  listRoles,
  listUsers,
  previewDataScope,
  replaceRoleDataScopes,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

const scopeTypes: DataScopeType[] = ['ALL', 'TENANT', 'DEPT', 'DEPT_AND_CHILD', 'SELF', 'CUSTOM'];
export function DataScopeContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [roleKeyword, setRoleKeyword] = useState('');
  const [roleStatus, setRoleStatus] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<DataScopeResourceType>('AGENT');
  const [draftScopes, setDraftScopes] = useState<RoleDataScopeItem[]>([]);
  const [previewResult, setPreviewResult] = useState<DataScopePreviewResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:data_scope:manage'),
  );

  const overviewQuery = useQuery({
    queryKey: ['data-scope-overview'],
    queryFn: getDataScopeOverview,
  });
  const rolesQuery = useQuery({
    queryKey: ['data-scope-roles', roleKeyword, roleStatus],
    queryFn: () =>
      listRoles({
        page: 1,
        page_size: 200,
        keyword: roleKeyword,
        status: roleStatus,
      }),
  });
  const roleScopesQuery = useQuery({
    enabled: Boolean(selectedRoleId),
    queryKey: ['role-data-scopes', selectedRoleId],
    queryFn: () => getRoleDataScopes(selectedRoleId ?? ''),
  });
  const departmentsQuery = useQuery({
    queryKey: ['data-scope-departments'],
    queryFn: getDepartmentTree,
  });
  const usersQuery = useQuery({
    queryKey: ['data-scope-users'],
    queryFn: () =>
      listUsers({
        page: 1,
        page_size: 100,
        status: 'ACTIVE',
      }),
  });

  const roles = rolesQuery.data?.items ?? [];
  const selectedRole = roleScopesQuery.data?.role ?? roles.find((role) => role.id === selectedRoleId) ?? null;
  const selectedScope = draftScopes.find((scope) => scope.resource_type === selectedResourceType) ?? null;
  const isTenantAdmin = selectedRole?.code === 'tenant_admin';
  const users = usersQuery.data?.items ?? [];
  const departments = departmentsQuery.data ?? [];

  useEffect(() => {
    if (!selectedRoleId && roles[0]) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (roleScopesQuery.data?.scopes) {
      setDraftScopes(roleScopesQuery.data.scopes);
      setPreviewResult(null);
      setSaveMessage(null);
      setActionError(null);
    }
  }, [roleScopesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: ({ roleId, scopes }: { roleId: string; scopes: ReplaceRoleDataScopeInput }) =>
      replaceRoleDataScopes(roleId, scopes),
    onSuccess: async (detail) => {
      setDraftScopes(detail.scopes);
      setActionError(null);
      setSaveMessage('数据权限已保存。');
      queryClient.setQueryData(['role-data-scopes', detail.role.id], detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['role-data-scopes'] }),
        queryClient.invalidateQueries({ queryKey: ['data-scope-overview'] }),
      ]);
    },
    onError: (error: ApiClientError) => {
      setSaveMessage(null);
      setActionError(error.message);
    },
  });

  const previewMutation = useMutation({
    mutationFn: previewDataScope,
    onSuccess: (result) => {
      setPreviewResult(result);
      setActionError(null);
    },
    onError: (error: ApiClientError) => {
      setPreviewResult(null);
      setActionError(error.message);
    },
  });

  const metrics = [
    {
      label: '已配置角色',
      value: `${overviewQuery.data?.configured_role_count ?? 0}`,
      helper: `共 ${overviewQuery.data?.role_count ?? rolesQuery.data?.total ?? 0} 个角色`,
    },
    {
      label: '数据范围',
      value: `${overviewQuery.data?.scope_count ?? draftScopes.length}`,
      helper: '资源矩阵配置',
    },
    {
      label: '全部范围',
      value: `${overviewQuery.data?.all_scope_count ?? 0}`,
      helper: `${overviewQuery.data?.tenant_scope_count ?? 0} 个租户范围`,
    },
    {
      label: '自定义范围',
      value: `${overviewQuery.data?.custom_scope_count ?? 0}`,
      helper: `${overviewQuery.data?.self_scope_count ?? 0} 个本人范围`,
    },
  ];

  function clearFilters() {
    setRoleKeyword('');
    setRoleStatus('');
  }

  function patchSelectedScope(patch: Partial<RoleDataScopeItem>) {
    setDraftScopes((current) =>
      current.map((scope) =>
        scope.resource_type === selectedResourceType
          ? {
              ...scope,
              ...patch,
            }
          : scope,
      ),
    );
    setSaveMessage(null);
    setPreviewResult(null);
  }

  function patchScopeValue(patch: Partial<RoleDataScopeValue>) {
    if (!selectedScope) return;
    patchSelectedScope({
      scope_value: {
        ...selectedScope.scope_value,
        ...patch,
      },
    });
  }

  function saveScopes() {
    if (!selectedRoleId || draftScopes.length === 0) return;
    saveMutation.mutate({
      roleId: selectedRoleId,
      scopes: {
        scopes: draftScopes.map((scope) => ({
          resource_type: scope.resource_type,
          scope_type: scope.scope_type,
          scope_value: scope.scope_value,
          status: scope.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
        })),
      },
    });
  }

  function previewScope() {
    if (!selectedRoleId || !selectedScope) return;
    previewMutation.mutate({
      role_id: selectedRoleId,
      resource_type: selectedScope.resource_type,
      scope_type: selectedScope.scope_type,
      scope_value: selectedScope.scope_value,
    });
  }

  function resetDraft() {
    setDraftScopes(roleScopesQuery.data?.scopes ?? []);
    setPreviewResult(null);
    setSaveMessage(null);
    setActionError(null);
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <DataScopeBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M35</StatusBadge>
            <StatusBadge tone="healthy">数据权限</StatusBadge>
            <StatusBadge tone="mock">RBAC + ABAC</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">数据权限中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            按角色为 Agent、知识库、工具、模型、会话和审计等资源设置数据范围，补齐菜单权限和接口权限之后的访问边界。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={!selectedRoleId || saveMutation.isPending} onClick={resetDraft} variant="outline">
            <RefreshCcw className="size-4" />
            重置
          </Button>
          <Button disabled={!canWrite || isTenantAdmin || !selectedRoleId || saveMutation.isPending} onClick={saveScopes}>
            <Save className="size-4" />
            保存数据范围
          </Button>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      {!canWrite ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          当前账号缺少 system:data_scope:manage 权限，只能查看和预览数据范围。
        </div>
      ) : null}
      {isTenantAdmin ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          租户管理员的数据权限由种子数据维护，默认拥有全部资源范围。
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}
      {saveMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          {saveMessage}
        </div>
      ) : null}

      <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[0.72fr_1.08fr_0.92fr]">
        <RoleDirectory
          keyword={roleKeyword}
          loading={rolesQuery.isLoading}
          onClear={clearFilters}
          onKeywordChange={setRoleKeyword}
          onRoleSelect={(roleId) => {
            setSelectedRoleId(roleId);
            setSelectedResourceType('AGENT');
          }}
          onStatusChange={setRoleStatus}
          roles={roles}
          selectedRoleId={selectedRoleId}
          status={roleStatus}
          total={rolesQuery.data?.total ?? 0}
        />

        <ScopeMatrix
          loading={roleScopesQuery.isLoading}
          onSelectResource={setSelectedResourceType}
          scopes={draftScopes}
          selectedResourceType={selectedResourceType}
          selectedRole={selectedRole}
        />

        <ScopeEditor
          canWrite={canWrite && !isTenantAdmin}
          departments={departments}
          loading={roleScopesQuery.isLoading}
          onPatchScope={patchSelectedScope}
          onPatchScopeValue={patchScopeValue}
          onPreview={previewScope}
          pendingPreview={previewMutation.isPending}
          previewResult={previewResult}
          scope={selectedScope}
          selectedRole={selectedRole}
          users={users}
        />
      </section>
    </main>
  );
}

function RoleDirectory({
  keyword,
  loading,
  onClear,
  onKeywordChange,
  onRoleSelect,
  onStatusChange,
  roles,
  selectedRoleId,
  status,
  total,
}: {
  keyword: string;
  loading: boolean;
  onClear: () => void;
  onKeywordChange: (value: string) => void;
  onRoleSelect: (roleId: string) => void;
  onStatusChange: (value: string) => void;
  roles: RoleListItem[];
  selectedRoleId: string | null;
  status: string;
  total: number;
}) {
  return (
    <Card className="min-w-0">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">角色目录</h2>
            <p className="mt-1 text-sm text-muted-foreground">选择一个角色后配置资源数据范围。</p>
          </div>
          <StatusBadge tone="planned">{roles.length}/{total}</StatusBadge>
        </div>
        <div className="mt-4 grid gap-2">
          <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
            <Search className="size-4 text-muted-foreground" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="搜索角色名称、编码"
              value={keyword}
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select
              className="h-9 rounded-md border bg-background/80 px-3 text-sm"
              onChange={(event) => onStatusChange(event.target.value)}
              value={status}
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">停用</option>
              <option value="DELETED">已删除</option>
            </select>
            <Button onClick={onClear} type="button" variant="outline">
              清空
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载角色目录...</div>
      ) : roles.length === 0 ? (
        <EmptyState className="py-8" description="当前筛选条件没有匹配角色。" title="暂无角色" />
      ) : (
        <div className="grid max-h-[620px] gap-2 overflow-y-auto p-3">
          {roles.map((role, index) => (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-lg border bg-background/75 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/45',
                selectedRoleId === role.id && 'border-blue-300 bg-blue-50/70 shadow-sm',
              )}
              initial={{ opacity: 0, y: 8 }}
              key={role.id}
              onClick={() => onRoleSelect(role.id)}
              transition={{ delay: index * 0.018, duration: 0.2 }}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{role.name}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">{role.code}</div>
                </div>
                <StatusBadge tone={role.status === 'ACTIVE' ? 'healthy' : 'planned'}>
                  {role.status === 'ACTIVE' ? '启用' : role.status === 'DISABLED' ? '停用' : '已删除'}
                </StatusBadge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>用户 {role.user_count}</span>
                <span>权限 {role.permission_count}</span>
                <span>{role.is_system ? '系统' : '自定义'}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </Card>
  );
}

function ScopeMatrix({
  loading,
  onSelectResource,
  scopes,
  selectedResourceType,
  selectedRole,
}: {
  loading: boolean;
  onSelectResource: (resourceType: DataScopeResourceType) => void;
  scopes: RoleDataScopeItem[];
  selectedResourceType: DataScopeResourceType;
  selectedRole: RoleListItem | null;
}) {
  const scopeByResource = useMemo(
    () => new Map(scopes.map((scope) => [scope.resource_type, scope])),
    [scopes],
  );

  return (
    <Card className="min-w-0">
      <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-sm font-semibold">资源范围矩阵</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedRole ? `当前角色：${selectedRole.name}` : '先从左侧选择角色。'}
          </p>
        </div>
        <StatusBadge tone="mock">{scopes.length} 项</StatusBadge>
      </div>

      {!selectedRole ? (
        <EmptyState
          className="py-12"
          description="选择角色后，会展示不同资源类型的数据权限范围。"
          title="未选择角色"
        />
      ) : loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载数据权限矩阵...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['资源类型', '数据范围', '部门', '用户', '资源', '更新时间'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataScopeResourceOrder.map((resourceType, index) => {
                const scope = scopeByResource.get(resourceType);
                const scopeType = scope?.scope_type ?? 'TENANT';

                return (
                  <motion.tr
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/25',
                      selectedResourceType === resourceType && 'bg-teal-50/60',
                    )}
                    initial={{ opacity: 0, y: 8 }}
                    key={resourceType}
                    onClick={() => onSelectResource(resourceType)}
                    transition={{ delay: index * 0.02, duration: 0.22 }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-md border bg-background">
                          <SlidersHorizontal className="size-4 text-teal-700" />
                        </span>
                        <div>
                          <div className="font-medium">{dataScopeResourceLabels[resourceType]}</div>
                          <div className="text-xs text-muted-foreground">{resourceType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={dataScopeTypeTone(scopeType)}>{dataScopeTypeLabels[scopeType]}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{scope?.department_count ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{scope?.user_count ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{scope?.resource_count ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(scope?.updated_at)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ScopeEditor({
  canWrite,
  departments,
  loading,
  onPatchScope,
  onPatchScopeValue,
  onPreview,
  pendingPreview,
  previewResult,
  scope,
  selectedRole,
  users,
}: {
  canWrite: boolean;
  departments: DepartmentTreeItem[];
  loading: boolean;
  onPatchScope: (patch: Partial<RoleDataScopeItem>) => void;
  onPatchScopeValue: (patch: Partial<RoleDataScopeValue>) => void;
  onPreview: () => void;
  pendingPreview: boolean;
  previewResult: DataScopePreviewResult | null;
  scope: RoleDataScopeItem | null;
  selectedRole: RoleListItem | null;
  users: UserListItem[];
}) {
  const flatDepartments = useMemo(() => flattenDepartments(departments), [departments]);
  const selectedDepartmentIds = scope?.scope_value.department_ids ?? [];
  const selectedUserIds = scope?.scope_value.user_ids ?? [];
  const customDisabled = !scope || scope.scope_type !== 'CUSTOM';

  if (!selectedRole) {
    return (
      <Card className="min-w-0 p-4">
        <EmptyState
          className="py-12"
          description="从角色目录选择角色，再配置每类资源的数据范围。"
          title="等待选择角色"
        />
      </Card>
    );
  }

  if (loading || !scope) {
    return <Card className="min-w-0 p-4 text-sm text-muted-foreground">正在准备配置面板...</Card>;
  }

  return (
    <Card className="min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">范围配置与预览</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {dataScopeResourceLabels[scope.resource_type]} · {selectedRole.name}
          </p>
        </div>
        <StatusBadge tone={dataScopeTypeTone(scope.scope_type)}>{dataScopeTypeLabels[scope.scope_type]}</StatusBadge>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <div className="text-xs font-medium text-muted-foreground">数据范围类型</div>
          <div className="grid gap-2">
            {scopeTypes.map((scopeType) => (
              <button
                className={cn(
                  'rounded-lg border bg-background/80 p-3 text-left transition-colors hover:border-teal-200 hover:bg-teal-50/40',
                  scope.scope_type === scopeType && 'border-teal-300 bg-teal-50/70 shadow-sm',
                )}
                disabled={!canWrite}
                key={scopeType}
                onClick={() =>
                  onPatchScope({
                    scope_type: scopeType,
                    scope_label: dataScopeTypeLabels[scopeType],
                  })
                }
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{dataScopeTypeLabels[scopeType]}</span>
                  {scope.scope_type === scopeType ? <ShieldCheck className="size-4 text-teal-700" /> : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{dataScopeTypeDescriptions[scopeType]}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/15 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">自定义范围</div>
              <p className="mt-1 text-xs text-muted-foreground">仅在选择“自定义范围”时生效。</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                checked={scope.scope_value.include_children}
                disabled={!canWrite || customDisabled}
                onChange={(event) => onPatchScopeValue({ include_children: event.target.checked })}
                type="checkbox"
              />
              包含子部门
            </label>
          </div>

          <SelectorBlock
            disabled={!canWrite || customDisabled}
            emptyText="暂无部门"
            icon={<GitBranch className="size-4 text-teal-700" />}
            items={flatDepartments.map((department) => ({
              id: department.id,
              label: department.name,
              meta: department.code,
              level: department.level,
            }))}
            onChange={(departmentIds) => onPatchScopeValue({ department_ids: departmentIds })}
            selectedIds={selectedDepartmentIds}
            title="授权部门"
          />

          <SelectorBlock
            disabled={!canWrite || customDisabled}
            emptyText="暂无用户"
            icon={<UsersRound className="size-4 text-blue-700" />}
            items={users.map((user) => ({
              id: user.id,
              label: user.name,
              meta: user.department?.name ?? user.email,
              level: 1,
            }))}
            onChange={(userIds) => onPatchScopeValue({ user_ids: userIds })}
            selectedIds={selectedUserIds}
            title="授权用户"
          />

          <div className="mt-3 grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">资源 ID 清单</label>
            <textarea
              className="min-h-24 resize-y rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus:border-teal-300"
              disabled={!canWrite || customDisabled}
              onChange={(event) =>
                onPatchScopeValue({
                  resource_ids: event.target.value
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              placeholder="每行一个资源 ID，可用于后续 Resource ACL 精确对象授权"
              value={scope.scope_value.resource_ids.join('\n')}
            />
          </div>
        </div>

        <PreviewPanel onPreview={onPreview} pendingPreview={pendingPreview} result={previewResult} />
      </div>
    </Card>
  );
}

function SelectorBlock({
  disabled,
  emptyText,
  icon,
  items,
  onChange,
  selectedIds,
  title,
}: {
  disabled: boolean;
  emptyText: string;
  icon: React.ReactNode;
  items: Array<{ id: string; label: string; meta: string; level: number }>;
  onChange: (ids: string[]) => void;
  selectedIds: string[];
  title: string;
}) {
  const [keyword, setKeyword] = useState('');
  const selectedSet = new Set(selectedIds);
  const visibleItems = items
    .filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(keyword.trim().toLowerCase()))
    .slice(0, 80);

  function toggle(id: string) {
    if (disabled) return;
    onChange(selectedSet.has(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  }

  return (
    <div className="mt-3 rounded-md border bg-background/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        <StatusBadge tone="planned">{selectedIds.length} 项</StatusBadge>
      </div>
      <label className="mt-2 flex h-8 items-center gap-2 rounded-md border bg-background px-2 text-xs">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none"
          disabled={disabled}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={`搜索${title}`}
          value={keyword}
        />
      </label>
      {visibleItems.length === 0 ? (
        <div className="mt-3 text-xs text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="mt-3 grid max-h-40 gap-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <label
              className={cn(
                'flex min-h-8 items-center gap-2 rounded-md px-2 text-xs transition-colors',
                disabled ? 'opacity-60' : 'hover:bg-muted/50',
              )}
              key={item.id}
              style={{ paddingLeft: `${8 + (item.level - 1) * 12}px` }}
            >
              <input checked={selectedSet.has(item.id)} disabled={disabled} onChange={() => toggle(item.id)} type="checkbox" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <span className="truncate text-muted-foreground">{item.meta}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewPanel({
  onPreview,
  pendingPreview,
  result,
}: {
  onPreview: () => void;
  pendingPreview: boolean;
  result: DataScopePreviewResult | null;
}) {
  return (
    <div className="rounded-lg border bg-background/75 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">生效预览</div>
          <p className="mt-1 text-xs text-muted-foreground">按当前登录用户和租户数据模拟命中范围。</p>
        </div>
        <Button disabled={pendingPreview} onClick={onPreview} size="sm" variant="outline">
          <Search className="size-4" />
          预览
        </Button>
      </div>

      {!result ? (
        <div className="mt-4 rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          点击预览后展示命中的部门、用户和策略说明。
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">命中部门</div>
              <div className="mt-1 text-xl font-semibold">{result.department_count}</div>
            </div>
            <div className="rounded-md border bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">命中用户</div>
              <div className="mt-1 text-xl font-semibold">{result.user_count}</div>
            </div>
          </div>
          <p className="rounded-md border bg-teal-50/60 p-3 text-xs leading-5 text-teal-800">{result.note}</p>
          <PreviewList title="部门样例" values={result.departments.slice(0, 5).map((department) => department.name)} />
          <PreviewList title="用户样例" values={result.users.slice(0, 5).map((user) => `${user.name} · ${user.department?.name ?? '未归属'}`)} />
        </div>
      )}
    </div>
  );
}

function PreviewList({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted-foreground">{title}</div>
      {values.length === 0 ? (
        <div className="text-xs text-muted-foreground">暂无命中数据。</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span className="rounded-md border bg-background px-2 py-1 text-xs" key={value}>
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function flattenDepartments(departments: DepartmentTreeItem[]) {
  const output: DepartmentTreeItem[] = [];
  const visit = (items: DepartmentTreeItem[]) => {
    for (const item of items) {
      output.push(item);
      visit(item.children);
    }
  };

  visit(departments);

  return output;
}
