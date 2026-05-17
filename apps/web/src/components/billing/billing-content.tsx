'use client';

import type { BillingWindow } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Coins, FileText, Gauge, ReceiptText, Settings2, WalletCards } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import {
  ActionMessage,
  BillingStatTile,
  BillingWorkspaceHeader,
  PageError,
  RefreshButton,
  adjustmentStatusLabels,
  adjustmentStatusTone,
  formatInteger,
  formatMoney,
  formatPercent,
  invoiceStatusLabels,
  invoiceTone,
  quotaActionLabels,
  quotaMetricLabels,
  quotaPolicyStatusLabels,
  quotaSubjectLabels,
  riskLabels,
  riskTone,
  subscriptionStatusLabels,
  subscriptionStatusTone,
} from '@/components/billing/billing-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getBillingOverview } from '@/lib/api-client';

const entryPages = [
  { href: '/billing/usage', title: '用量明细', description: '查看 Token、模型、供应商、API Key 和会话步骤成本。', icon: Coins },
  { href: '/billing/quota-policy', title: '额度策略', description: '策略配置与额度检查。', icon: Gauge },
  { href: '/billing/invoices', title: '发票与账单', description: '查看账单记录、账单项和发票状态入口。', icon: ReceiptText },
  { href: '/billing/adjustments', title: '调账记录', description: '处理退款、折扣、补收和纠错审批记录。', icon: FileText },
  { href: '/billing/subscription', title: '订阅套餐', description: '查看当前套餐、账期和套餐配置入口。', icon: WalletCards },
] as const;

export function BillingContent() {
  const [windowValue, setWindowValue] = useState<BillingWindow>('24h');
  const billingQuery = useQuery({
    queryKey: ['billing-overview', windowValue],
    queryFn: () => getBillingOverview({ window: windowValue }),
  });
  const overview = billingQuery.data;

  const metrics = useMemo(() => {
    const summary = overview?.summary;
    if (!summary) return [];

    return [
      { label: '总成本', value: formatMoney(summary.total_cost), helper: `${windowValue} 窗口` },
      { label: '模型成本', value: formatMoney(summary.model_cost), helper: `${formatInteger(summary.model_calls)} 次调用` },
      { label: '运行步骤成本', value: formatMoney(summary.run_step_cost), helper: '会话步骤聚合' },
      { label: 'Token', value: formatInteger(summary.total_tokens), helper: '模型调用消耗' },
      { label: '月度预测', value: formatMoney(summary.projected_monthly_cost), helper: '按当前窗口折算' },
      { label: '当前周期成本', value: formatMoney(summary.current_period_cost), helper: summary.plan_name ?? '未配置订阅' },
      { label: '风险密钥', value: formatInteger(summary.risky_api_key_count), helper: `平均额度 ${formatPercent(summary.quota_usage_rate)}` },
      { label: '下期估算', value: formatMoney(summary.next_invoice_amount), helper: `调账影响 ${formatMoney(summary.adjustment_total)}` },
    ];
  }, [overview, windowValue]);

  const latestInvoice = overview?.invoices[0] ?? null;
  const latestAdjustment = overview?.adjustments[0] ?? null;
  const highestQuotaRisk = overview?.quota_policies.find((item) => item.risk_level === 'CRITICAL')
    ?? overview?.quota_policies.find((item) => item.risk_level === 'WARNING')
    ?? overview?.quota_policies[0]
    ?? null;
  const latestTrend = overview?.cost_trend.slice(-6) ?? [];
  const maxTrendCost = Math.max(...latestTrend.map((point) => point.total_cost), 0.000001);

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <BillingWorkspaceHeader
        actions={<RefreshButton loading={billingQuery.isFetching} onClick={() => void billingQuery.refetch()} />}
        badge="成本中心"
        description="成本趋势、额度风险、账单摘要、订阅状态和用量入口。"
        onWindowChange={setWindowValue}
        title="成本总览"
        windowValue={windowValue}
      />

      {billingQuery.isError ? <PageError>成本与计费数据加载失败。</PageError> : null}
      {billingQuery.isFetching && overview ? <ActionMessage>正在刷新成本总览数据...</ActionMessage> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {billingQuery.isLoading
          ? Array.from({ length: 8 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => <BillingStatTile detail={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="grid gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Coins className="size-4 text-primary" />
              成本趋势摘要
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/billing/usage">
                查看用量明细
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {billingQuery.isLoading ? (
            <div className="h-52 rounded-md border bg-muted/30" />
          ) : latestTrend.length === 0 ? (
            <EmptyState description="当前窗口暂无可统计的模型调用或运行步骤成本。" title="暂无成本趋势" />
          ) : (
            <div className="grid gap-4">
              <div className="flex h-52 items-end gap-2">
                {latestTrend.map((point) => (
                  <div className="flex min-w-0 flex-1 flex-col justify-end gap-2" key={point.bucket}>
                    <div
                      className="rounded-t-md bg-primary/45"
                      style={{ height: `${Math.max(8, (point.total_cost / maxTrendCost) * 150)}px` }}
                      title={formatMoney(point.total_cost)}
                    />
                    <div className="truncate text-center text-[11px] text-muted-foreground">{point.bucket}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {latestTrend.slice(-3).map((point) => (
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

        <Card className="grid content-start gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="size-4 text-primary" />
            近期项目摘要
          </div>
          <SummaryLine label="当前订阅" value={overview?.subscription?.plan_name ?? '暂无订阅'}>
            {overview?.subscription ? (
              <StatusBadge tone={subscriptionStatusTone(overview.subscription.status)}>{subscriptionStatusLabels[overview.subscription.status]}</StatusBadge>
            ) : null}
          </SummaryLine>
          <SummaryLine label="最近账单" value={latestInvoice?.invoice_no ?? '暂无账单'}>
            {latestInvoice ? <StatusBadge tone={invoiceTone(latestInvoice.status)}>{invoiceStatusLabels[latestInvoice.status]}</StatusBadge> : null}
          </SummaryLine>
          <SummaryLine label="额度策略" value={highestQuotaRisk?.name ?? '暂无策略'}>
            {highestQuotaRisk ? <StatusBadge tone={riskTone(highestQuotaRisk.risk_level)}>{riskLabels[highestQuotaRisk.risk_level]}</StatusBadge> : null}
          </SummaryLine>
          <SummaryLine label="最近调账" value={latestAdjustment?.adjustment_no ?? '暂无调账'}>
            {latestAdjustment ? (
              <StatusBadge tone={adjustmentStatusTone(latestAdjustment.status)}>{adjustmentStatusLabels[latestAdjustment.status]}</StatusBadge>
            ) : null}
          </SummaryLine>
          {highestQuotaRisk ? (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              {quotaSubjectLabels[highestQuotaRisk.subject_type]} · {quotaMetricLabels[highestQuotaRisk.metric_type]} ·
              {quotaPolicyStatusLabels[highestQuotaRisk.status]} · {quotaActionLabels[highestQuotaRisk.action]}
            </div>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {entryPages.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30" href={item.href} key={item.href}>
              <div className="flex items-center justify-between gap-3">
                <Icon className="size-5 text-primary" />
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-4 font-medium">{item.title}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

function SummaryLine({ children, label, value }: { children?: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/15 px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-sm font-medium">{value}</div>
      </div>
      {children}
    </div>
  );
}
