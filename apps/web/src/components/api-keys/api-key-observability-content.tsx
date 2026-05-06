'use client';

import type { ExternalApiCallLogItem, ExternalApiObservabilityWindow, ExternalApiSecurityDenialItem } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { formatDateTime } from '@/components/agents/agent-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getExternalApiObservability } from '@/lib/api-client';

import { ErrorBanner, NoticeBanner, callStatusLabel, callStatusTone, formatInteger, formatLatency, formatMoney, formatPercent, quotaRiskLabel, quotaRiskTone, windowLabel, windowOptions } from './api-key-shared';

export function ApiKeyObservabilityContent() {
  const [observabilityWindow, setObservabilityWindow] = useState<ExternalApiObservabilityWindow>('24h');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const observabilityQuery = useQuery({
    queryKey: ['external-api-observability', observabilityWindow],
    queryFn: () => getExternalApiObservability({ window: observabilityWindow }),
  });

  const overview = observabilityQuery.data ?? null;
  const summary = overview?.summary;
  const metrics = [
    { label: '外部请求', value: formatInteger(summary?.total_requests), helper: `${windowLabel(observabilityWindow)} 窗口` },
    { label: '成功率', value: summary ? formatPercent(summary.success_rate) : '-', helper: `${formatInteger(summary?.success_requests)} 次成功` },
    { label: '拒绝事件', value: formatInteger(summary?.denied_requests), helper: '安全/权限拦截' },
    { label: '词元消耗', value: formatInteger(summary?.total_tokens), helper: formatMoney(summary?.total_cost) },
  ];

  async function copyText(value: string, message: string) {
    try {
      await navigator.clipboard?.writeText(value);
      setNotice(message);
      setErrorMessage(null);
    } catch {
      setNotice(null);
      setErrorMessage('复制失败，请手动选中文本复制。');
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2"><StatusBadge tone="ready">M57</StatusBadge><StatusBadge tone="healthy">外部调用观测</StatusBadge><StatusBadge tone="mock">{windowLabel(observabilityWindow)}</StatusBadge></div>
          <h1 className="text-2xl font-semibold">外部 API 调用观测</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">聚合外部系统通过 API Key 调用 Agent 的请求、额度消耗、安全拒绝和 Trace 线索。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border bg-background px-3 text-sm" onChange={(event) => setObservabilityWindow(event.target.value as ExternalApiObservabilityWindow)} value={observabilityWindow}>
            {windowOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <Button onClick={() => void observabilityQuery.refetch()} type="button" variant="outline"><RefreshCw className="size-4" />刷新观测</Button>
          <Button asChild type="button" variant="outline"><a href="/api-reference"><BookOpen className="size-4" />接口文档</a></Button>
          <Button asChild type="button" variant="outline"><a href="/api-keys">返回列表</a></Button>
        </div>
      </section>

      <NoticeBanner message={notice} />
      <ErrorBanner message={errorMessage ?? (observabilityQuery.isError ? '外部 API 调用观测加载失败。' : null)} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {observabilityQuery.isLoading ? Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-lg border bg-muted/30" key={index} />) : metrics.map((metric) => <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <ExternalCallListCard calls={overview?.recent_calls ?? []} loading={observabilityQuery.isLoading} onCopy={copyText} window={observabilityWindow} />
        <div className="grid gap-4">
          <QuotaWatchCard items={overview?.quota_watch ?? []} loading={observabilityQuery.isLoading} />
          <SecurityDenialCard items={overview?.security_denials ?? []} loading={observabilityQuery.isLoading} onCopy={copyText} window={observabilityWindow} />
        </div>
      </section>
    </main>
  );
}

function ExternalCallListCard({ calls, loading, onCopy, window }: { calls: ExternalApiCallLogItem[]; loading: boolean; onCopy: (value: string, message: string) => void; window: ExternalApiObservabilityWindow }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h2 className="text-sm font-semibold">最近外部调用</h2><p className="mt-1 text-sm text-muted-foreground">按操作日志聚合外部 Agent 调用，并尽量关联 Trace、词元和成本。</p></div><StatusBadge tone="mock">{calls.length} 条</StatusBadge></div>
      {loading ? <div className="grid gap-3">{Array.from({ length: 3 }).map((_, index) => <div className="h-24 rounded-md border bg-muted/30" key={index} />)}</div> : calls.length === 0 ? <EmptyState description="当前时间窗口内没有外部调用记录。" title="暂无外部调用" /> : (
        <div className="grid gap-3">{calls.map((call) => <div className="rounded-md border bg-background/90 p-4" key={call.event_id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={callStatusTone(call.status)}>{callStatusLabel(call.status)}</StatusBadge><span className="text-sm font-semibold">{call.agent_name ?? call.agent_id ?? '未知 Agent'}</span><span className="font-mono text-xs text-muted-foreground">{call.status_code}</span></div><div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2"><span>密钥：{call.api_key_name ?? call.masked_key ?? '未关联'}</span><span>时间：{formatDateTime(call.occurred_at)}</span><span>词元：{formatInteger(call.total_tokens)} · 成本：{formatMoney(call.cost_total)}</span><span>延迟：{formatLatency(call.latency_ms)}</span><span>IP：{call.ip ?? '未知'}</span><span className="truncate">请求：{call.request_id}</span></div>{call.error_message ? <div className="mt-2 text-xs text-destructive">{call.error_message}</div> : null}</div><div className="flex flex-wrap justify-end gap-2">{call.trace_id ? <><Button onClick={() => onCopy(call.trace_id ?? '', 'Trace ID 已复制。')} size="sm" type="button" variant="outline"><Copy className="size-4" />Trace</Button><Button asChild size="sm" type="button" variant="outline"><a href={`/monitor?trace=${encodeURIComponent(call.trace_id)}&window=${window}`}><ExternalLink className="size-4" />监控</a></Button></> : null}<Button onClick={() => onCopy(call.request_id, 'Request ID 已复制。')} size="sm" type="button" variant="outline"><Copy className="size-4" />请求</Button><Button asChild size="sm" type="button" variant="outline"><a href={`/audit?keyword=${encodeURIComponent(call.request_id)}&window=${window}`}>审计</a></Button></div></div></div>)}</div>
      )}
    </Card>
  );
}

function QuotaWatchCard({ items, loading }: { items: Awaited<ReturnType<typeof getExternalApiObservability>>['quota_watch']; loading: boolean }) {
  return <Card className="grid gap-4 p-5"><div><h2 className="text-sm font-semibold">额度关注</h2><p className="mt-1 text-sm text-muted-foreground">按日额度使用率排序，优先展示风险密钥。</p></div>{loading ? <div className="grid gap-2">{Array.from({ length: 3 }).map((_, index) => <div className="h-16 rounded-md border bg-muted/30" key={index} />)}</div> : items.length === 0 ? <EmptyState description="暂无可观测的 API Key 额度数据。" title="暂无额度数据" /> : <div className="grid gap-2">{items.map((item) => <div className="rounded-md border bg-muted/20 p-3" key={item.api_key_id}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{item.api_key_name}</div><div className="mt-1 font-mono text-xs text-muted-foreground">{item.masked_key}</div></div><StatusBadge tone={quotaRiskTone(item.risk_level)}>{quotaRiskLabel(item.risk_level)}</StatusBadge></div><div className="mt-2 grid gap-1 text-xs text-muted-foreground"><span>今日：{formatInteger(item.used_count_today)} / {item.daily_quota === null ? '不限' : formatInteger(item.daily_quota)}</span><span>剩余：{item.remaining_today === null ? '不限' : formatInteger(item.remaining_today)}</span><span>使用率：{item.usage_rate === null ? '未设额度' : formatPercent(item.usage_rate)}</span><span>最近使用：{formatDateTime(item.last_used_at)}</span></div></div>)}</div>}</Card>;
}

function SecurityDenialCard({ items, loading, onCopy, window }: { items: ExternalApiSecurityDenialItem[]; loading: boolean; onCopy: (value: string, message: string) => void; window: ExternalApiObservabilityWindow }) {
  return <Card className="grid gap-4 p-5"><div><h2 className="text-sm font-semibold">安全拒绝</h2><p className="mt-1 text-sm text-muted-foreground">展示外部调用触发的权限、数据范围、资源授权和安全策略拒绝。</p></div>{loading ? <div className="grid gap-2">{Array.from({ length: 2 }).map((_, index) => <div className="h-20 rounded-md border bg-muted/30" key={index} />)}</div> : items.length === 0 ? <EmptyState description="当前窗口没有外部调用安全拒绝事件。" title="暂无拒绝事件" /> : <div className="grid gap-2">{items.map((item) => <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3" key={item.event_id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-sm font-medium text-amber-900">{item.reason}</div><div className="mt-1 grid gap-1 text-xs text-amber-800"><span>来源：{item.source ?? '安全事件'}</span><span>密钥：{item.api_key_prefix ? `${item.api_key_prefix}****` : item.api_key_id ?? '未关联'}</span><span>Agent：{item.agent_id ?? '未知'}</span><span>时间：{formatDateTime(item.occurred_at)}</span></div></div><div className="flex shrink-0 flex-col gap-2">{item.trace_id ? <Button onClick={() => onCopy(item.trace_id ?? '', 'Trace ID 已复制。')} size="sm" type="button" variant="outline"><Copy className="size-4" />Trace</Button> : null}<Button asChild size="sm" type="button" variant="outline"><a href={`/audit?keyword=${encodeURIComponent(item.request_id)}&window=${window}`}>审计</a></Button></div></div></div>)}</div>}</Card>;
}
