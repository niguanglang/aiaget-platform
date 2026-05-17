'use client';

import { hasPermission, type CustomerSuccessOpportunityAnalyticsBucket, type CustomerSuccessOpportunityListItem } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  customerSuccessOpportunityRiskLabel,
  customerSuccessOpportunityRiskTone,
  customerSuccessOpportunityStageLabel,
  customerSuccessOpportunityStageTone,
  customerSuccessOpportunityStatusLabel,
  customerSuccessOpportunityStatusTone,
  customerSuccessOpportunityTypeLabel,
  formatDateTime,
  formatMoney,
} from '@/components/customer-success-opportunities/customer-success-opportunity-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getCustomerSuccessOpportunityAnalytics } from '@/lib/api-client';

export function CustomerSuccessOpportunityAnalyticsContent() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const permissions = currentUser?.user.permissions ?? [];
  const canView = Boolean(
    currentUser?.user.roles.some((role) => role.code === 'tenant_admin') ||
      hasPermission(permissions, 'customer:success_opportunity:view'),
  );
  const analyticsQuery = useQuery({
    enabled: !authLoading && canView,
    queryKey: ['customer-success-opportunity-analytics'],
    queryFn: getCustomerSuccessOpportunityAnalytics,
  });
  const analytics = analyticsQuery.data;
  const metrics = useMemo(() => {
    if (!analytics) return [];
    const summary = analytics.summary;

    return [
      { label: '续约机会', value: `${summary.total_count}`, helper: '当前数据范围' },
      { label: '打开机会', value: `${summary.open_count}`, helper: '仍在推进' },
      { label: '风险机会', value: `${summary.at_risk_count}`, helper: `风险率 ${formatPercent(summary.risk_rate)}` },
      { label: '赢单机会', value: `${summary.won_count}`, helper: `转化率 ${formatPercent(summary.conversion_rate)}` },
      { label: '输单机会', value: `${summary.lost_count}`, helper: '已关闭' },
      { label: '预计金额', value: formatMoney(summary.total_estimated_amount), helper: '未折算概率' },
      { label: '加权金额', value: formatMoney(summary.weighted_amount), helper: '金额 x 概率' },
      { label: '平均评分', value: `${summary.average_score} 分`, helper: `平均概率 ${summary.average_probability}%` },
    ];
  }, [analytics]);
  const maxStageAmount = Math.max(...(analytics?.stage_funnel.map((item) => item.weighted_amount) ?? [0]), 1);

  if (!authLoading && !canView) {
    return (
      <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
        <Card className="p-6 text-sm text-muted-foreground">
          当前账号没有查看续约机会分析的权限。
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-2xl font-semibold">续约机会分析</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/customer-success-opportunities">
              <ArrowLeft className="size-4" />
              返回清单
            </Link>
          </Button>
          <Button disabled={analyticsQuery.isFetching || !canView} onClick={() => void analyticsQuery.refetch()} variant="outline">
            <RefreshCw className={analyticsQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            刷新分析
          </Button>
        </div>
      </section>

      {analyticsQuery.isError ? (
        <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">续约机会分析加载失败。</Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analyticsQuery.isLoading || authLoading
          ? Array.from({ length: 8 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => <MetricSummary helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      {!analyticsQuery.isLoading && analytics?.summary.total_count === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/customer-success-opportunities">返回机会清单</Link>
            </Button>
          }
          title="暂无可分析的续约机会"
        />
      ) : null}

      {analytics ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="grid gap-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="size-4 text-primary" />
                  阶段漏斗
                </div>
                <span className="text-xs text-muted-foreground">按加权金额排序呈现阶段压力</span>
              </div>
              <div className="grid gap-3">
                {analytics.stage_funnel.map((item) => (
                  <div className="grid gap-2 rounded-lg border bg-background/70 p-3" key={item.stage}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge tone={customerSuccessOpportunityStageTone(item.stage)}>{customerSuccessOpportunityStageLabel(item.stage)}</StatusBadge>
                      <div className="text-sm text-muted-foreground">
                        {item.count} 个 · {formatMoney(item.amount)} · 加权 {formatMoney(item.weighted_amount)}
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${Math.max(item.weighted_amount > 0 ? 8 : 0, (item.weighted_amount / maxStageAmount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4">
              <BreakdownCard
                emptyText="暂无类型分布"
                items={analytics.type_breakdown}
                labelOf={(key) => customerSuccessOpportunityTypeLabel(key)}
                title="类型分布"
              />
              <BreakdownCard
                emptyText="暂无风险分布"
                items={analytics.risk_breakdown}
                labelOf={(key) => customerSuccessOpportunityRiskLabel(key)}
                title="风险分布"
              />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <OpportunityListCard items={analytics.top_opportunities} mode="top" title="高价值机会 Top 5" />
            <OpportunityListCard items={analytics.upcoming_closes} mode="upcoming" title="近期关闭机会" />
          </section>
        </>
      ) : null}
    </main>
  );
}

function MetricSummary({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

function BreakdownCard({
  emptyText,
  items,
  labelOf,
  title,
}: {
  emptyText: string;
  items: CustomerSuccessOpportunityAnalyticsBucket[];
  labelOf: (key: string) => string;
  title: string;
}) {
  const maxWeightedAmount = Math.max(...items.map((item) => item.weighted_amount), 1);

  return (
    <Card className="grid gap-3 p-5">
      <div className="text-sm font-semibold">{title}</div>
      {items.length === 0 ? (
        <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        items.map((item) => (
          <div className="grid gap-2" key={item.key}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{labelOf(item.key)}</span>
              <span className="text-muted-foreground">{item.count} 个 · {formatMoney(item.weighted_amount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-slate-900/70" style={{ width: `${Math.max(8, (item.weighted_amount / maxWeightedAmount) * 100)}%` }} />
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

function OpportunityListCard({
  items,
  mode,
  title,
}: {
  items: CustomerSuccessOpportunityListItem[];
  mode: 'top' | 'upcoming';
  title: string;
}) {
  return (
    <Card className="grid content-start gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{title}</div>
        <span className="text-xs text-muted-foreground">最多 5 条</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
          {mode === 'top' ? '暂无可排序的高价值机会。' : '暂无需要近期关闭的打开机会。'}
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="grid gap-2 rounded-lg border bg-background/70 p-3" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link className="font-medium hover:text-primary" href={`/customer-success-opportunities/${item.id}`}>
                    {item.name}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">{item.customer_name} · {item.owner?.name ?? '未分配负责人'}</div>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/customer-success-opportunities/${item.id}`}>
                    <Eye className="size-4" />
                    详情
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                <StatusBadge tone={customerSuccessOpportunityStatusTone(item.status)}>{customerSuccessOpportunityStatusLabel(item.status)}</StatusBadge>
                <StatusBadge tone={customerSuccessOpportunityStageTone(item.stage)}>{customerSuccessOpportunityStageLabel(item.stage)}</StatusBadge>
                <StatusBadge tone={customerSuccessOpportunityRiskTone(item.risk_level)}>{customerSuccessOpportunityRiskLabel(item.risk_level)}</StatusBadge>
              </div>
              <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <span>预计 {formatMoney(item.estimated_amount)} · 加权 {formatMoney(item.weighted_amount)}</span>
                <span>{mode === 'upcoming' ? `预计关闭 ${formatDateTime(item.expected_close_at)}` : `概率 ${item.probability}% · 评分 ${item.opportunity_score}`}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)}%`;
}
