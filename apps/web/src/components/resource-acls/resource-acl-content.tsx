'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ResourceAclEffect,
  ResourceAclItem,
  ResourceAclResourceType,
  ResourceAclStatus,
  ResourceAclSubjectType,
} from '@aiaget/shared-types';
import { KeyRound, Plus, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ResourceAclBackground } from '@/components/resource-acls/resource-acl-background';
import {
  formatDateTime,
  resourceAclEffectLabels,
  resourceAclEffectTone,
  resourceAclResourceLabels,
  resourceAclResourceOrder,
  resourceAclStatusLabels,
  resourceAclStatusTone,
  resourceAclSubjectLabels,
  resourceAclSubjectTypes,
} from '@/components/resource-acls/resource-acl-status';
import {
  ResourceAclPageHeader,
  ResourceAclPermissionNotice,
  useCanManageResourceAcl,
} from '@/components/resource-acls/resource-acl-shared';
import { ConfirmDialog } from '@/components/roles/role-ia-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  deleteResourceAcl,
  getResourceAclOverview,
  listResourceAcls,
  updateResourceAcl,
  type ApiClientError,
} from '@/lib/api-client';

type AclActionTarget =
  | {
      type: 'STATUS';
      acl: ResourceAclItem;
      status: Exclude<ResourceAclStatus, 'DELETED'>;
    }
  | {
      type: 'DELETE';
      acl: ResourceAclItem;
    };

export function ResourceAclContent() {
  const queryClient = useQueryClient();
  const canWrite = useCanManageResourceAcl();
  const [resourceType, setResourceType] = useState<ResourceAclResourceType | ''>('');
  const [subjectType, setSubjectType] = useState<ResourceAclSubjectType | ''>('');
  const [effectFilter, setEffectFilter] = useState<ResourceAclEffect | ''>('');
  const [statusFilter, setStatusFilter] = useState<Exclude<ResourceAclStatus, 'DELETED'> | ''>('');
  const [aclActionTarget, setAclActionTarget] = useState<AclActionTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ['resource-acl-overview'],
    queryFn: getResourceAclOverview,
  });
  const aclsQuery = useQuery({
    queryKey: ['resource-acls', resourceType, subjectType, effectFilter, statusFilter],
    queryFn: () =>
      listResourceAcls({
        resource_type: resourceType,
        subject_type: subjectType,
        effect: effectFilter,
        status: statusFilter,
      }),
  });

  const acls = useMemo(() => aclsQuery.data ?? [], [aclsQuery.data]);
  const metrics = [
    {
      label: '授权规则',
      value: `${overviewQuery.data?.total ?? acls.length}`,
      helper: '资源 ACL 总量',
    },
    {
      label: '启用规则',
      value: `${overviewQuery.data?.active_count ?? acls.filter((acl) => acl.status === 'ACTIVE').length}`,
      helper: `${overviewQuery.data?.disabled_count ?? 0} 条停用`,
    },
    {
      label: '允许规则',
      value: `${overviewQuery.data?.allow_count ?? acls.filter((acl) => acl.effect === 'ALLOW').length}`,
      helper: 'ALLOW',
    },
    {
      label: '拒绝规则',
      value: `${overviewQuery.data?.deny_count ?? acls.filter((acl) => acl.effect === 'DENY').length}`,
      helper: 'DENY 优先',
    },
  ];

  const deleteMutation = useMutation({
    mutationFn: deleteResourceAcl,
    onSuccess: async () => {
      setAclActionTarget(null);
      setActionError(null);
      setSuccessMessage('资源授权已删除。');
      await refreshAcls();
    },
    onError: (error: ApiClientError) => {
      setSuccessMessage(null);
      setActionError(error.message);
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Exclude<ResourceAclStatus, 'DELETED'> }) =>
      updateResourceAcl(id, { status }),
    onSuccess: async () => {
      setAclActionTarget(null);
      setActionError(null);
      setSuccessMessage('资源授权状态已更新。');
      await refreshAcls();
    },
    onError: (error: ApiClientError) => {
      setSuccessMessage(null);
      setActionError(error.message);
    },
  });

  async function refreshAcls() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['resource-acl-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['resource-acls'] }),
    ]);
  }

  function clearFilters() {
    setResourceType('');
    setSubjectType('');
    setEffectFilter('');
    setStatusFilter('');
  }

  function confirmAclAction() {
    if (!aclActionTarget) return;

    if (aclActionTarget.type === 'DELETE') {
      deleteMutation.mutate(aclActionTarget.acl.id);
      return;
    }

    statusMutation.mutate({
      id: aclActionTarget.acl.id,
      status: aclActionTarget.status,
    });
  }

  const pending = deleteMutation.isPending || statusMutation.isPending;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ResourceAclBackground />

      <ResourceAclPageHeader
        actions={
          <>
            <Button asChild type="button" variant="outline">
              <Link href="/resource-acls/check">
                <Search className="size-4" />
                权限校验
              </Link>
            </Button>
            <Button asChild disabled={!canWrite} type="button">
              <Link href="/resource-acls/create">
                <Plus className="size-4" />
                新建授权
              </Link>
            </Button>
          </>
        }
        description="面向具体 Agent、知识库、工具、模型和会话对象配置授权规则，补齐菜单权限、接口权限、数据权限之后的对象级访问控制。"
        eyebrow="Resource ACL"
        title="资源授权中心"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <ResourceAclPermissionNotice canWrite={canWrite} />
      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <AclFilters
        effectFilter={effectFilter}
        onClearFilters={clearFilters}
        onEffectFilterChange={setEffectFilter}
        onResourceTypeChange={setResourceType}
        onStatusFilterChange={setStatusFilter}
        onSubjectTypeChange={setSubjectType}
        resourceType={resourceType}
        statusFilter={statusFilter}
        subjectType={subjectType}
      />

      <AclRuleTable
        acls={acls}
        loading={aclsQuery.isLoading}
        onDelete={(acl) => {
          if (!canWrite || deleteMutation.isPending) return;
          setAclActionTarget({ type: 'DELETE', acl });
        }}
        onToggleStatus={(acl) => {
          if (!canWrite || statusMutation.isPending) return;
          setAclActionTarget({
            type: 'STATUS',
            acl,
            status: acl.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
          });
        }}
        pending={pending}
        writeDisabled={!canWrite}
      />

      {aclActionTarget ? (
        <AclActionConfirmDialog
          target={aclActionTarget}
          onCancel={() => setAclActionTarget(null)}
          onConfirm={confirmAclAction}
          pending={pending}
        />
      ) : null}
    </main>
  );
}

