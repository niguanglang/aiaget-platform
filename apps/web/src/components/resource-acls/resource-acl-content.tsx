'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type CreateResourceAclInput,
  type ResourceAclCheckResult,
  type ResourceAclEffect,
  type ResourceAclItem,
  type ResourceAclResourceSummary,
  type ResourceAclResourceType,
  type ResourceAclStatus,
  type ResourceAclSubjectSummary,
  type ResourceAclSubjectType,
  type UpdateResourceAclInput,
} from '@aiaget/shared-types';
import {
  CheckCircle2,
  Database,
  KeyRound,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ResourceAclBackground } from '@/components/resource-acls/resource-acl-background';
import {
  formatDateTime,
  resourceAclDecisionLabel,
  resourceAclDecisionTone,
  resourceAclEffectLabels,
  resourceAclEffectTone,
  resourceAclResourceLabels,
  resourceAclResourceOrder,
  resourceAclStatusLabels,
  resourceAclStatusTone,
  resourceAclSubjectLabels,
  resourceAclSubjectTypes,
} from '@/components/resource-acls/resource-acl-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  checkResourceAcl,
  createResourceAcl,
  deleteResourceAcl,
  getResourceAclOverview,
  listResourceAclOptions,
  listResourceAcls,
  updateResourceAcl,
  type ApiClientError,
} from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface AclDraft {
  id: string | null;
  resource_type: ResourceAclResourceType;
  resource_id: string;
  subject_type: ResourceAclSubjectType;
  subject_id: string;
  permission_code: string;
  effect: ResourceAclEffect;
  status: Exclude<ResourceAclStatus, 'DELETED'>;
  conditions_text: string;
}

const defaultDraft: AclDraft = {
  id: null,
  resource_type: 'AGENT',
  resource_id: '',
  subject_type: 'ROLE',
  subject_id: '',
  permission_code: 'agent:agent:view',
  effect: 'ALLOW',
  status: 'ACTIVE',
  conditions_text: '',
};

