'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BillingApiKeyQuotaItem,
  BillingCycle,
  BillingConversationCostItem,
  BillingCostTrendPoint,
  BillingInvoiceItem,
  BillingModelCostItem,
  BillingPlanItem,
  BillingProviderCostItem,
  BillingQuotaAction,
  BillingQuotaMetricType,
  BillingQuotaPolicyItem,
  BillingQuotaPolicyStatus,
  BillingQuotaRiskLevel,
  BillingSummary,
  BillingQuotaSubjectType,
  BillingSubscriptionItem,
  BillingSubscriptionStatus,
  BillingWindow,
  UpdateBillingQuotaPolicyInput,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { CalendarClock, Coins, FileText, Gauge, RefreshCw, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatDateTime, formatLatency, formatMoney, formatPercent } from '@/components/monitor/monitor-status';
import { PlatformEventUsagePanel } from '@/components/platform-event-usage/platform-event-usage-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getBillingOverview, updateBillingQuotaPolicy, updateBillingSubscription } from '@/lib/api-client';

const windows: BillingWindow[] = ['24h', '7d'];

const riskLabels: Record<BillingQuotaRiskLevel, string> = {
  NORMAL: '正常',
  WARNING: '预警',
  CRITICAL: '高危',
  UNLIMITED: '未设额度',
};

const subscriptionStatusLabels: Record<BillingSubscriptionStatus, string> = {
  TRIALING: '试用中',
  ACTIVE: '生效中',
  PAST_DUE: '已逾期',
  SUSPENDED: '已暂停',
  CANCELED: '已取消',
};

const invoiceStatusLabels: Record<BillingInvoiceItem['status'], string> = {
  DRAFT: '草稿',
  OPEN: '待支付',
  PAID: '已支付',
  VOID: '已作废',
  OVERDUE: '已逾期',
};

const planTierLabels: Record<BillingPlanItem['tier'], string> = {
  FREE: '免费版',
  TEAM: '团队版',
  BUSINESS: '企业版',
  ENTERPRISE: '旗舰版',
};

const billingCycleLabels: Record<BillingCycle, string> = {
  MONTHLY: '月付',
  YEARLY: '年付',
};

const quotaSubjectLabels: Record<BillingQuotaSubjectType, string> = {
  TENANT: '租户',
  API_KEY: 'API Key',
  AGENT: 'Agent',
  MODEL: '模型',
  PLUGIN: '插件',
};

const quotaMetricLabels: Record<BillingQuotaMetricType, string> = {
  COST: '成本',
  TOKEN: '词元',
  MODEL_CALL: '模型调用',
  API_CALL: '接口调用',
  AGENT_RUN: 'Agent 运行',
  STORAGE_GB: '存储',
};

const quotaActionLabels: Record<BillingQuotaAction, string> = {
  WARN: '预警',
  THROTTLE: '限流',
  REQUIRE_APPROVAL: '需要审批',
  BLOCK: '阻断',
};

const quotaPolicyStatusLabels: Record<BillingQuotaPolicyStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DELETED: '已删除',
};

const quotaActions: BillingQuotaAction[] = ['WARN', 'THROTTLE', 'REQUIRE_APPROVAL', 'BLOCK'];
const quotaPolicyStatuses: BillingQuotaPolicyStatus[] = ['ACTIVE', 'DISABLED'];