function AclActionConfirmDialog({
  onCancel,
  onConfirm,
  pending,
  target,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  target: AclActionTarget;
}) {
  const title =
    target.type === 'DELETE'
      ? '确认删除资源授权'
      : target.status === 'ACTIVE'
        ? '确认启用资源授权'
        : '确认停用资源授权';
  const body =
    target.type === 'DELETE'
      ? `这会删除「${target.acl.resource.name}」到「${target.acl.subject.name}」的资源授权，相关 ABAC 与对象级访问检查将立即失去该规则。`
      : target.status === 'ACTIVE'
        ? `这会启用「${target.acl.resource.name}」到「${target.acl.subject.name}」的资源授权，后续权限检查会重新纳入该规则。`
        : `这会停用「${target.acl.resource.name}」到「${target.acl.subject.name}」的资源授权，后续权限检查会忽略该规则。`;
  const confirmLabel =
    target.type === 'DELETE' ? '确认删除' : target.status === 'ACTIVE' ? '确认启用' : '确认停用';

  return (
    <ConfirmDialog
      body={body}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      pending={pending}
      title={title}
    />
  );
}

function AclFilters({
  effectFilter,
  onClearFilters,
  onEffectFilterChange,
  onResourceTypeChange,
  onStatusFilterChange,
  onSubjectTypeChange,
  resourceType,
  statusFilter,
  subjectType,
}: {
  effectFilter: ResourceAclEffect | '';
  onClearFilters: () => void;
  onEffectFilterChange: (value: ResourceAclEffect | '') => void;
  onResourceTypeChange: (value: ResourceAclResourceType | '') => void;
  onStatusFilterChange: (value: Exclude<ResourceAclStatus, 'DELETED'> | '') => void;
  onSubjectTypeChange: (value: ResourceAclSubjectType | '') => void;
  resourceType: ResourceAclResourceType | '';
  statusFilter: Exclude<ResourceAclStatus, 'DELETED'> | '';
  subjectType: ResourceAclSubjectType | '';
}) {
  return (
    <Card className="p-4">
      <div className="grid gap-3 md:grid-cols-5">
        <SelectField label="资源类型" onChange={onResourceTypeChange} value={resourceType}>
          <option value="">全部资源</option>
          {resourceAclResourceOrder.map((type) => (
            <option key={type} value={type}>
              {resourceAclResourceLabels[type]}
            </option>
          ))}
        </SelectField>
        <SelectField label="主体类型" onChange={onSubjectTypeChange} value={subjectType}>
          <option value="">全部主体</option>
          {resourceAclSubjectTypes.map((type) => (
            <option key={type} value={type}>
              {resourceAclSubjectLabels[type]}
            </option>
          ))}
        </SelectField>
        <SelectField label="效果" onChange={onEffectFilterChange} value={effectFilter}>
          <option value="">全部效果</option>
          <option value="ALLOW">允许</option>
          <option value="DENY">拒绝</option>
        </SelectField>
        <SelectField label="状态" onChange={onStatusFilterChange} value={statusFilter}>
          <option value="">全部状态</option>
          <option value="ACTIVE">启用</option>
          <option value="DISABLED">停用</option>
        </SelectField>
        <div className="flex items-end">
          <Button className="w-full" onClick={onClearFilters} type="button" variant="outline">
            清空筛选
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SelectField<T extends string>({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: T) => void;
  value: T;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium text-muted-foreground">
      {label}
      <select
        className="h-9 rounded-md border bg-background/80 px-3 text-sm font-normal text-foreground outline-none"
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function AclRuleTable({
  acls,
  loading,
  onDelete,
  onToggleStatus,
  pending,
  writeDisabled,
}: {
  acls: ResourceAclItem[];
  loading: boolean;
  onDelete: (acl: ResourceAclItem) => void;
  onToggleStatus: (acl: ResourceAclItem) => void;
  pending: boolean;
  writeDisabled: boolean;
}) {
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold">授权规则</h2>
          <p className="mt-1 text-sm text-muted-foreground">拒绝规则优先于允许规则，停用规则不会参与访问校验。</p>
        </div>
        <StatusBadge tone="planned">{acls.length} 条</StatusBadge>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载资源授权规则...</div>
      ) : acls.length === 0 ? (
        <EmptyState
          action={
            <Button asChild size="sm" type="button">
              <Link href="/resource-acls/create">
                <KeyRound className="size-4" />
                新建授权
              </Link>
            </Button>
          }
          className="py-12"
          description="暂无对象级资源授权规则。"
          title="暂无资源授权"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['资源', '主体', '权限编码', '效果', '状态', '条件', '更新时间', '操作'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {acls.map((acl, index) => (
                <motion.tr
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b transition-colors last:border-0 hover:bg-muted/25"
                  initial={{ opacity: 0, y: 8 }}
                  key={acl.id}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{acl.resource.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {resourceAclResourceLabels[acl.resource_type]} · {acl.resource.code ?? acl.resource_id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{acl.subject.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {resourceAclSubjectLabels[acl.subject_type]} · {acl.subject.code ?? acl.subject_id.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{acl.permission_code}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={resourceAclEffectTone(acl.effect)}>
                      {resourceAclEffectLabels[acl.effect]}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={resourceAclStatusTone(acl.status)}>
                      {resourceAclStatusLabels[acl.status]}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{acl.condition_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(acl.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/resource-acls/${acl.id}/edit`}>编辑</Link>
                      </Button>
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link
                          href={{
                            pathname: '/resource-acls/check',
                            query: {
                              resource_type: acl.resource_type,
                              resource_id: acl.resource_id,
                              subject_type: acl.subject_type,
                              subject_id: acl.subject_id,
                              permission_code: acl.permission_code,
                            },
                          }}
                        >
                          检查
                        </Link>
                      </Button>
                      <Button
                        disabled={writeDisabled || pending}
                        onClick={() => onToggleStatus(acl)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {acl.status === 'ACTIVE' ? '停用' : '启用'}
                      </Button>
                      <Button
                        disabled={writeDisabled || pending}
                        onClick={() => onDelete(acl)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="size-4" />
                        删除
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
