'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hasPermission,
  type CreateSecurityPolicyInput,
  type SecurityCenterDenialItem,
  type SecurityCenterModuleSummary,
  type SecurityCenterOverview,
  type SecurityCenterRiskLevel,
  type SecurityCenterRiskSignal,
  SecurityPolicyDecision,
  SecurityPolicyDetail,
  SecurityPolicyEffect,
  SecurityPolicyEvaluationItem,
  SecurityPolicyListItem,
  SecurityPolicyStatus,
  SimulateSecurityPolicyResult,
  UpdateSecurityPolicyInput,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  DatabaseZap,
  Edit,
  FileSearch,
  KeyRound,
  Play,
  Plus,
  Power,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { SecurityPolicyBackground } from '@/components/security/security-policy-background';
import {
  formatDateTime,
  securityPolicyDecisionLabel,
  securityPolicyDecisionTone,
  securityPolicyEffectLabel,
  securityPolicyEffectTone,
  securityPolicyStatusLabel,
  securityPolicyStatusTone,
} from '@/components/security/security-policy-status';
import { parseJsonObjectText, stringifyJson } from '@/components/tools/tool-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  createSecurityPolicy,
  deleteSecurityPolicy,
  disableSecurityPolicy,
  enableSecurityPolicy,
  getSecurityCenterOverview,
  getSecurityPolicy,
  getSecurityPolicyOverview,
  listSecurityPolicies,
  listSecurityPolicyEvaluations,
  simulateSecurityPolicy,
  updateSecurityPolicy,
  type ApiClientError,
} from '@/lib/api-client';

const policyStatuses: SecurityPolicyStatus[] = ['ACTIVE', 'DISABLED', 'DELETED'];
const policyEffects: SecurityPolicyEffect[] = ['DENY', 'ALLOW'];
const securityModuleIcons = {
  security_policies: ShieldCheck,
  data_scopes: SlidersHorizontal,
  resource_acls: KeyRound,
  approvals: ClipboardCheck,
  audit: FileSearch,
  monitor: Activity,
} satisfies Record<SecurityCenterModuleSummary['key'], typeof ShieldCheck>;

const defaultConditions = {
  all: [
    {
      path: 'subject.department_id',
      operator: 'eq',
      value: 'sales',
      label: '主体部门匹配',
    },
  ],
};

const defaultSubject = {
  id: 'user_001',
  role: 'operator',
  department_id: 'sales',
  security_level: 'internal',
};

const defaultResource = {
  id: 'agent_001',
  type: 'agent',
  owner_department_id: 'sales',
  security_level: 'internal',
};

const defaultContext = {
  ip: '127.0.0.1',
  channel: 'console',
};

