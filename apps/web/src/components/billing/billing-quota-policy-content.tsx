'use client';

import { hasPermission, type BillingQuotaEnforcementResult, type BillingQuotaPolicyItem, type BillingWindow } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  ActionMessage,
  BillingConfirmDialog,
  BillingWorkspaceHeader,
  Field,
  PageError,
  type QuotaPolicyDraft,
  RefreshButton,
  SegmentedSelect,
  formatDateTime,
  formatPercent,
  formatQuotaValue,
  quotaActionLabels,
  quotaActions,
  quotaMetricLabels,
  quotaPolicyStatusLabels,
  quotaPolicyStatuses,
  quotaSubjectLabels,
  riskLabels,
  riskTone,
  toQuotaPolicyInput,
} from '@/components/billing/billing-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { enforceBillingQuota, getBillingOverview, updateBillingQuotaPolicy } from '@/lib/api-client';

type QuotaPolicyActionTarget =
  | { type: 'enforce' }
  | { id: string; input: NonNullable<ReturnType<typeof toQuotaPolicyInput>>; name: string; type: 'save' };

export function BillingQuotaPolicyContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [windowValue, setWindowValue] = useState<BillingWindow>('24h');
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyDraft, setPolicyDraft] = useState<QuotaPolicyDraft | null>(null);
  const [quotaDecision, setQuotaDecision] = useState<BillingQuotaEnforcementResult | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [quotaPolicyActionTarget, setQuotaPolicyActionTarget] = useState<QuotaPolicyActionTarget | null>(null);

  const canManageSettings = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:settings:manage'),
  );

  const billingQuery = useQuery({
    queryKey: ['billing-quota-policy-page-overview', windowValue],
    queryFn: () => getBillingOverview({ window: windowValue }),
  });
  const policies = billingQuery.data?.quota_policies ?? [];
  const activePolicy = policies.find((policy) => policy.id === editingPolicyId) ?? null;

  const quotaPolicyMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: NonNullable<ReturnType<typeof toQuotaPolicyInput>> }) =>
      updateBillingQuotaPolicy(id, input),
    onSuccess: async () => {
      setActionMessage('额度策略配置已保存。');
      setQuotaPolicyActionTarget(null);
      setEditingPolicyId(null);
      setPolicyDraft(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['billing-quota-policy-page-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['billing-overview'] }),
      ]);
    },
    onError: () => setActionMessage('额度策略保存失败，请检查阈值或系统设置权限。'),
  });

  const quotaEnforcementMutation = useMutation({
    mutationFn: () => enforceBillingQuota({ subject_type: 'TENANT', metric_type: 'COST', period: 'MONTH', usage_delta: 0 }),
    onSuccess: (result) => {
      setQuotaDecision(result);
      setQuotaPolicyActionTarget(null);
      setActionMessage(`执行检查完成：${result.allow ? '允许继续使用' : '触发阻断'}。`);
    },
    onError: () => setActionMessage('执行检查失败，请确认计费中心查看权限。'),
  });

  const startEditPolicy = (policy: BillingQuotaPolicyItem) => {
    setEditingPolicyId(policy.id);
    setPolicyDraft({
      limit_value: String(policy.limit_value),
      warn_threshold: String(policy.warn_threshold),
      hard_threshold: String(policy.hard_threshold),
      action: policy.action,
      status: policy.status === 'DELETED' ? 'DISABLED' : policy.status,
    });
    setActionMessage(null);
  };

  const requestQuotaPolicySave = () => {
    if (!activePolicy || !policyDraft) return;
    const input = toQuotaPolicyInput(policyDraft);
    if (!input) {
      setActionMessage('额度上限与阈值必须是有效数字，且预警阈值不能高于硬限制阈值。');
      return;
    }
    setQuotaPolicyActionTarget({ id: activePolicy.id, input, name: activePolicy.name, type: 'save' });
  };

  function confirmQuotaPolicyAction() {
    if (!quotaPolicyActionTarget) return;
    if (quotaPolicyActionTarget.type === 'enforce') {
      quotaEnforcementMutation.mutate();
      return;
    }
    quotaPolicyMutation.mutate({
      id: quotaPolicyActionTarget.id,
      input: quotaPolicyActionTarget.input,
    });
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <BillingWorkspaceHeader
        actions={
          <>
            <Button disabled={quotaEnforcementMutation.isPending} onClick={() => setQuotaPolicyActionTarget({ type: 'enforce' })} type="button" variant="outline">
              <ShieldAlert className="size-4" />
              {quotaEnforcementMutation.isPending ? '检查中...' : '执行检查'}
            </Button>
            <RefreshButton loading={billingQuery.isFetching} onClick={() => void billingQuery.refetch()} />
          </>
        }
        backHref="/billing"
        badge="额度"
        onWindowChange={setWindowValue}
        title="额度策略配置与执行检查"
        windowValue={windowValue}
      />

      {!canManageSettings ? <PageError>当前账号没有 system:settings:manage 权限，策略配置保存按钮已禁用。</PageError> : null}
      {billingQuery.isError ? <PageError>额度策略加载失败。</PageError> : null}
      {actionMessage ? <ActionMessage>{actionMessage}</ActionMessage> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="ACTIVE 状态" label="启用策略" value={String(policies.filter((item) => item.status === 'ACTIVE').length)} />
        <MetricCard helper="动作包含阻断" label="阻断策略" value={String(policies.filter((item) => item.action === 'BLOCK').length)} />
        <MetricCard helper="风险等级" label="高危策略" value={String(policies.filter((item) => item.risk_level === 'CRITICAL').length)} />
        <MetricCard helper="当前窗口" label="策略总数" value={String(policies.length)} />
      </section>

      {quotaDecision ? (
        <Card className="grid gap-3 p-4 md:grid-cols-5">
          <MetricTile label="决策" value={quotaDecision.allow ? '允许' : '阻断'} />
          <MetricTile label="动作" value={quotaDecision.action ? quotaActionLabels[quotaDecision.action] : '无策略'} />
          <MetricTile label="当前用量" value={formatQuotaValue('COST', quotaDecision.current_usage)} />
          <MetricTile label="上限" value={quotaDecision.limit === null ? '未限制' : formatQuotaValue('COST', quotaDecision.limit)} />
          <MetricTile label="原因" value={quotaDecision.reason} />
        </Card>
      ) : null}

      <Card className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="size-4 text-primary" />
            策略配置
          </div>
          <span className="text-xs text-muted-foreground">{policies.length} 条策略</span>
        </div>
        {billingQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">正在加载额度策略...</div>
        ) : policies.length === 0 ? (
          <EmptyState description="暂无租户级额度策略。" title="暂无策略" />
        ) : (
          <div className="grid gap-3">
            {policies.map((item) => {
              const editing = editingPolicyId === item.id && policyDraft;
              return (
                <div className="rounded-md border bg-muted/15 p-3" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{item.name}</span>
                        <StatusBadge tone={riskTone(item.risk_level)}>{riskLabels[item.risk_level]}</StatusBadge>
                        <StatusBadge tone={item.status === 'ACTIVE' ? 'healthy' : 'planned'}>{quotaPolicyStatusLabels[item.status]}</StatusBadge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {quotaSubjectLabels[item.subject_type]} · {quotaMetricLabels[item.metric_type]} · {item.period === 'MONTH' ? '月度' : '日度'}
                      </div>
                    </div>
                    <Button disabled={!canManageSettings || quotaPolicyMutation.isPending} onClick={() => startEditPolicy(item)} size="sm" type="button" variant="outline">
                      编辑
                    </Button>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-primary/55" style={{ width: `${Math.min(100, item.usage_rate)}%` }} />
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-5">
                    <span>当前：{formatQuotaValue(item.metric_type, item.current_usage)}</span>
                    <span>limit_value：{formatQuotaValue(item.metric_type, item.limit_value)}</span>
                    <span>warn_threshold：{formatPercent(item.warn_threshold)}</span>
                    <span>hard_threshold：{formatPercent(item.hard_threshold)}</span>
                    <span>最后检查：{formatDateTime(item.last_evaluated_at)}</span>
                  </div>
                  {editing ? (
                    <div className="mt-4 grid gap-3 rounded-md border bg-background/70 p-3">
                      <div className="grid gap-3 md:grid-cols-3">
                        <Field label="额度上限">
                          <Input min={0} onChange={(event) => setPolicyDraft({ ...policyDraft, limit_value: event.target.value })} type="number" value={policyDraft.limit_value} />
                        </Field>
                        <Field label="预警阈值">
                          <Input min={0} onChange={(event) => setPolicyDraft({ ...policyDraft, warn_threshold: event.target.value })} type="number" value={policyDraft.warn_threshold} />
                        </Field>
                        <Field label="硬限制阈值">
                          <Input min={0} onChange={(event) => setPolicyDraft({ ...policyDraft, hard_threshold: event.target.value })} type="number" value={policyDraft.hard_threshold} />
                        </Field>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <SegmentedSelect label="超限动作" onChange={(value) => setPolicyDraft({ ...policyDraft, action: value as QuotaPolicyDraft['action'] })} options={quotaActions.map((action) => ({ label: quotaActionLabels[action], value: action }))} value={policyDraft.action} />
                        <SegmentedSelect label="策略状态" onChange={(value) => setPolicyDraft({ ...policyDraft, status: value as QuotaPolicyDraft['status'] })} options={quotaPolicyStatuses.map((status) => ({ label: quotaPolicyStatusLabels[status], value: status }))} value={policyDraft.status} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button disabled={quotaPolicyMutation.isPending} onClick={() => { setEditingPolicyId(null); setPolicyDraft(null); }} type="button" variant="outline">取消</Button>
                        <Button disabled={!canManageSettings || quotaPolicyMutation.isPending} onClick={requestQuotaPolicySave} type="button">
                          {quotaPolicyMutation.isPending ? '保存中...' : '保存策略'}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {quotaPolicyActionTarget ? (
        <BillingConfirmDialog
          body={
            quotaPolicyActionTarget.type === 'enforce' ? (
              <>
                确认执行额度检查？系统会计算预警、限流、审批或阻断结果。
              </>
            ) : (
              <>
                确认保存额度策略「{quotaPolicyActionTarget.name}」？新阈值和超限动作会影响后续模型调用、API 调用和 Agent 运行的额度拦截判断。
              </>
            )
          }
          confirmLabel={quotaPolicyActionTarget.type === 'enforce' ? '确认检查' : '确认保存'}
          onCancel={() => setQuotaPolicyActionTarget(null)}
          onConfirm={confirmQuotaPolicyAction}
          pending={quotaPolicyActionTarget.type === 'enforce' ? quotaEnforcementMutation.isPending : quotaPolicyMutation.isPending}
          title={quotaPolicyActionTarget.type === 'enforce' ? '确认执行额度检查' : '确认保存额度策略'}
        />
      ) : null}
    </main>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}
