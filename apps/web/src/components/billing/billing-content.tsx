'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  BillingApiKeyQuotaItem,
  BillingConversationCostItem,
  BillingCostTrendPoint,
  BillingModelCostItem,
  BillingProviderCostItem,
  BillingQuotaRiskLevel,
  BillingWindow,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Coins, Gauge, RefreshCw, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatDateTime, formatLatency, formatMoney, formatPercent } from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getBillingOverview } from '@/lib/api-client';

const windows: BillingWindow[] = ['24h', '7d'];

const riskLabels: Record<BillingQuotaRiskLevel, string> = {
  NORMAL: '正常',
  WARNING: '预警',
  CRITICAL: '高危',
  UNLIMITED: '未设额度',
};

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
      { label: '模型成本', value: formatMoney(summary.model_cost), helper: `${summary.model_calls} 次调用` },
      { label: '步骤成本', value: formatMoney(summary.run_step_cost), helper: '会话步骤聚合' },
      { label: '词元', value: formatInteger(summary.total_tokens), helper: '模型调用' },
      { label: '月度预测', value: formatMoney(summary.projected_monthly_cost), helper: '按窗口折算' },
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
            <StatusBadge tone="healthy">成本</StatusBadge>
            <StatusBadge tone="planned">额度</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">成本与额度中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            聚合模型调用成本、运行步骤成本、词元用量和接口密钥日额度，帮助租户识别成本趋势与额度风险。
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {billingQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => <div className="h-28 rounded-lg border bg-muted/30" key={index} />)
          : metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
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
    </main>
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

function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}