export function ResourceAclContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [resourceType, setResourceType] = useState<ResourceAclResourceType>('AGENT');
  const [subjectType, setSubjectType] = useState<ResourceAclSubjectType>('ROLE');
  const [effectFilter, setEffectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [optionKeyword, setOptionKeyword] = useState('');
  const [draft, setDraft] = useState<AclDraft>(defaultDraft);
  const [selectedAclId, setSelectedAclId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<ResourceAclCheckResult | null>(null);

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:resource_acl:manage'),
  );

  const overviewQuery = useQuery({
    queryKey: ['resource-acl-overview'],
    queryFn: getResourceAclOverview,
  });
  const optionsQuery = useQuery({
    queryKey: ['resource-acl-options', resourceType, subjectType, optionKeyword],
    queryFn: () =>
      listResourceAclOptions({
        resource_type: resourceType,
        subject_type: subjectType,
        keyword: optionKeyword,
      }),
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

  const resources = useMemo(() => optionsQuery.data?.resources ?? [], [optionsQuery.data?.resources]);
  const subjects = useMemo(() => optionsQuery.data?.subjects ?? [], [optionsQuery.data?.subjects]);
  const permissions = useMemo(() => optionsQuery.data?.permissions ?? [], [optionsQuery.data?.permissions]);
  const acls = useMemo(() => aclsQuery.data ?? [], [aclsQuery.data]);
  const selectedAcl = acls.find((acl) => acl.id === selectedAclId) ?? null;

  useEffect(() => {
    setDraft((current) => {
      if (current.id) return current;

      return {
        ...current,
        resource_type: resourceType,
        subject_type: subjectType,
        resource_id: current.resource_type === resourceType ? current.resource_id || resources[0]?.id || '' : resources[0]?.id || '',
        subject_id: current.subject_type === subjectType ? current.subject_id || subjects[0]?.id || '' : subjects[0]?.id || '',
        permission_code: permissions.includes(current.permission_code) ? current.permission_code : permissions[0] ?? '',
      };
    });
  }, [permissions, resourceType, resources, subjectType, subjects]);

  useEffect(() => {
    if (selectedAclId && acls.some((acl) => acl.id === selectedAclId)) {
      return;
    }

    if (acls[0]) {
      setSelectedAclId(acls[0].id);
      return;
    }

    setSelectedAclId(null);
  }, [acls, selectedAclId]);

  const createMutation = useMutation({
    mutationFn: createResourceAcl,
    onSuccess: async (acl) => {
      setSelectedAclId(acl.id);
      setDraft(fromAclToDraft(acl));
      setActionError(null);
      setSuccessMessage('资源授权已保存。');
      await refreshAcls();
    },
    onError: (error: ApiClientError) => {
      setSuccessMessage(null);
      setActionError(error.message);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateResourceAclInput }) => updateResourceAcl(id, input),
    onSuccess: async (acl) => {
      setSelectedAclId(acl.id);
      setDraft(fromAclToDraft(acl));
      setActionError(null);
      setSuccessMessage('资源授权已更新。');
      await refreshAcls();
    },
    onError: (error: ApiClientError) => {
      setSuccessMessage(null);
      setActionError(error.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteResourceAcl,
    onSuccess: async () => {
      setSelectedAclId(null);
      newDraft();
      setActionError(null);
      setSuccessMessage('资源授权已删除。');
      await refreshAcls();
    },
    onError: (error: ApiClientError) => {
      setSuccessMessage(null);
      setActionError(error.message);
    },
  });
  const checkMutation = useMutation({
    mutationFn: checkResourceAcl,
    onSuccess: (result) => {
      setCheckResult(result);
      setActionError(null);
    },
    onError: (error: ApiClientError) => {
      setCheckResult(null);
      setActionError(error.message);
    },
  });

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

  async function refreshAcls() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['resource-acl-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['resource-acl-options'] }),
      queryClient.invalidateQueries({ queryKey: ['resource-acls'] }),
    ]);
  }

  function patchDraft(patch: Partial<AclDraft>) {
    setDraft((current) => ({
      ...current,
      ...patch,
    }));
    setSuccessMessage(null);
    setCheckResult(null);
  }

  function changeResourceType(nextType: ResourceAclResourceType) {
    setResourceType(nextType);
    setSelectedAclId(null);
    setDraft({
      ...defaultDraft,
      resource_type: nextType,
      subject_type: subjectType,
      permission_code: '',
    });
    setSuccessMessage(null);
    setActionError(null);
    setCheckResult(null);
  }

  function changeSubjectType(nextType: ResourceAclSubjectType) {
    setSubjectType(nextType);
    setSelectedAclId(null);
    setDraft({
      ...defaultDraft,
      resource_type: resourceType,
      subject_type: nextType,
      permission_code: permissions[0] ?? '',
    });
    setSuccessMessage(null);
    setActionError(null);
    setCheckResult(null);
  }

  function editAcl(acl: ResourceAclItem) {
    setSelectedAclId(acl.id);
    setResourceType(acl.resource_type);
    setSubjectType(acl.subject_type);
    setDraft(fromAclToDraft(acl));
    setActionError(null);
    setSuccessMessage(null);
    setCheckResult(null);
  }

  function newDraft() {
    setSelectedAclId(null);
    setDraft({
      ...defaultDraft,
      resource_type: resourceType,
      resource_id: resources[0]?.id ?? '',
      subject_type: subjectType,
      subject_id: subjects[0]?.id ?? '',
      permission_code: permissions[0] ?? '',
    });
    setActionError(null);
    setSuccessMessage(null);
    setCheckResult(null);
  }

  function clearFilters() {
    setEffectFilter('');
    setStatusFilter('');
    setOptionKeyword('');
  }

  function saveDraft() {
    const validationError = validateDraft(draft);
    if (validationError) {
      setActionError(validationError);
      setSuccessMessage(null);
      return;
    }

    const parsedConditions = parseConditions(draft.conditions_text);
    if (parsedConditions instanceof Error) {
      setActionError(parsedConditions.message);
      setSuccessMessage(null);
      return;
    }

    if (draft.id) {
      updateMutation.mutate({
        id: draft.id,
        input: {
          permission_code: draft.permission_code,
          effect: draft.effect,
          status: draft.status,
          conditions: parsedConditions,
        },
      });
      return;
    }

    const input: CreateResourceAclInput = {
      resource_type: draft.resource_type,
      resource_id: draft.resource_id,
      subject_type: draft.subject_type,
      subject_id: draft.subject_id,
      permission_code: draft.permission_code,
      effect: draft.effect,
      status: draft.status,
      conditions: parsedConditions,
    };
    createMutation.mutate(input);
  }

  function runCheck() {
    const validationError = validateDraft(draft);
    if (validationError) {
      setActionError(validationError);
      setCheckResult(null);
      return;
    }

    checkMutation.mutate({
      resource_type: draft.resource_type,
      resource_id: draft.resource_id,
      subject_type: draft.subject_type,
      subject_id: draft.subject_id,
      permission_code: draft.permission_code,
    });
  }

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ResourceAclBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M36</StatusBadge>
            <StatusBadge tone="healthy">资源授权</StatusBadge>
            <StatusBadge tone="mock">Resource ACL</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">资源授权中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            面向具体 Agent、知识库、工具、模型和会话对象配置授权规则，补齐菜单权限、接口权限、数据权限之后的对象级访问控制。
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={newDraft} type="button" variant="outline">
            <Plus className="size-4" />
            新建授权
          </Button>
          <Button disabled={!canWrite || pending} onClick={saveDraft} type="button">
            <Save className="size-4" />
            保存授权
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
          当前账号缺少 system:resource_acl:manage 权限，只能查看和模拟资源授权。
        </div>
      ) : null}
      {actionError ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <XCircle className="size-4" />
          {actionError}
        </div>
      ) : null}
      {successMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          {successMessage}
        </div>
      ) : null}

      <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[0.78fr_1.12fr_0.9fr]">
        <ResourceSubjectSelector
          draft={draft}
          loading={optionsQuery.isLoading}
          onDraftPatch={patchDraft}
          onKeywordChange={setOptionKeyword}
          onResourceTypeChange={changeResourceType}
          onSubjectTypeChange={changeSubjectType}
          optionKeyword={optionKeyword}
          permissions={permissions}
          resources={resources}
          subjects={subjects}
        />

        <AclRuleList
          acls={acls}
          effectFilter={effectFilter}
          loading={aclsQuery.isLoading}
          onClearFilters={clearFilters}
          onDelete={(acl) => {
            if (!canWrite || deleteMutation.isPending) return;
            deleteMutation.mutate(acl.id);
          }}
          onEdit={editAcl}
          onEffectFilterChange={setEffectFilter}
          onStatusFilterChange={setStatusFilter}
          selectedAclId={selectedAcl?.id ?? null}
          statusFilter={statusFilter}
          writeDisabled={!canWrite || pending}
        />

        <AclEditor
          checkPending={checkMutation.isPending}
          checkResult={checkResult}
          draft={draft}
          onDraftPatch={patchDraft}
          onRunCheck={runCheck}
          onSave={saveDraft}
          pending={pending}
          selectedResource={resources.find((resource) => resource.id === draft.resource_id) ?? selectedAcl?.resource ?? null}
          selectedSubject={subjects.find((subject) => subject.id === draft.subject_id) ?? selectedAcl?.subject ?? null}
          writeDisabled={!canWrite}
        />
      </section>
    </main>
  );
}

