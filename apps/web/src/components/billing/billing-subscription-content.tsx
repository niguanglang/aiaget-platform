'use client';

import { hasPermission, type BillingCycle, type BillingSummary, type BillingSubscriptionItem, type BillingWindow } from '@aiaget/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, WalletCards } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  ActionMessage,
  BillingConfirmDialog,
  BillingWorkspaceHeader,
  PageError,
  RefreshButton,
  UsageMiniCard,
  billingCycleLabels,
  formatCompact,
  formatDateShort,
  formatInteger,
  formatMoney,
  percentValue,
  planTierLabels,
  subscriptionStatusLabels,
  subscriptionStatusTone,
} from '@/components/billing/billing-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getBillingOverview, updateBillingSubscription } from '@/lib/api-client';

export function BillingSubscriptionContent() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [windowValue, setWindowValue] = useState<BillingWindow>('24h');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const canManageSettings = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(currentUser?.user.permissions ?? [], 'system:settings:manage'),
  );

  const billingQuery = useQuery({
    queryKey: ['billing-subscription-page-overview', windowValue],
    queryFn: () => getBillingOverview({ window: windowValue }),
  });
  const overview = billingQuery.data;

  const subscriptionMutation = useMutation({
    mutationFn: ({ planId, cycle }: { planId: string; cycle: BillingCycle }) =>
      updateBillingSubscription({ plan_id: planId, billing_cycle: cycle, status: 'ACTIVE' }),
    onSuccess: async () => {
      setActionMessage('订阅套餐配置已更新。');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['billing-subscription-page-overview'] }),
        queryClient.invalidateQueries({ queryKey: ['billing-overview'] }),
      ]);
    },
    onError: () => setActionMessage('订阅套餐配置更新失败，请确认系统设置管理权限。'),
  });

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <BillingWorkspaceHeader
        actions={<RefreshButton loading={billingQuery.isFetching} onClick={() => void billingQuery.refetch()} />}
        backHref="/billing"
        badge="订阅"
        onWindowChange={setWindowValue}
        title="订阅与套餐配置"
        windowValue={windowValue}
      />

      {!canManageSettings ? <PageError>当前账号没有 system:settings:manage 权限，套餐配置按钮已禁用。</PageError> : null}
      {billingQuery.isError ? <PageError>订阅套餐数据加载失败。</PageError> : null}
      {actionMessage ? <ActionMessage>{actionMessage}</ActionMessage> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard helper="当前套餐" label="套餐名称" value={overview?.subscription?.plan_name ?? '暂无'} />
        <MetricCard helper="subscription.status" label="订阅状态" value={overview?.subscription ? subscriptionStatusLabels[overview.subscription.status] : '暂无'} />
        <MetricCard helper="billing_cycle" label="计费周期" value={overview?.subscription ? billingCycleLabels[overview.subscription.billing_cycle] : '暂无'} />
        <MetricCard helper="当前账期消耗" label="周期成本" value={formatMoney(overview?.summary.current_period_cost)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SubscriptionCard loading={billingQuery.isLoading} subscription={overview?.subscription ?? null} summary={overview?.summary ?? null} />
        <PlanCatalogCard
          billingCycle={billingCycle}
          canManage={canManageSettings}
          currentSubscription={overview?.subscription ?? null}
          loading={billingQuery.isLoading}
          onBillingCycleChange={setBillingCycle}
          onSelectPlan={(planId) => subscriptionMutation.mutate({ planId, cycle: billingCycle })}
          pendingPlanId={subscriptionMutation.variables?.planId ?? null}
          plans={overview?.plans ?? []}
          saving={subscriptionMutation.isPending}
        />
      </section>
    </main>
  );
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
  if (loading) return <Card className="h-80 p-5"><div className="text-sm text-muted-foreground">正在加载当前订阅...</div></Card>;
  if (!subscription || !summary) {
    return <Card className="p-5"><EmptyState description="当前租户尚未初始化订阅，后端会在加载概览时创建默认企业版订阅。" title="暂无订阅" /></Card>;
  }

  const costRate = percentValue(summary.current_period_cost, subscription.included_monthly_cost);
  const tokenRate = percentValue(summary.current_period_tokens, subscription.included_monthly_tokens);
  const callRate = percentValue(summary.current_period_calls, subscription.included_monthly_calls);

  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold"><CalendarClock className="size-4 text-primary" />当前套餐</div>
          <h2 className="mt-3 text-2xl font-semibold">{subscription.plan_name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone={subscriptionStatusTone(subscription.status)}>{subscriptionStatusLabels[subscription.status]}</StatusBadge>
            <StatusBadge tone="planned">{billingCycleLabels[subscription.billing_cycle]}</StatusBadge>
            <StatusBadge tone={subscription.auto_renew ? 'healthy' : 'planned'}>{subscription.auto_renew ? '自动续费' : '手动续费'}</StatusBadge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">基础价格</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(subscription.base_price)}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <UsageMiniCard label="成本额度" rate={costRate} usage={formatMoney(summary.current_period_cost)} total={formatMoney(subscription.included_monthly_cost)} />
        <UsageMiniCard label="Token 额度" rate={tokenRate} usage={formatInteger(summary.current_period_tokens)} total={formatInteger(subscription.included_monthly_tokens)} />
        <UsageMiniCard label="调用额度" rate={callRate} usage={formatInteger(summary.current_period_calls)} total={formatInteger(subscription.included_monthly_calls)} />
      </div>

      <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
        <div><div className="text-xs text-muted-foreground">当前账期</div><div className="mt-1 font-medium">{formatDateShort(subscription.current_period_start)} 至 {formatDateShort(subscription.current_period_end)}</div></div>
        <div><div className="text-xs text-muted-foreground">超额成本</div><div className="mt-1 font-medium">{formatMoney(summary.overage_cost)}</div></div>
        <div><div className="text-xs text-muted-foreground">下期账单估算</div><div className="mt-1 font-medium">{formatMoney(summary.next_invoice_amount)}</div></div>
      </div>
    </Card>
  );
}

