'use client';

import type { BillingCostTrendPoint, BillingWindow } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { Coins, Gauge } from 'lucide-react';
import { useState } from 'react';

import {
  BillingWorkspaceHeader,
  PageError,
  QuotaItem,
  RefreshButton,
  formatInteger,
  formatLatency,
  formatMoney,
  formatPercent,
} from '@/components/billing/billing-shared';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { getBillingOverview } from '@/lib/api-client';

export function BillingUsageContent() {
  const [windowValue, setWindowValue] = useState<BillingWindow>('24h');
  const billingQuery = useQuery({
    queryKey: ['billing-usage-page-overview', windowValue],
    queryFn: () => getBillingOverview({ window: windowValue }),
  });
  const overview = billingQuery.data;

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <BillingWorkspaceHeader
        actions={<RefreshButton loading={billingQuery.isFetching} onClick={() => void billingQuery.refetch()} />}
        backHref="/billing"
        badge="Usage"
        onWindowChange={setWindowValue}
        title="用量明细 / Token / 成本列表"
        windowValue={windowValue}
      />

      {billingQuery.isError ? <PageError>用量明细加载失败。</PageError> : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <CostTrendCard loading={billingQuery.isLoading} points={overview?.cost_trend ?? []} />
        <ApiKeyQuotaCard loading={billingQuery.isLoading} quota_overview={overview?.quota_overview ?? []} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ProviderCostCard loading={billingQuery.isLoading} provider_costs={overview?.provider_costs ?? []} />
        <ModelCostCard loading={billingQuery.isLoading} model_costs={overview?.model_costs ?? []} />
      </section>

      <ConversationCostCard conversation_costs={overview?.conversation_costs ?? []} loading={billingQuery.isLoading} />
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
                <div
                  className="rounded-t-md bg-primary/45"
                  style={{ height: `${Math.max(8, (point.total_cost / maxCost) * 150)}px` }}
                  title={formatMoney(point.total_cost)}
                />
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

function ProviderCostCard({
  loading,
  provider_costs,
}: {
  loading: boolean;
  provider_costs: NonNullable<Awaited<ReturnType<typeof getBillingOverview>>>['provider_costs'];
}) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">供应商成本</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载供应商成本...</div>
      ) : provider_costs.length === 0 ? (
        <EmptyState description="当前窗口内暂无供应商调用成本。" title="暂无供应商成本" />
      ) : (
        <div className="grid gap-3">
          {provider_costs.map((item) => (
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
                <span>{formatInteger(item.total_tokens)} Token</span>
                <span>成功率 {formatPercent(item.success_rate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ModelCostCard({
  loading,
  model_costs,
}: {
  loading: boolean;
  model_costs: NonNullable<Awaited<ReturnType<typeof getBillingOverview>>>['model_costs'];
}) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">模型成本排行</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载模型成本...</div>
      ) : model_costs.length === 0 ? (
        <EmptyState description="当前窗口内暂无模型调用日志。" title="暂无模型成本" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['模型', '供应商', '调用', 'Token', '成本', '平均延迟', '成功率'].map((column) => (
                  <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model_costs.map((item) => (
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

function ApiKeyQuotaCard({
  loading,
  quota_overview,
}: {
  loading: boolean;
  quota_overview: NonNullable<Awaited<ReturnType<typeof getBillingOverview>>>['quota_overview'];
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Gauge className="size-4 text-primary" />
        API Key 额度与风险
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载 API Key 额度...</div>
      ) : quota_overview.length === 0 ? (
        <EmptyState description="当前租户暂无机器接口密钥。" title="暂无额度数据" />
      ) : (
        <div className="grid gap-3">
          {quota_overview.map((item) => (
            <QuotaItem item={item} key={item.id} />
          ))}
        </div>
      )}
    </Card>
  );
}

function ConversationCostCard({
  conversation_costs,
  loading,
}: {
  conversation_costs: NonNullable<Awaited<ReturnType<typeof getBillingOverview>>>['conversation_costs'];
  loading: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">会话步骤成本</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载会话步骤成本...</div>
      ) : conversation_costs.length === 0 ? (
        <EmptyState description="当前窗口内暂无会话运行步骤成本。" title="暂无步骤成本" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {conversation_costs.map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.agent_id}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{item.agent_name}</div>
                  <div className="text-xs text-muted-foreground">{item.run_count} 次运行</div>
                </div>
                <div className="text-sm font-semibold">{formatMoney(item.total_cost)}</div>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                <span>{formatInteger(item.total_tokens)} Token</span>
                <span>{formatLatency(item.average_latency_ms)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