function ResourceSubjectSelector({
  draft,
  loading,
  onDraftPatch,
  onKeywordChange,
  onResourceTypeChange,
  onSubjectTypeChange,
  optionKeyword,
  permissions,
  resources,
  subjects,
}: {
  draft: AclDraft;
  loading: boolean;
  onDraftPatch: (patch: Partial<AclDraft>) => void;
  onKeywordChange: (value: string) => void;
  onResourceTypeChange: (value: ResourceAclResourceType) => void;
  onSubjectTypeChange: (value: ResourceAclSubjectType) => void;
  optionKeyword: string;
  permissions: string[];
  resources: ResourceAclResourceSummary[];
  subjects: ResourceAclSubjectSummary[];
}) {
  return (
    <Card className="min-w-0">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">资源与主体</h2>
            <p className="mt-1 text-sm text-muted-foreground">选择要授权的资源对象和授权主体。</p>
          </div>
          <StatusBadge tone="planned">{resources.length}/{subjects.length}</StatusBadge>
        </div>
        <label className="mt-4 flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none"
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索资源或主体"
            value={optionKeyword}
          />
        </label>
      </div>

      <div className="grid gap-4 p-4">
        <div className="grid gap-2">
          <div className="text-xs font-medium text-muted-foreground">资源类型</div>
          <div className="grid grid-cols-2 gap-2">
            {resourceAclResourceOrder.map((type) => (
              <button
                className={cn(
                  'rounded-md border bg-background/75 px-3 py-2 text-left text-sm transition-colors hover:border-blue-200 hover:bg-blue-50/45',
                  draft.resource_type === type && 'border-blue-300 bg-blue-50/70 shadow-sm',
                )}
                disabled={Boolean(draft.id)}
                key={type}
                onClick={() => onResourceTypeChange(type)}
                type="button"
              >
                {resourceAclResourceLabels[type]}
              </button>
            ))}
          </div>
        </div>

        <OptionList
          emptyText="暂无可选资源"
          icon={<Database className="size-4 text-blue-700" />}
          items={resources.map((resource) => ({
            id: resource.id,
            label: resource.name,
            meta: resource.code ?? resource.status ?? resource.type,
          }))}
          loading={loading}
          onSelect={(resourceId) => onDraftPatch({ resource_id: resourceId })}
          selectedId={draft.resource_id}
          title="具体资源"
          disabled={Boolean(draft.id)}
        />

        <div className="grid gap-2">
          <div className="text-xs font-medium text-muted-foreground">主体类型</div>
          <div className="grid grid-cols-2 gap-2">
            {resourceAclSubjectTypes.map((type) => (
              <button
                className={cn(
                  'rounded-md border bg-background/75 px-3 py-2 text-left text-sm transition-colors hover:border-teal-200 hover:bg-teal-50/45',
                  draft.subject_type === type && 'border-teal-300 bg-teal-50/70 shadow-sm',
                )}
                disabled={Boolean(draft.id)}
                key={type}
                onClick={() => onSubjectTypeChange(type)}
                type="button"
              >
                {resourceAclSubjectLabels[type]}
              </button>
            ))}
          </div>
        </div>

        <OptionList
          emptyText="暂无可选主体"
          icon={<UsersRound className="size-4 text-teal-700" />}
          items={subjects.map((subject) => ({
            id: subject.id,
            label: subject.name,
            meta: subject.code ?? resourceAclSubjectLabels[subject.type],
          }))}
          loading={loading}
          onSelect={(subjectId) => onDraftPatch({ subject_id: subjectId })}
          selectedId={draft.subject_id}
          title="授权主体"
          disabled={Boolean(draft.id)}
        />

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">权限编码</label>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none"
            onChange={(event) => onDraftPatch({ permission_code: event.target.value })}
            value={draft.permission_code}
          >
            {permissions.length === 0 ? <option value="">暂无权限编码</option> : null}
            {permissions.map((permission) => (
              <option key={permission} value={permission}>
                {permission}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}

function OptionList({
  disabled,
  emptyText,
  icon,
  items,
  loading,
  onSelect,
  selectedId,
  title,
}: {
  disabled?: boolean;
  emptyText: string;
  icon: React.ReactNode;
  items: Array<{ id: string; label: string; meta: string }>;
  loading: boolean;
  onSelect: (id: string) => void;
  selectedId: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/15 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        <StatusBadge tone="planned">{items.length} 项</StatusBadge>
      </div>
      {loading ? (
        <div className="py-4 text-sm text-muted-foreground">正在加载...</div>
      ) : items.length === 0 ? (
        <div className="py-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="grid max-h-52 gap-2 overflow-y-auto">
          {items.map((item, index) => (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-md border bg-background/80 p-2 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/45 disabled:opacity-70',
                selectedId === item.id && 'border-blue-300 bg-blue-50/75 shadow-sm',
              )}
              disabled={disabled}
              initial={{ opacity: 0, y: 6 }}
              key={item.id}
              onClick={() => onSelect(item.id)}
              transition={{ delay: index * 0.015, duration: 0.18 }}
              type="button"
            >
              <div className="truncate text-sm font-medium">{item.label}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{item.meta}</div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function AclRuleList({
  acls,
  effectFilter,
  loading,
  onClearFilters,
  onDelete,
  onEdit,
  onEffectFilterChange,
  onStatusFilterChange,
  selectedAclId,
  statusFilter,
  writeDisabled,
}: {
  acls: ResourceAclItem[];
  effectFilter: string;
  loading: boolean;
  onClearFilters: () => void;
  onDelete: (acl: ResourceAclItem) => void;
  onEdit: (acl: ResourceAclItem) => void;
  onEffectFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  selectedAclId: string | null;
  statusFilter: string;
  writeDisabled: boolean;
}) {
  return (
    <Card className="min-w-0">
      <div className="flex flex-col justify-between gap-3 border-b p-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-sm font-semibold">授权规则</h2>
          <p className="mt-1 text-sm text-muted-foreground">拒绝规则优先于允许规则，停用规则不会参与模拟检查。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-8 rounded-md border bg-background/80 px-2 text-xs"
            onChange={(event) => onEffectFilterChange(event.target.value)}
            value={effectFilter}
          >
            <option value="">全部效果</option>
            <option value="ALLOW">允许</option>
            <option value="DENY">拒绝</option>
          </select>
          <select
            className="h-8 rounded-md border bg-background/80 px-2 text-xs"
            onChange={(event) => onStatusFilterChange(event.target.value)}
            value={statusFilter}
          >
            <option value="">全部状态</option>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">停用</option>
          </select>
          <Button onClick={onClearFilters} size="sm" type="button" variant="outline">
            清空
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载资源授权规则...</div>
      ) : acls.length === 0 ? (
        <EmptyState
          action={
            <StatusBadge tone="planned">
              <KeyRound className="mr-1 size-3.5" />
              等待授权
            </StatusBadge>
          }
          className="py-12"
          description="选择资源和主体后创建第一条资源授权规则。"
          title="暂无资源授权"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
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
                  className={cn(
                    'border-b transition-colors last:border-0 hover:bg-muted/25',
                    selectedAclId === acl.id && 'bg-blue-50/55',
                  )}
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
                      <Button onClick={() => onEdit(acl)} size="sm" type="button" variant="outline">
                        编辑
                      </Button>
                      <Button
                        disabled={writeDisabled}
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

function AclEditor({
  checkPending,
  checkResult,
  draft,
  onDraftPatch,
  onRunCheck,
  onSave,
  pending,
  selectedResource,
  selectedSubject,
  writeDisabled,
}: {
  checkPending: boolean;
  checkResult: ResourceAclCheckResult | null;
  draft: AclDraft;
  onDraftPatch: (patch: Partial<AclDraft>) => void;
  onRunCheck: () => void;
  onSave: () => void;
  pending: boolean;
  selectedResource: ResourceAclResourceSummary | null;
  selectedSubject: ResourceAclSubjectSummary | null;
  writeDisabled: boolean;
}) {
  return (
    <Card className="min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">编辑与模拟</h2>
          <p className="mt-1 text-sm text-muted-foreground">{draft.id ? '正在编辑已有授权。' : '创建新的资源授权规则。'}</p>
        </div>
        <StatusBadge tone={draft.id ? 'mock' : 'ready'}>{draft.id ? '编辑' : '新建'}</StatusBadge>
      </div>

      <div className="mt-4 grid gap-4">
        <SummaryBlock resource={selectedResource} subject={selectedSubject} />

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">授权效果</label>
          <div className="grid grid-cols-2 gap-2">
            {(['ALLOW', 'DENY'] as ResourceAclEffect[]).map((effect) => (
              <button
                className={cn(
                  'rounded-lg border bg-background/80 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40',
                  draft.effect === effect && 'border-blue-300 bg-blue-50/70 shadow-sm',
                )}
                disabled={writeDisabled}
                key={effect}
                onClick={() => onDraftPatch({ effect })}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{resourceAclEffectLabels[effect]}</span>
                  {draft.effect === effect ? <ShieldCheck className="size-4 text-blue-700" /> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {effect === 'DENY' ? '显式拒绝会优先生效。' : '允许主体执行该权限动作。'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">状态</label>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none disabled:opacity-70"
            disabled={writeDisabled}
            onChange={(event) => onDraftPatch({ status: event.target.value as AclDraft['status'] })}
            value={draft.status}
          >
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">停用</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">条件 JSON</label>
          <textarea
            className="min-h-28 resize-y rounded-md border bg-background/80 px-3 py-2 font-mono text-xs outline-none focus:border-blue-300 disabled:opacity-70"
            disabled={writeDisabled}
            onChange={(event) => onDraftPatch({ conditions_text: event.target.value })}
            placeholder='例如 {"risk_level":"LOW"}，为空表示无附加条件'
            value={draft.conditions_text}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button disabled={writeDisabled || pending} onClick={onSave} type="button">
            <Save className="size-4" />
            保存授权
          </Button>
          <Button disabled={checkPending} onClick={onRunCheck} type="button" variant="outline">
            <Search className="size-4" />
            模拟检查
          </Button>
        </div>

        <CheckResultPanel result={checkResult} />
      </div>
    </Card>
  );
}

function SummaryBlock({
  resource,
  subject,
}: {
  resource: ResourceAclResourceSummary | null;
  subject: ResourceAclSubjectSummary | null;
}) {
  return (
    <div className="grid gap-2 rounded-lg border bg-muted/15 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Database className="size-4 text-blue-700" />
        当前资源
      </div>
      <div className="rounded-md border bg-background/80 p-3">
        <div className="truncate text-sm font-medium">{resource?.name ?? '未选择资源'}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{resource?.code ?? resource?.id ?? '-'}</div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm font-medium">
        <UsersRound className="size-4 text-teal-700" />
        当前主体
      </div>
      <div className="rounded-md border bg-background/80 p-3">
        <div className="truncate text-sm font-medium">{subject?.name ?? '未选择主体'}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{subject?.code ?? subject?.id ?? '-'}</div>
      </div>
    </div>
  );
}

function CheckResultPanel({ result }: { result: ResourceAclCheckResult | null }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
        点击模拟检查后展示 ALLOW、DENY 或未匹配结果。
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">检查结果</div>
          <p className="mt-1 text-xs text-muted-foreground">共检查 {result.checked_count} 条生效规则。</p>
        </div>
        <StatusBadge tone={resourceAclDecisionTone(result.decision)}>
          {resourceAclDecisionLabel(result.decision)}
        </StatusBadge>
      </div>
      <p className="mt-3 rounded-md border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">{result.reason}</p>
      {result.matched_acl ? (
        <div className="mt-3 rounded-md border bg-blue-50/60 p-3 text-xs text-blue-800">
          命中：{result.matched_acl.resource.name} · {result.matched_acl.subject.name} · {result.matched_acl.permission_code}
        </div>
      ) : null}
    </div>
  );
}

function validateDraft(draft: AclDraft) {
  if (!draft.resource_id) return '请选择具体资源。';
  if (!draft.subject_id) return '请选择授权主体。';
  if (!draft.permission_code) return '请选择权限编码。';

  return null;
}

function parseConditions(value: string): Record<string, unknown> | null | Error {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return new Error('条件 JSON 必须是对象。');
    }

    return parsed as Record<string, unknown>;
  } catch {
    return new Error('条件 JSON 格式不正确。');
  }
}

function fromAclToDraft(acl: ResourceAclItem): AclDraft {
  return {
    id: acl.id,
    resource_type: acl.resource_type,
    resource_id: acl.resource_id,
    subject_type: acl.subject_type,
    subject_id: acl.subject_id,
    permission_code: acl.permission_code,
    effect: acl.effect,
    status: acl.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    conditions_text: acl.conditions ? JSON.stringify(acl.conditions, null, 2) : '',
  };
}