function PlanCatalogCard({
  billingCycle,
  canManage,
  currentSubscription,
  loading,
  onBillingCycleChange,
  onSelectPlan,
  pendingPlanId,
  plans,
  saving,
}: {
  billingCycle: BillingCycle;
  canManage: boolean;
  currentSubscription: BillingSubscriptionItem | null;
  loading: boolean;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onSelectPlan: (planId: string) => void;
  pendingPlanId: string | null;
  plans: NonNullable<Awaited<ReturnType<typeof getBillingOverview>>>['plans'];
  saving: boolean;
}) {
  const [confirmPlan, setConfirmPlan] = useState<{ id: string; name: string } | null>(null);

  function confirmPlanSelection() {
    if (!confirmPlan) return;
    onSelectPlan(confirmPlan.id);
    setConfirmPlan(null);
  }

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold"><WalletCards className="size-4 text-primary" />套餐配置</div>
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
        <div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div className="h-52 rounded-lg border bg-muted/30" key={index} />)}</div>
      ) : plans.length === 0 ? (
        <EmptyState description="当前租户暂无可选套餐。" title="暂无套餐" />
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentSubscription?.plan_id === plan.id;
            const price = billingCycle === 'YEARLY' ? plan.yearly_base_price : plan.monthly_base_price;
            return (
              <div className={`grid gap-3 rounded-md border p-4 transition-colors ${isCurrent ? 'border-primary/50 bg-primary/5' : 'bg-muted/15 hover:bg-muted/25'}`} key={plan.id}>
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-semibold">{plan.name}</div><div className="mt-1 text-xs text-muted-foreground">{planTierLabels[plan.tier]}</div></div>
                  {isCurrent ? <StatusBadge tone="healthy">当前</StatusBadge> : null}
                </div>
                <div><span className="text-2xl font-semibold">{formatMoney(price)}</span><span className="ml-1 text-xs text-muted-foreground">/{billingCycle === 'YEARLY' ? '年' : '月'}</span></div>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <span>包含成本 {formatMoney(plan.included_monthly_cost)}/月</span>
                  <span>包含 Token {formatCompact(plan.included_monthly_tokens)}/月</span>
                  <span>包含调用 {formatCompact(plan.included_monthly_calls)}/月</span>
                  <span>存储 {formatInteger(plan.included_storage_gb)} GB</span>
                </div>
                <Button disabled={!canManage || saving || isCurrent} onClick={() => setConfirmPlan({ id: plan.id, name: plan.name })} size="sm" type="button" variant={isCurrent ? 'secondary' : 'outline'}>
                  {saving && pendingPlanId === plan.id ? '切换中...' : isCurrent ? '已选套餐' : '切换套餐'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {confirmPlan ? (
        <BillingConfirmDialog
          body={
            <>
              确认将当前租户切换到「{confirmPlan.name}」并使用「{billingCycleLabels[billingCycle]}」计费？切换会同步当前订阅价格、额度和后续账单估算。
            </>
          }
          confirmLabel="确认切换"
          onCancel={() => setConfirmPlan(null)}
          onConfirm={confirmPlanSelection}
          pending={saving && pendingPlanId === confirmPlan.id}
          title="确认切换套餐"
        />
      ) : null}
    </Card>
  );
}