export function BillingContent() {
  const queryClient = useQueryClient();
  const [windowValue, setWindowValue] = useState<BillingWindow>('24h');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyDraft, setPolicyDraft] = useState<QuotaPolicyDraft | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const billingQuery = useQuery({
    queryKey: ['billing-overview', windowValue],
    queryFn: () => getBillingOverview({ window: windowValue }),
  });
  const overview = billingQuery.data;
  const activePolicy = overview?.quota_policies.find((policy) => policy.id === editingPolicyId) ?? null;

  const invalidateBilling = () => queryClient.invalidateQueries({ queryKey: ['billing-overview'] });

  const subscriptionMutation = useMutation({
    mutationFn: ({ planId, cycle }: { planId: string; cycle: BillingCycle }) =>
      updateBillingSubscription({ plan_id: planId, billing_cycle: cycle, status: 'ACTIVE' }),
    onSuccess: async () => {
      setActionMessage('订阅已更新，概览数据已刷新。');
      await invalidateBilling();
    },
    onError: () => setActionMessage('订阅更新失败，请确认当前账号是否有系统设置管理权限。'),
  });

  const quotaPolicyMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBillingQuotaPolicyInput }) => updateBillingQuotaPolicy(id, input),
    onSuccess: async () => {
      setActionMessage('额度策略已保存。');
      setEditingPolicyId(null);
      setPolicyDraft(null);
      await invalidateBilling();
    },
    onError: () => setActionMessage('额度策略保存失败，请检查阈值或权限。'),
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

  const savePolicy = () => {
    if (!activePolicy || !policyDraft) return;
    const input = toQuotaPolicyInput(policyDraft);
    if (!input) {
      setActionMessage('额度上限与阈值必须是有效数字，且预警阈值不能高于硬限制阈值。');
      return;
    }
    quotaPolicyMutation.mutate({ id: activePolicy.id, input });
  };

  const metrics = useMemo(() => {
    const summary = overview?.summary;
    if (!summary) return [];

    return [
      { label: '总成本', value: formatMoney(summary.total_cost), helper: `${windowValue} 窗口` },
      { label: '模型成本', value: formatMoney(summary.model_cost), helper: `${summary.model_calls} 次调用` },
      { label: '步骤成本', value: formatMoney(summary.run_step_cost), helper: '会话步骤聚合' },
      { label: '词元', value: formatInteger(summary.total_tokens), helper: '模型调用' },
      { label: '月度预测', value: formatMoney(summary.projected_monthly_cost), helper: '按窗口折算' },
      { label: '当前周期成本', value: formatMoney(summary.current_period_cost), helper: summary.plan_name ?? '未配置订阅' },
      { label: '超额成本', value: formatMoney(summary.overage_cost), helper: `下期估算 ${formatMoney(summary.next_invoice_amount)}` },
      { label: '额度策略', value: formatInteger(summary.active_quota_policy_count), helper: `${summary.quota_blocking_policy_count} 条阻断策略` },
      { label: '风险密钥', value: formatInteger(summary.risky_api_key_count), helper: `平均额度 ${formatPercent(summary.quota_usage_rate)}` },
    ];
  }, [overview, windowValue]);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M47</StatusBadge>
            <StatusBadge tone="ready">M63-3</StatusBadge>
            <StatusBadge tone="healthy">成本</StatusBadge>
            <StatusBadge tone="planned">商业化</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">计费商业化中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            聚合套餐订阅、账单、成本趋势和额度策略，把平台用量转化为可运营的商业化控制台。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-md border bg-background p-1">
            {windows.map((item) => (
              <button
                className={`h-8 rounded px-3 text-sm transition-colors ${windowValue === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                key={item}
                onClick={() => setWindowValue(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <Button onClick={() => void billingQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="size-4" />
            刷新
          </Button>
        </div>
      </motion.section>

      {billingQuery.isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          成本与额度数据加载失败。
        </div>
      ) : null}
      {actionMessage ? (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {actionMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {billingQuery.isLoading
          ? Array.from({ length: 8 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SubscriptionCard loading={billingQuery.isLoading} subscription={overview?.subscription ?? null} summary={overview?.summary ?? null} />
        <PlanCatalogCard
          billingCycle={billingCycle}
          currentSubscription={overview?.subscription ?? null}
          loading={billingQuery.isLoading}
          onBillingCycleChange={setBillingCycle}
          onSelectPlan={(planId) => subscriptionMutation.mutate({ planId, cycle: billingCycle })}
          pendingPlanId={subscriptionMutation.variables?.planId ?? null}
          plans={overview?.plans ?? []}
          saving={subscriptionMutation.isPending}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <QuotaPolicyCard
          activePolicyId={editingPolicyId}
          draft={policyDraft}
          items={overview?.quota_policies ?? []}
          loading={billingQuery.isLoading}
          onCancel={() => {
            setEditingPolicyId(null);
            setPolicyDraft(null);
          }}
          onDraftChange={setPolicyDraft}
          onEdit={startEditPolicy}
          onSave={savePolicy}
          saving={quotaPolicyMutation.isPending}
        />
        <InvoiceCard invoices={overview?.invoices ?? []} loading={billingQuery.isLoading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <CostTrendCard loading={billingQuery.isLoading} points={overview?.cost_trend ?? []} />
        <QuotaRiskCard items={overview?.risky_api_keys ?? []} loading={billingQuery.isLoading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ProviderCostCard items={overview?.provider_costs ?? []} loading={billingQuery.isLoading} />
        <ModelCostCard items={overview?.model_costs ?? []} loading={billingQuery.isLoading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ApiKeyQuotaTable items={overview?.quota_overview ?? []} loading={billingQuery.isLoading} />
        <ConversationCostCard items={overview?.conversation_costs ?? []} loading={billingQuery.isLoading} />
      </section>

      <PlatformEventUsagePanel compact windowValue={windowValue} />
    </main>
  );
}

interface QuotaPolicyDraft {
  limit_value: string;
  warn_threshold: string;
  hard_threshold: string;
  action: BillingQuotaAction;
  status: Exclude<BillingQuotaPolicyStatus, 'DELETED'>;
}

function SubscriptionCard({
  loading,
  subscription,
  summary,
}: {
  loading: boolean;
  subscription: BillingSubscriptionItem | null;
  summary: BillingSummary | null;
}) {
  if (loading) {
    return <Card className="h-80 p-5"><div className="text-sm text-muted-foreground">正在加载当前订阅...</div></Card>;
  }

  if (!subscription || !summary) {
    return (
      <Card className="p-5">
        <EmptyState description="当前租户尚未初始化订阅，后端会在加载概览时创建默认企业版订阅。" title="暂无订阅" />
      </Card>
    );
  }

  const costRate = percentValue(summary.current_period_cost, subscription.included_monthly_cost);
  const tokenRate = percentValue(summary.current_period_tokens, subscription.included_monthly_tokens);
  const callRate = percentValue(summary.current_period_calls, subscription.included_monthly_calls);

  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="size-4 text-primary" />
            当前订阅
          </div>
          <h2 className="mt-3 text-2xl font-semibold">{subscription.plan_name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={subscriptionStatusTone(subscription.status)}>
              {subscriptionStatusLabels[subscription.status]}
            </StatusBadge>
            <StatusBadge tone="planned">{billingCycleLabels[subscription.billing_cycle]}</StatusBadge>
            <StatusBadge tone={subscription.auto_renew ? 'healthy' : 'planned'}>
              {subscription.auto_renew ? '自动续费' : '手动续费'}
            </StatusBadge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">基础价格</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(subscription.base_price)}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <UsageMiniCard label="成本额度" rate={costRate} usage={formatMoney(summary.current_period_cost)} total={formatMoney(subscription.included_monthly_cost)} />
        <UsageMiniCard label="词元额度" rate={tokenRate} usage={formatInteger(summary.current_period_tokens)} total={formatInteger(subscription.included_monthly_tokens)} />
        <UsageMiniCard label="调用额度" rate={callRate} usage={formatInteger(summary.current_period_calls)} total={formatInteger(subscription.included_monthly_calls)} />
      </div>

      <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
        <div>
          <div className="text-xs text-muted-foreground">当前账期</div>
          <div className="mt-1 font-medium">{formatDateShort(subscription.current_period_start)} 至 {formatDateShort(subscription.current_period_end)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">超额成本</div>
          <div className="mt-1 font-medium">{formatMoney(summary.overage_cost)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">下期账单估算</div>
          <div className="mt-1 font-medium">{formatMoney(summary.next_invoice_amount)}</div>
        </div>
      </div>
    </Card>
  );
}

function PlanCatalogCard({
  billingCycle,
  currentSubscription,
  loading,
  onBillingCycleChange,
  onSelectPlan,
  pendingPlanId,
  plans,
  saving,
}: {
  billingCycle: BillingCycle;
  currentSubscription: BillingSubscriptionItem | null;
  loading: boolean;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onSelectPlan: (planId: string) => void;
  pendingPlanId: string | null;
  plans: BillingPlanItem[];
  saving: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">套餐目录</div>
          <p className="mt-1 text-xs text-muted-foreground">切换套餐会同步当前订阅价格、包含额度和账单估算。</p>
        </div>
        <div className="flex rounded-md border bg-background p-1">
          {(['MONTHLY', 'YEARLY'] satisfies BillingCycle[]).map((cycle) => (
            <button
              className={`h-8 rounded px-3 text-sm transition-colors ${billingCycle === cycle ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              key={cycle}
              onClick={() => onBillingCycleChange(cycle)}
              type="button"
            >
              {billingCycleLabels[cycle]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <div className="h-52 rounded-lg border bg-muted/30" key={index} />)}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState description="当前租户暂无可选套餐。" title="暂无套餐" />
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.plan_id === plan.id;
            const price = billingCycle === 'YEARLY' ? plan.yearly_base_price : plan.monthly_base_price;
            return (
              <div
                className={`grid gap-3 rounded-md border p-4 transition-colors ${isCurrent ? 'border-primary/50 bg-primary/5' : 'bg-muted/15 hover:bg-muted/25'}`}
                key={plan.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{plan.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{planTierLabels[plan.tier]}</div>
                  </div>
                  {isCurrent ? <StatusBadge tone="healthy">当前</StatusBadge> : null}
                </div>
                <div>
                  <span className="text-2xl font-semibold">{formatMoney(price)}</span>
                  <span className="ml-1 text-xs text-muted-foreground">/{billingCycle === 'YEARLY' ? '年' : '月'}</span>
                </div>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <span>包含成本 {formatMoney(plan.included_monthly_cost)}/月</span>
                  <span>包含词元 {formatCompact(plan.included_monthly_tokens)}/月</span>
                  <span>包含调用 {formatCompact(plan.included_monthly_calls)}/月</span>
                  <span>存储 {formatInteger(plan.included_storage_gb)} GB</span>
                </div>
                <Button
                  disabled={saving || isCurrent}
                  onClick={() => onSelectPlan(plan.id)}
                  size="sm"
                  type="button"
                  variant={isCurrent ? 'secondary' : 'outline'}
                >
                  {saving && pendingPlanId === plan.id ? '切换中...' : isCurrent ? '已选套餐' : '切换套餐'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function QuotaPolicyCard({
  activePolicyId,
  draft,
  items,
  loading,
  onCancel,
  onDraftChange,
  onEdit,
  onSave,
  saving,
}: {
  activePolicyId: string | null;
  draft: QuotaPolicyDraft | null;
  items: BillingQuotaPolicyItem[];
  loading: boolean;
  onCancel: () => void;
  onDraftChange: (draft: QuotaPolicyDraft) => void;
  onEdit: (policy: BillingQuotaPolicyItem) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-primary" />
          额度策略
        </div>
        <span className="text-xs text-muted-foreground">{items.length} 条策略</span>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载额度策略...</div>
      ) : items.length === 0 ? (
        <EmptyState description="暂无租户级额度策略。" title="暂无策略" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const editing = activePolicyId === item.id && draft;
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
                  <Button disabled={saving} onClick={() => onEdit(item)} size="sm" type="button" variant="outline">
                    编辑
                  </Button>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                  <div className="h-full rounded-full bg-primary/55" style={{ width: `${Math.min(100, item.usage_rate)}%` }} />
                </div>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-4">
                  <span>当前：{formatQuotaValue(item.metric_type, item.current_usage)}</span>
                  <span>上限：{formatQuotaValue(item.metric_type, item.limit_value)}</span>
                  <span>使用率：{formatPercent(item.usage_rate)}</span>
                  <span>动作：{quotaActionLabels[item.action]}</span>
                </div>
                {editing ? (
                  <div className="mt-4 grid gap-3 rounded-md border bg-background/70 p-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label="额度上限">
                        <Input
                          min={0}
                          onChange={(event) => onDraftChange({ ...draft, limit_value: event.target.value })}
                          type="number"
                          value={draft.limit_value}
                        />
                      </Field>
                      <Field label="预警阈值">
                        <Input
                          min={0}
                          onChange={(event) => onDraftChange({ ...draft, warn_threshold: event.target.value })}
                          type="number"
                          value={draft.warn_threshold}
                        />
                      </Field>
                      <Field label="硬限制阈值">
                        <Input
                          min={0}
                          onChange={(event) => onDraftChange({ ...draft, hard_threshold: event.target.value })}
                          type="number"
                          value={draft.hard_threshold}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <SegmentedSelect
                        label="超限动作"
                        onChange={(value) => onDraftChange({ ...draft, action: value as BillingQuotaAction })}
                        options={quotaActions.map((action) => ({ label: quotaActionLabels[action], value: action }))}
                        value={draft.action}
                      />
                      <SegmentedSelect
                        label="策略状态"
                        onChange={(value) => onDraftChange({ ...draft, status: value as QuotaPolicyDraft['status'] })}
                        options={quotaPolicyStatuses.map((status) => ({ label: quotaPolicyStatusLabels[status], value: status }))}
                        value={draft.status}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button disabled={saving} onClick={onCancel} type="button" variant="outline">取消</Button>
                      <Button disabled={saving} onClick={onSave} type="button">{saving ? '保存中...' : '保存策略'}</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function InvoiceCard({ invoices, loading }: { invoices: BillingInvoiceItem[]; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <FileText className="size-4 text-primary" />
        账单列表
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载账单...</div>
      ) : invoices.length === 0 ? (
        <EmptyState description="当前租户暂无账单记录。" title="暂无账单" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['账单', '状态', '账期', '总额', '已付', '到期'].map((column) => (
                  <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr className="border-b last:border-0" key={invoice.id}>
                  <td className="px-3 py-2 font-medium">{invoice.invoice_no}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={invoiceTone(invoice.status)}>{invoiceStatusLabels[invoice.status]}</StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDateShort(invoice.period_start)} 至 {formatDateShort(invoice.period_end)}</td>
                  <td className="px-3 py-2 font-medium">{formatMoney(invoice.total_amount)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatMoney(invoice.paid_amount)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{invoice.due_at ? formatDateShort(invoice.due_at) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function UsageMiniCard({ label, rate, total, usage }: { label: string; rate: number; total: string; usage: string }) {
  return (
    <div className="rounded-md border bg-muted/15 p-3">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{formatPercent(rate)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-primary/50" style={{ width: `${Math.min(100, rate)}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{usage} / {total}</div>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SegmentedSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="grid gap-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`h-8 rounded-md border px-3 text-xs transition-colors ${option.value === value ? 'border-primary/50 bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CostTrendCard({ loading, points }: { loading: boolean; points: BillingCostTrendPoint[] }) {
  const maxCost = Math.max(...points.map((point) => point.total_cost), 0.000001);

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Coins className="size-4 text-primary" />
          成本趋势
        </div>
        <span className="text-xs text-muted-foreground">{points.length} 个时间桶</span>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在计算成本趋势...</div>
      ) : points.length === 0 ? (
        <EmptyState description="当前窗口内暂无模型调用或运行步骤成本。" title="暂无成本数据" />
      ) : (
        <div className="grid gap-4">
          <div className="flex h-56 items-end gap-2">
            {points.map((point) => (
              <div className="flex min-w-0 flex-1 flex-col justify-end gap-2" key={point.bucket}>
                <div className="grid gap-1">
                  <div
                    className="rounded-t-md bg-primary/45"
                    style={{ height: `${Math.max(8, (point.total_cost / maxCost) * 150)}px` }}
                    title={formatMoney(point.total_cost)}
                  />
                </div>
                <div className="truncate text-center text-[11px] text-muted-foreground">{point.bucket}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {points.slice(-3).map((point) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2" key={point.bucket}>
                <div className="text-xs text-muted-foreground">{point.bucket}</div>
                <div className="mt-1 text-sm font-medium">{formatMoney(point.total_cost)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  模型 {formatMoney(point.model_cost)} · 步骤 {formatMoney(point.run_step_cost)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function QuotaRiskCard({ items, loading }: { items: BillingApiKeyQuotaItem[]; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert className="size-4 text-amber-600" />
        额度风险
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在评估接口密钥额度...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前没有达到预警阈值的接口密钥。" title="暂无额度风险" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <QuotaItem item={item} key={item.id} />
          ))}
        </div>
      )}
    </Card>
  );
}

function ProviderCostCard({ items, loading }: { items: BillingProviderCostItem[]; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">供应商成本</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载供应商成本...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口内暂无供应商调用成本。" title="暂无供应商成本" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-3" key={item.provider_id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{item.provider_name}</div>
                  <div className="text-xs text-muted-foreground">{item.provider_type}</div>
                </div>
                <div className="text-right text-sm font-semibold">{formatMoney(item.total_cost)}</div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <span>{item.call_count} 次调用</span>
                <span>{formatInteger(item.total_tokens)} 词元</span>
                <span>成功率 {formatPercent(item.success_rate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ModelCostCard({ items, loading }: { items: BillingModelCostItem[]; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">模型成本排行</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载模型成本...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口内暂无模型调用日志。" title="暂无模型成本" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['模型', '供应商', '调用', '词元', '成本', '平均延迟', '成功率'].map((column) => (
                  <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b last:border-0" key={`${item.provider_name}-${item.request_model}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.model_name}</div>
                    <div className="text-xs text-muted-foreground">{item.request_model}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{item.provider_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.call_count}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatInteger(item.total_tokens)}</td>
                  <td className="px-3 py-2 font-medium">{formatMoney(item.total_cost)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatLatency(item.average_latency_ms)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatPercent(item.success_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ApiKeyQuotaTable({ items, loading }: { items: BillingApiKeyQuotaItem[]; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Gauge className="size-4 text-primary" />
        接口密钥额度
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载接口密钥额度...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前租户暂无机器接口密钥。" title="暂无额度数据" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <QuotaItem item={item} key={item.id} />
          ))}
        </div>
      )}
    </Card>
  );
}

function QuotaItem({ item }: { item: BillingApiKeyQuotaItem }) {
  const usage = item.usage_rate ?? 0;

  return (
    <div className="rounded-md border bg-muted/20 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{item.name}</span>
            <StatusBadge tone={riskTone(item.risk_level)}>{riskLabels[item.risk_level]}</StatusBadge>
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">{item.masked_key}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>{item.daily_quota ? `${item.used_count_today}/${item.daily_quota}` : '不限日额度'}</div>
          <div>{item.rate_limit_per_minute}/分钟</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-primary/50" style={{ width: `${Math.min(100, usage)}%` }} />
      </div>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
        <span>使用率：{item.usage_rate === null ? '未设额度' : formatPercent(item.usage_rate)}</span>
        <span>剩余：{item.remaining_today === null ? '不限' : formatInteger(item.remaining_today)}</span>
        <span>最近使用：{item.last_used_at ? formatDateTime(item.last_used_at) : '从未'}</span>
      </div>
    </div>
  );
}

function ConversationCostCard({
  items,
  loading,
}: {
  items: BillingConversationCostItem[];
  loading: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">会话步骤成本</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载会话步骤成本...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口内暂无会话运行步骤成本。" title="暂无步骤成本" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.agent_id}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{item.agent_name}</div>
                  <div className="text-xs text-muted-foreground">{item.run_count} 次运行</div>
                </div>
                <div className="text-sm font-semibold">{formatMoney(item.total_cost)}</div>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                <span>{formatInteger(item.total_tokens)} 词元</span>
                <span>{formatLatency(item.average_latency_ms)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function riskTone(risk: BillingQuotaRiskLevel) {
  if (risk === 'CRITICAL') return 'unavailable';
  if (risk === 'WARNING') return 'degraded';
  if (risk === 'UNLIMITED') return 'planned';
  return 'healthy';
}

function subscriptionStatusTone(status: BillingSubscriptionStatus) {
  if (status === 'ACTIVE' || status === 'TRIALING') return 'healthy';
  if (status === 'PAST_DUE') return 'degraded';
  if (status === 'SUSPENDED' || status === 'CANCELED') return 'unavailable';
  return 'planned';
}

function invoiceTone(status: BillingInvoiceItem['status']) {
  if (status === 'PAID') return 'healthy';
  if (status === 'OPEN' || status === 'DRAFT') return 'planned';
  if (status === 'OVERDUE') return 'degraded';
  return 'unavailable';
}

function percentValue(usage: number, total: number) {
  if (!total) return 0;
  return Number(((usage / total) * 100).toFixed(1));
}

function formatDateShort(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('zh-CN');
}

function formatCompact(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatQuotaValue(metricType: BillingQuotaMetricType, value: number) {
  if (metricType === 'COST') return formatMoney(value);
  if (metricType === 'STORAGE_GB') return `${formatInteger(value)} GB`;
  return formatInteger(value);
}

function toQuotaPolicyInput(draft: QuotaPolicyDraft): UpdateBillingQuotaPolicyInput | null {
  const limitValue = Number(draft.limit_value);
  const warnThreshold = Number(draft.warn_threshold);
  const hardThreshold = Number(draft.hard_threshold);
  if (
    !Number.isFinite(limitValue) ||
    !Number.isFinite(warnThreshold) ||
    !Number.isFinite(hardThreshold) ||
    limitValue < 0 ||
    warnThreshold < 0 ||
    hardThreshold < 0 ||
    warnThreshold > hardThreshold
  ) {
    return null;
  }

  return {
    limit_value: limitValue,
    warn_threshold: warnThreshold,
    hard_threshold: hardThreshold,
    action: draft.action,
    status: draft.status,
  };
}

function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}
