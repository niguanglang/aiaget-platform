'use client';

import type {
  DataScopeOverview,
  DataScopePreviewResult,
  DataScopeResourceType,
  DataScopeType,
  DepartmentTreeItem,
  RoleDataScopeItem,
  RoleDataScopeValue,
  RoleListItem,
  UserListItem,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { GitBranch, Search, ShieldCheck, SlidersHorizontal, UsersRound } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

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
import { cn } from '@/lib/utils';

export const scopeTypes: DataScopeType[] = ['ALL', 'TENANT', 'DEPT', 'DEPT_AND_CHILD', 'SELF', 'CUSTOM'];

export function DataScopeMetricGrid({ overview, roleTotal }: { overview?: DataScopeOverview; roleTotal: number }) {
  const metrics = [
	    {
	      label: '覆盖角色',
	      value: `${overview?.configured_role_count ?? 0}`,
	      helper: `共 ${overview?.role_count ?? roleTotal} 个角色`,
	    },
    {
	      label: '数据范围',
	      value: `${overview?.scope_count ?? 0}`,
	      helper: '资源矩阵',
    },
    {
      label: '全部范围',
      value: `${overview?.all_scope_count ?? 0}`,
      helper: `${overview?.tenant_scope_count ?? 0} 个租户范围`,
    },
    {
      label: '自定义范围',
      value: `${overview?.custom_scope_count ?? 0}`,
      helper: `${overview?.self_scope_count ?? 0} 个本人范围`,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </section>
  );
}

export function RoleDirectoryList({
  action,
  keyword,
  loading,
  onClear,
  onKeywordChange,
  onStatusChange,
  roles,
  status,
  title,
  total,
}: {
  action: (role: RoleListItem) => ReactNode;
  keyword: string;
  loading: boolean;
  onClear: () => void;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  roles: RoleListItem[];
  status: string;
  title: string;
  total: number;
}) {
  return (
    <Card className="min-w-0">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-semibold">{title}</h2>
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
	        <EmptyState className="py-8" title="暂无角色" />
      ) : (
        <div className="grid max-h-[620px] gap-2 overflow-y-auto p-3">
          {roles.map((role, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border bg-background/75 p-3 text-left"
              initial={{ opacity: 0, y: 8 }}
              key={role.id}
              transition={{ delay: index * 0.018, duration: 0.2 }}
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
              {action(role)}
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function RoleSummaryCard({ role }: { role: RoleListItem }) {
  return (
    <Card className="min-w-0 p-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={role.status === 'ACTIVE' ? 'healthy' : 'planned'}>
              {role.status === 'ACTIVE' ? '启用' : role.status === 'DISABLED' ? '停用' : '已删除'}
            </StatusBadge>
            {role.is_system ? <StatusBadge tone="mock">系统角色</StatusBadge> : <StatusBadge tone="planned">自定义角色</StatusBadge>}
          </div>
          <h2 className="mt-3 text-lg font-semibold">{role.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{role.code}</p>
          {role.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{role.description}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm md:min-w-52">
          <div className="rounded-md border bg-muted/15 p-3">
            <div className="text-xs text-muted-foreground">用户</div>
            <div className="mt-1 text-xl font-semibold">{role.user_count}</div>
          </div>
          <div className="rounded-md border bg-muted/15 p-3">
            <div className="text-xs text-muted-foreground">权限</div>
            <div className="mt-1 text-xl font-semibold">{role.permission_count}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ScopeMatrix({
  editable,
  onSelectResource,
  scopes,
  selectedResourceType,
}: {
  editable?: boolean;
  onSelectResource?: (resourceType: DataScopeResourceType) => void;
  scopes: RoleDataScopeItem[];
  selectedResourceType?: DataScopeResourceType;
}) {
  const scopeByResource = useMemo(() => new Map(scopes.map((scope) => [scope.resource_type, scope])), [scopes]);

  return (
    <Card className="min-w-0">
      <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-start">
        <h2 className="text-sm font-semibold">资源范围矩阵</h2>
        <StatusBadge tone="mock">{scopes.length} 项</StatusBadge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {['资源类型', '数据范围', '部门', '用户', '资源', '状态', '更新时间'].map((column) => (
                <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>{column}</th>
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
                    'border-b transition-colors last:border-0',
                    editable && 'cursor-pointer hover:bg-muted/25',
                    selectedResourceType === resourceType && 'bg-teal-50/60',
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  key={resourceType}
                  onClick={() => onSelectResource?.(resourceType)}
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
                  <td className="px-4 py-3">
                    <StatusBadge tone={scope?.status === 'ACTIVE' ? 'healthy' : 'planned'}>
                      {scope?.status === 'ACTIVE' ? '启用' : scope?.status === 'DISABLED' ? '停用' : '未配置'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(scope?.updated_at)}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function ScopeCountPills({ scope }: { scope: RoleDataScopeItem }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
      <span className="rounded-md border bg-background px-2 py-1">部门 {scope.department_count}</span>
      <span className="rounded-md border bg-background px-2 py-1">用户 {scope.user_count}</span>
      <span className="rounded-md border bg-background px-2 py-1">资源 {scope.resource_count}</span>
    </div>
  );
}

export function ScopeValueSummary({ scope }: { scope: RoleDataScopeItem }) {
  return (
    <Card className="min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">范围摘要</h2>
          <p className="mt-1 text-sm text-muted-foreground">{dataScopeResourceLabels[scope.resource_type]} · {scope.resource_type}</p>
        </div>
        <StatusBadge tone={dataScopeTypeTone(scope.scope_type)}>{dataScopeTypeLabels[scope.scope_type]}</StatusBadge>
      </div>
      <p className="mt-3 rounded-md border bg-muted/15 p-3 text-sm leading-6 text-muted-foreground">
        {dataScopeTypeDescriptions[scope.scope_type]}
      </p>
      <div className="mt-3 grid gap-2 text-sm">
        <SummaryRow label="包含子部门" value={scope.scope_value.include_children ? '是' : '否'} />
        <SummaryRow label="授权部门" value={`${scope.scope_value.department_ids.length} 项`} />
        <SummaryRow label="授权用户" value={`${scope.scope_value.user_ids.length} 项`} />
        <SummaryRow label="资源 ID" value={`${scope.scope_value.resource_ids.length} 项`} />
        <SummaryRow label="更新时间" value={formatDateTime(scope.updated_at)} />
      </div>
    </Card>
  );
}

export function StaticPreviewSummary({ scopes }: { scopes: RoleDataScopeItem[] }) {
  const activeScopes = scopes.filter((scope) => scope.status === 'ACTIVE');
  const customScopes = scopes.filter((scope) => scope.scope_type === 'CUSTOM');
  const allScopes = scopes.filter((scope) => scope.scope_type === 'ALL');

  return (
    <Card className="min-w-0 p-4">
	      <div className="flex items-start gap-3">
	        <span className="grid size-9 place-items-center rounded-md border bg-background">
	          <ShieldCheck className="size-4 text-teal-700" />
	        </span>
	        <div>
	          <h2 className="text-sm font-semibold">只读预览摘要</h2>
	          <p className="mt-1 text-sm leading-6 text-muted-foreground">
	            启用 {activeScopes.length} 个 · 全部 {allScopes.length} 个 · 自定义 {customScopes.length} 个
	          </p>
        </div>
      </div>
    </Card>
  );
}

export function ScopeEditor({
  canWrite,
  departments,
  loading,
  onPatchScope,
  onPatchScopeValue,
  onPreview,
  pendingPreview,
  previewResult,
  scope,
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
  users: UserListItem[];
}) {
  const flatDepartments = useMemo(() => flattenDepartments(departments), [departments]);
  const selectedDepartmentIds = scope?.scope_value.department_ids ?? [];
  const selectedUserIds = scope?.scope_value.user_ids ?? [];
  const customDisabled = !scope || scope.scope_type !== 'CUSTOM';

  if (loading || !scope) {
    return <Card className="min-w-0 p-4 text-sm text-muted-foreground">正在准备范围面板...</Card>;
  }

  return (
    <Card className="min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">范围设置与预览</h2>
          <p className="mt-1 text-sm text-muted-foreground">{dataScopeResourceLabels[scope.resource_type]}</p>
        </div>
        <StatusBadge tone={dataScopeTypeTone(scope.scope_type)}>{dataScopeTypeLabels[scope.scope_type]}</StatusBadge>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <div className="text-xs font-medium text-muted-foreground">数据范围类型</div>
          <div className="grid gap-2 md:grid-cols-2">
            {scopeTypes.map((scopeType) => (
              <button
                className={cn(
                  'rounded-lg border bg-background/80 p-3 text-left transition-colors hover:border-teal-200 hover:bg-teal-50/40',
                  scope.scope_type === scopeType && 'border-teal-300 bg-teal-50/70 shadow-sm',
                )}
                disabled={!canWrite}
                key={scopeType}
                onClick={() => onPatchScope({ scope_type: scopeType, scope_label: dataScopeTypeLabels[scopeType] })}
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
            <div className="text-sm font-semibold">自定义范围</div>
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
                  resource_ids: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean),
                })
              }
	              placeholder="每行一个资源 ID"
              value={scope.scope_value.resource_ids.join('\n')}
            />
          </div>
        </div>

        <PreviewPanel onPreview={onPreview} pendingPreview={pendingPreview} result={previewResult} />
      </div>
    </Card>
  );
}

export function PreviewPanel({
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
        <div className="text-sm font-semibold">生效预览</div>
        <Button disabled={pendingPreview} onClick={onPreview} size="sm" variant="outline">
          <Search className="size-4" />
          预览
        </Button>
      </div>

      {!result ? (
        <div className="mt-4 rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
	          暂无预览结果。
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
  icon: ReactNode;
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
              className={cn('flex min-h-8 items-center gap-2 rounded-md px-2 text-xs transition-colors', disabled ? 'opacity-60' : 'hover:bg-muted/50')}
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/75 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
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