export function SecurityPolicyContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [effect, setEffect] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicyDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SecurityPolicyListItem | SecurityPolicyDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [simulateResult, setSimulateResult] = useState<SimulateSecurityPolicyResult | null>(null);
  const [simulateAction, setSimulateAction] = useState('read');
  const [subjectText, setSubjectText] = useState(stringifyJson(defaultSubject));
  const [resourceText, setResourceText] = useState(stringifyJson(defaultResource));
  const [contextText, setContextText] = useState(stringifyJson(defaultContext));

  const canWrite = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'security:rule:manage'),
  );

  const overviewQuery = useQuery({
    queryKey: ['security-policy-overview'],
    queryFn: getSecurityPolicyOverview,
  });

  const securityCenterQuery = useQuery({
    queryKey: ['security-center-overview'],
    queryFn: getSecurityCenterOverview,
  });

  const policiesQuery = useQuery({
    queryKey: ['security-policies', keyword, status, effect, resourceType],
    queryFn: () =>
      listSecurityPolicies({
        page: 1,
        page_size: 20,
        keyword,
        status,
        effect,
        resource_type: resourceType,
      }),
  });

  const evaluationsQuery = useQuery({
    queryKey: ['security-policy-evaluations'],
    queryFn: () =>
      listSecurityPolicyEvaluations({
        page: 1,
        page_size: 12,
      }),
  });

  const policies = policiesQuery.data?.items ?? [];
  const overview = overviewQuery.data ?? null;
  const evaluations = evaluationsQuery.data?.items ?? [];
  const securityOverview = securityCenterQuery.data ?? null;

  const createMutation = useMutation({
    mutationFn: createSecurityPolicy,
    onSuccess: async (policy) => {
      await refreshAfterPolicyChange(policy);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateSecurityPolicyInput }) =>
      updateSecurityPolicy(id, values),
    onSuccess: async (policy) => {
      await refreshAfterPolicyChange(policy);
      closeForm();
    },
    onError: (error: ApiClientError) => setFormError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'ACTIVE' | 'DISABLED' }) =>
      nextStatus === 'ACTIVE' ? enableSecurityPolicy(id) : disableSecurityPolicy(id),
    onSuccess: async (policy) => {
      await refreshAfterPolicyChange(policy);
      setActionError(null);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSecurityPolicy,
    onSuccess: async () => {
      setDeleteTarget(null);
      setActionError(null);
      await invalidateSecurityQueries(queryClient);
    },
    onError: (error: ApiClientError) => setActionError(error.message),
  });

  const simulateMutation = useMutation({
    mutationFn: simulateSecurityPolicy,
    onSuccess: async (result) => {
      setSimulateResult(result);
      setSimulateError(null);
      await queryClient.invalidateQueries({ queryKey: ['security-policy-evaluations'] });
      await queryClient.invalidateQueries({ queryKey: ['security-policy-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['security-center-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['security-policies'] });
    },
    onError: (error: ApiClientError) => setSimulateError(error.message),
  });

  async function refreshAfterPolicyChange(policy: SecurityPolicyDetail) {
    queryClient.setQueryData(['security-policy', policy.id], policy);
    await invalidateSecurityQueries(queryClient);
  }

  function clearFilters() {
    setKeyword('');
    setStatus('');
    setEffect('');
    setResourceType('');
  }

  function openCreateForm() {
    setFormError(null);
    setEditingPolicy(null);
    setFormMode('create');
  }

  async function openEditForm(policy: SecurityPolicyListItem | SecurityPolicyDetail) {
    setFormError(null);
    const detail =
      'conditions' in policy
        ? policy
        : await queryClient.fetchQuery({
            queryKey: ['security-policy', policy.id],
            queryFn: () => getSecurityPolicy(policy.id),
          });

    setEditingPolicy(detail);
    setFormMode('edit');
  }

  function closeForm() {
    setFormError(null);
    setEditingPolicy(null);
    setFormMode(null);
  }

  function submitForm(values: PolicyFormValues) {
    setFormError(null);
    const payload = toPolicyPayload(values);
    if (!payload.ok) {
      setFormError(payload.message);
      return;
    }

    if (formMode === 'create') {
      createMutation.mutate(payload.value as CreateSecurityPolicyInput);
      return;
    }

    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, values: payload.value });
    }
  }

  function runSimulation() {
    const subject = parseJsonObjectText(subjectText, '主体属性');
    if (!subject.ok) {
      setSimulateError(subject.message);
      return;
    }

    const resource = parseJsonObjectText(resourceText, '资源属性');
    if (!resource.ok) {
      setSimulateError(resource.message);
      return;
    }

    const context = parseJsonObjectText(contextText, '上下文属性', { allowEmpty: true });
    if (!context.ok) {
      setSimulateError(context.message);
      return;
    }

    simulateMutation.mutate({
      action: simulateAction,
      subject: subject.value ?? {},
      resource: resource.value ?? {},
      context: context.value,
    });
  }

  const metrics = [
    {
      label: '安全评分',
      value: `${securityOverview?.posture.score ?? 100}`,
      helper: securityOverview ? securityRiskLevelLabel(securityOverview.posture.level) : '正在计算',
    },
    {
      label: '待审批',
      value: `${securityOverview?.metrics.pending_approvals ?? 0}`,
      helper: `${securityOverview?.metrics.runtime_pending_approvals ?? 0} 个运行时请求`,
    },
    {
      label: '拒绝规则',
      value: `${(securityOverview?.metrics.deny_policies ?? overview?.deny ?? 0) + (securityOverview?.metrics.resource_acl_deny ?? 0)}`,
      helper: '策略与资源授权',
    },
    {
      label: '安全事件',
      value: `${securityOverview?.metrics.security_events_24h ?? 0}`,
      helper: `${securityOverview?.metrics.failed_monitor_events_24h ?? 0} 个运行异常`,
    },
    {
      label: '策略拒绝',
      value: `${securityOverview?.metrics.security_policy_denials_24h ?? 0}`,
      helper: '最近 24 小时',
    },
    {
      label: '列表过滤',
      value: `${securityOverview?.metrics.list_data_scope_filters ?? 0}`,
      helper: 'DataScope 生效范围',
    },
    {
      label: 'ACL 条件',
      value: `${securityOverview?.metrics.resource_acl_condition_checks ?? 0}`,
      helper: '条件化授权规则',
    },
  ];

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <SecurityPolicyBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M38</StatusBadge>
            <StatusBadge tone="healthy">M40 权限闭环</StatusBadge>
            <StatusBadge tone="healthy">ABAC</StatusBadge>
            <StatusBadge tone="ready">RBAC + DataScope + ACL</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">安全中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            统一查看安全态势、列表数据范围、资源授权条件、安全策略拒绝、高危审批、审计日志和运行监控。
          </p>
        </div>
        <Button className="w-full md:w-auto" disabled={!canWrite} onClick={openCreateForm}>
          <Plus className="size-4" />
          新建策略
        </Button>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <SecurityCenterOverviewPanel
        loading={securityCenterQuery.isLoading}
        overview={securityOverview}
        policyTotal={overview?.total ?? policiesQuery.data?.total ?? 0}
      />

      {actionError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">策略清单</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    按优先级匹配策略，同等优先级下拒绝规则优先，用于收紧企业级访问边界。
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {policies.length} / {policiesQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_150px_150px_150px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索名称、编码、动作"
                    value={keyword}
                  />
                </label>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatus(event.target.value)} value={status}>
                  <option value="">全部状态</option>
                  {policyStatuses.map((item) => (
                    <option key={item} value={item}>
                      {securityPolicyStatusLabel(item)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setEffect(event.target.value)} value={effect}>
                  <option value="">全部效果</option>
                  {policyEffects.map((item) => (
                    <option key={item} value={item}>
                      {securityPolicyEffectLabel(item)}
                    </option>
                  ))}
                </select>
                <Input onChange={(event) => setResourceType(event.target.value)} placeholder="资源类型" value={resourceType} />
                <Button onClick={clearFilters} type="button" variant="outline">
                  清空
                </Button>
              </div>
            </div>
          </div>

          {policiesQuery.isError ? (
            <div className="p-6 text-sm text-destructive">策略加载失败。</div>
          ) : policiesQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载安全策略...</div>
          ) : policies.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canWrite} onClick={openCreateForm}>
                  <Plus className="size-4" />
                  新建策略
                </Button>
              }
              description="创建第一条 ABAC 策略，建议先用模拟面板验证条件路径和命中结果。"
              title="暂无安全策略"
            />
          ) : (
            <PolicyTable
              canWrite={canWrite}
              onDelete={setDeleteTarget}
              onEdit={(policy) => void openEditForm(policy)}
              onToggle={(policy) =>
                statusMutation.mutate({
                  id: policy.id,
                  nextStatus: policy.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                })
              }
              policies={policies}
              pending={statusMutation.isPending}
            />
          )}
        </Card>

        <SimulationPanel
          action={simulateAction}
          canWrite={canWrite}
          contextText={contextText}
          error={simulateError}
          onActionChange={setSimulateAction}
          onContextChange={setContextText}
          onResourceChange={setResourceText}
          onRun={runSimulation}
          onSubjectChange={setSubjectText}
          pending={simulateMutation.isPending}
          resourceText={resourceText}
          result={simulateResult}
          subjectText={subjectText}
        />
      </section>

      <EvaluationLogCard evaluations={evaluations} loading={evaluationsQuery.isLoading} />

      {formMode ? (
        <PolicyFormDialog
          error={formError}
          isPending={createMutation.isPending || updateMutation.isPending}
          mode={formMode}
          onClose={closeForm}
          onSubmit={submitForm}
          policy={editingPolicy}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          body={`这会软删除策略 ${deleteTarget.name}，已有评估日志会保留。`}
          pending={deleteMutation.isPending}
          title="删除安全策略？"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        />
      ) : null}
    </main>
  );
}

function PolicyTable({
  canWrite,
  onDelete,
  onEdit,
  onToggle,
  pending,
  policies,
}: {
  canWrite: boolean;
  onDelete: (policy: SecurityPolicyListItem) => void;
  onEdit: (policy: SecurityPolicyListItem) => void;
  onToggle: (policy: SecurityPolicyListItem) => void;
  pending: boolean;
  policies: SecurityPolicyListItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {['策略', '效果', '资源', '动作', '优先级', '状态', '条件', '评估', '更新时间', '操作'].map((column) => (
              <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {policies.map((policy, index) => (
            <motion.tr
              animate={{ opacity: 1, y: 0 }}
              className="border-b transition-colors last:border-0 hover:bg-muted/25"
              initial={{ opacity: 0, y: 8 }}
              key={policy.id}
              transition={{ delay: index * 0.025, duration: 0.22 }}
            >
              <td className="px-4 py-3">
                <div className="grid max-w-sm gap-1">
                  <span className="font-medium">{policy.name}</span>
                  <span className="text-xs text-muted-foreground">{policy.code}</span>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {policy.description ?? '暂无描述'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={securityPolicyEffectTone(policy.effect)}>
                  {securityPolicyEffectLabel(policy.effect)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{policy.resource_type}</td>
              <td className="px-4 py-3 text-muted-foreground">{policy.action}</td>
              <td className="px-4 py-3 text-muted-foreground">{policy.priority}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={securityPolicyStatusTone(policy.status)}>
                  {securityPolicyStatusLabel(policy.status)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{policy.condition_count}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {policy.evaluation_count}
                <div className="text-xs">{formatDateTime(policy.last_evaluated_at)}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(policy.updated_at)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button disabled={!canWrite} onClick={() => onEdit(policy)} size="sm" title="编辑" variant="outline">
                    <Edit className="size-4" />
                  </Button>
                  <Button disabled={!canWrite || pending} onClick={() => onToggle(policy)} size="sm" title={policy.status === 'ACTIVE' ? '停用' : '启用'} variant="outline">
                    <Power className="size-4" />
                  </Button>
                  <Button disabled={!canWrite} onClick={() => onDelete(policy)} size="sm" title="删除" variant="outline">
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

function SimulationPanel({
  action,
  canWrite,
  contextText,
  error,
  onActionChange,
  onContextChange,
  onResourceChange,
  onRun,
  onSubjectChange,
  pending,
  resourceText,
  result,
  subjectText,
}: {
  action: string;
  canWrite: boolean;
  contextText: string;
  error: string | null;
  onActionChange: (value: string) => void;
  onContextChange: (value: string) => void;
  onResourceChange: (value: string) => void;
  onRun: () => void;
  onSubjectChange: (value: string) => void;
  pending: boolean;
  resourceText: string;
  result: SimulateSecurityPolicyResult | null;
  subjectText: string;
}) {
  return (
    <Card className="grid min-w-0 gap-5 p-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4" />
          策略模拟
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          输入主体、资源和上下文属性，验证当前生效策略的命中结果。
        </p>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">动作</span>
          <Input onChange={(event) => onActionChange(event.target.value)} value={action} />
        </label>
        <JsonTextArea label="主体属性" onChange={onSubjectChange} value={subjectText} />
        <JsonTextArea label="资源属性" onChange={onResourceChange} value={resourceText} />
        <JsonTextArea label="上下文属性" onChange={onContextChange} value={contextText} />
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button disabled={!canWrite || pending} onClick={onRun} type="button">
        <Play className="size-4" />
        运行模拟
      </Button>

      {result ? (
        <div className="rounded-md border bg-muted/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">模拟结果</h3>
            <StatusBadge tone={securityPolicyDecisionTone(result.decision)}>
              {securityPolicyDecisionLabel(result.decision)}
            </StatusBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{result.reason}</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <SummaryTile label="检查策略" value={`${result.checked_count}`} />
            <SummaryTile label="命中策略" value={result.matched_policy?.name ?? '无'} />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            请求 {result.evaluation.request_id} · {formatDateTime(result.evaluation.created_at)}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function EvaluationLogCard({
  evaluations,
  loading,
}: {
  evaluations: SecurityPolicyEvaluationItem[];
  loading: boolean;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">评估日志</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          记录模拟器和后续运行时策略检查结果，保留请求 ID 与 trace ID 便于审计追踪。
        </p>
      </div>
      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载评估日志...</div>
      ) : evaluations.length === 0 ? (
        <EmptyState description="运行一次策略模拟后，会在这里生成第一条评估日志。" title="暂无评估日志" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['时间', '决策', '动作', '命中策略', '原因', '请求 ID', 'Trace ID'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evaluations.map((item) => (
                <tr className="border-b last:border-0" key={item.id}>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(item.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={securityPolicyDecisionTone(item.decision)}>
                      {securityPolicyDecisionLabel(item.decision)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.action}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-48 truncate">{item.matched_policy_name ?? '未命中'}</div>
                    <div className="text-xs text-muted-foreground">{item.matched_policy_code ?? '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="max-w-md truncate">{item.reason}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.request_id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.trace_id ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

interface PolicyFormValues {
  name: string;
  code: string;
  description: string;
  effect: SecurityPolicyEffect;
  resource_type: string;
  action: string;
  priority: string;
  conditions: string;
}

function PolicyFormDialog({
  error,
  isPending,
  mode,
  onClose,
  onSubmit,
  policy,
}: {
  error: string | null;
  isPending: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (values: PolicyFormValues) => void;
  policy: SecurityPolicyDetail | null;
}) {
  const [values, setValues] = useState<PolicyFormValues>({
    name: policy?.name ?? '',
    code: policy?.code ?? '',
    description: policy?.description ?? '',
    effect: policy?.effect ?? 'DENY',
    resource_type: policy?.resource_type ?? 'agent',
    action: policy?.action ?? 'read',
    priority: `${policy?.priority ?? 100}`,
    conditions: stringifyJson(policy?.conditions ?? defaultConditions),
  });

  function patchValue<Key extends keyof PolicyFormValues>(key: Key, value: PolicyFormValues[Key]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{mode === 'create' ? '新建安全策略' : '编辑安全策略'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              条件路径支持 subject、resource、context，例如 subject.department_id。
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="outline">
            关闭
          </Button>
        </div>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">名称</span>
              <Input onChange={(event) => patchValue('name', event.target.value)} required value={values.name} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">编码</span>
              <Input disabled={mode === 'edit'} onChange={(event) => patchValue('code', event.target.value)} required value={values.code} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">效果</span>
              <select className="h-10 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => patchValue('effect', event.target.value as SecurityPolicyEffect)} value={values.effect}>
                {policyEffects.map((item) => (
                  <option key={item} value={item}>
                    {securityPolicyEffectLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">优先级</span>
              <Input min={0} onChange={(event) => patchValue('priority', event.target.value)} required type="number" value={values.priority} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">资源类型</span>
              <Input onChange={(event) => patchValue('resource_type', event.target.value)} required value={values.resource_type} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">动作</span>
              <Input onChange={(event) => patchValue('action', event.target.value)} required value={values.action} />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">描述</span>
            <textarea
              className="min-h-20 rounded-md border bg-background/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => patchValue('description', event.target.value)}
              value={values.description}
            />
          </label>

          <JsonTextArea label="条件 JSON" onChange={(value) => patchValue('conditions', value)} value={values.conditions} />

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="outline">
              取消
            </Button>
            <Button disabled={isPending} type="submit">
              {mode === 'create' ? '创建策略' : '保存策略'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function JsonTextArea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        className="min-h-28 resize-y rounded-md border bg-slate-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        value={value}
      />
    </label>
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
      <Card className="w-full max-w-md p-5 shadow-lg">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function toPolicyPayload(values: PolicyFormValues):
  | { ok: true; value: CreateSecurityPolicyInput | UpdateSecurityPolicyInput }
  | { ok: false; message: string } {
  const priority = Number(values.priority);
  if (!Number.isInteger(priority) || priority < 0) {
    return { ok: false, message: '优先级必须是非负整数。' };
  }

  const conditions = parseJsonObjectText(values.conditions, '条件 JSON', { allowEmpty: true });
  if (!conditions.ok) {
    return conditions;
  }

  return {
    ok: true,
    value: {
      name: values.name.trim(),
      code: values.code.trim(),
      description: values.description.trim() || null,
      effect: values.effect,
      resource_type: values.resource_type.trim(),
      action: values.action.trim(),
      priority,
      conditions: conditions.value,
    },
  };
}

async function invalidateSecurityQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['security-center-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-policy-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['security-policies'] }),
    queryClient.invalidateQueries({ queryKey: ['security-policy-evaluations'] }),
  ]);
}

function SecurityCenterOverviewPanel({
  loading,
  overview,
  policyTotal,
}: {
  loading: boolean;
  overview: SecurityCenterOverview | null;
  policyTotal: number;
}) {
  if (loading && !overview) {
    return (
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">正在汇总安全中心数据...</div>
      </Card>
    );
  }

  if (!overview) {
    return (
      <Card className="p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-sm font-semibold">安全态势暂不可用</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              聚合接口暂时无法返回数据，策略治理工作区仍可继续使用。
            </p>
          </div>
          <StatusBadge tone="degraded">总览异常</StatusBadge>
        </div>
      </Card>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="min-w-0 overflow-hidden">
        <div className="border-b p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={securityRiskTone(overview.posture.level)}>
                  {securityRiskLevelLabel(overview.posture.level)}
                </StatusBadge>
                <StatusBadge tone="ready">评分 {overview.posture.score}</StatusBadge>
                <StatusBadge tone="planned">{policyTotal} 条策略</StatusBadge>
              </div>
              <h2 className="mt-3 text-lg font-semibold">安全态势总览</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {overview.posture.summary}
              </p>
            </div>
            <div className="grid min-w-[180px] gap-1 rounded-md border bg-muted/25 p-3 text-sm">
              <span className="text-xs text-muted-foreground">最近生成</span>
              <span className="font-medium">{formatDateTime(overview.generated_at)}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {overview.posture.guard_chain.map((item) => (
              <span className="rounded-md border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {overview.modules.map((module) => (
            <SecurityModuleCard key={module.key} module={module} />
          ))}
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <div className="border-b p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            <h2 className="text-sm font-semibold">运行时拒绝与风险信号</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            从 Guard 拦截、审批、审计、监控、数据权限和授权规则中聚合出的优先检查项。
          </p>
        </div>
        <div className="grid gap-3 p-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-muted-foreground">最近拒绝事件</div>
              <StatusBadge tone={overview.recent.security_denials.length > 0 ? 'degraded' : 'healthy'}>
                {overview.recent.security_denials.length} 条
              </StatusBadge>
            </div>
            {overview.recent.security_denials.length > 0 ? (
              overview.recent.security_denials.slice(0, 4).map((item) => (
                <SecurityDenialCard denial={item} key={item.id} />
              ))
            ) : (
              <div className="rounded-lg border bg-background/70 p-3 text-sm text-muted-foreground">
                最近 24 小时暂无运行时拒绝事件。
              </div>
            )}
          </div>
          <div className="h-px bg-border" />
          {overview.risks.map((risk) => (
            <RiskSignalCard key={risk.id} risk={risk} />
          ))}
        </div>
      </Card>
    </section>
  );
}

function SecurityModuleCard({ module }: { module: SecurityCenterModuleSummary }) {
  const Icon = securityModuleIcons[module.key] ?? ShieldEllipsis;

  return (
    <Link
      className="group grid min-h-[180px] gap-4 rounded-lg border bg-background/70 p-4 transition-colors hover:bg-muted/25"
      href={module.href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md border bg-background">
            <Icon className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">{module.title}</h3>
            <StatusBadge tone={module.status}>{moduleStatusLabel(module.status)}</StatusBadge>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <SummaryTile label={module.primary_metric.label} value={module.primary_metric.value} />
        <SummaryTile label={module.secondary_metric.label} value={module.secondary_metric.value} />
      </div>
      <div className="text-xs text-muted-foreground">{module.action_label} · {module.primary_metric.helper}</div>
    </Link>
  );
}

function SecurityDenialCard({ denial }: { denial: SecurityCenterDenialItem }) {
  return (
    <div className="rounded-lg border bg-background/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="degraded">{securityDenialSourceLabel(denial.source)}</StatusBadge>
            <span className="text-xs text-muted-foreground">{denial.status_code}</span>
            <span className="text-xs text-muted-foreground">{formatDateTime(denial.occurred_at)}</span>
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold">{denial.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{denial.reason}</p>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <span className="truncate">{denial.method} {denial.path}</span>
            <span className="truncate">资源：{denial.resource_type ?? '未知'} / {denial.resource_id ?? '未记录'}</span>
            <span className="truncate">链路：{denial.trace_id ?? denial.request_id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskSignalCard({ risk }: { risk: SecurityCenterRiskSignal }) {
  return (
    <Link className="group rounded-lg border bg-background/70 p-3 transition-colors hover:bg-muted/25" href={risk.href}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={securityRiskTone(risk.severity)}>{securityRiskLevelLabel(risk.severity)}</StatusBadge>
            <span className="text-xs text-muted-foreground">{risk.metric}</span>
          </div>
          <h3 className="mt-2 text-sm font-semibold">{risk.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{risk.description}</p>
        </div>
        <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function securityDenialSourceLabel(source: SecurityCenterDenialItem['source']) {
  if (source === 'DATA_SCOPE') return '数据权限';
  if (source === 'RESOURCE_ACL') return '资源授权';
  if (source === 'SECURITY_POLICY') return '安全策略';
  return '操作拒绝';
}

function securityRiskLevelLabel(level: SecurityCenterRiskLevel) {
  if (level === 'LOW') return '低风险';
  if (level === 'MEDIUM') return '中风险';
  return '高风险';
}

function securityRiskTone(level: SecurityCenterRiskLevel) {
  if (level === 'LOW') return 'healthy';
  if (level === 'MEDIUM') return 'degraded';
  return 'unavailable';
}

function moduleStatusLabel(status: SecurityCenterModuleSummary['status']) {
  if (status === 'healthy') return '正常';
  if (status === 'degraded') return '需关注';
  return '未配置';
}
