'use client';

import type {
  MonitorErrorSampleItem,
  MonitorEventSourceType,
  MonitorEventStatus,
  MonitorModule,
  MonitorRunStepMetricItem,
  MonitorRunStepSummary,
  MonitorRunStepType,
  MonitorTrendPoint,
  MonitorWindow,
} from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, ExternalLink, GitBranch, Layers3, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ServiceHealthCard } from '@/components/dashboard/service-health-card';
import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import {
  formatDateTime,
  formatLatency,
  formatMoney,
  formatPercent,
  monitorModuleLabel,
  monitorSourceTypeLabel,
  monitorStepTypeLabel,
  monitorStatusLabel,
  monitorStatusTone,
} from '@/components/monitor/monitor-status';
import { PlatformEventUsagePanel } from '@/components/platform-event-usage/platform-event-usage-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMonitorOverview, listMonitorEvents } from '@/lib/api-client';

const windows: MonitorWindow[] = ['24h', '7d'];
const modules: MonitorModule[] = ['agent', 'prompt', 'model', 'knowledge', 'tool', 'conversation', 'user', 'tenant', 'auth', 'system'];
const statuses: MonitorEventStatus[] = ['SUCCESS', 'DEGRADED', 'FAILED'];
const sourceTypes: MonitorEventSourceType[] = ['operation', 'model_call', 'tool_call', 'knowledge_recall', 'conversation_run', 'conversation_step'];
const stepTypes: MonitorRunStepType[] = ['prompt', 'tool', 'knowledge', 'model', 'response'];

function parseWindowParam(value: string | null): MonitorWindow {
  return windows.includes(value as MonitorWindow) ? (value as MonitorWindow) : '24h';
}

function parseFilterParam<TValue extends string>(value: string | null, allowed: TValue[]) {
  return value && allowed.includes(value as TValue) ? value : '';
}

export function MonitorContent() {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const legacyTraceId = searchParams.get('trace_id');
  const legacyTraceHref = legacyTraceId ? `/monitor/traces/${encodeURIComponent(legacyTraceId)}` : null;
  const [windowValue, setWindowValue] = useState<MonitorWindow>(() => parseWindowParam(searchParams.get('window')));
  const [moduleValue, setModuleValue] = useState(() => parseFilterParam(searchParams.get('module'), modules));
  const [statusValue, setStatusValue] = useState(() => parseFilterParam(searchParams.get('status'), statuses));
  const [sourceValue, setSourceValue] = useState(() => parseFilterParam(searchParams.get('source_type'), sourceTypes));
  const [stepValue, setStepValue] = useState(() => parseFilterParam(searchParams.get('step_type'), stepTypes));
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') ?? '');

  const overviewQuery = useQuery({
    queryKey: ['monitor-overview', windowValue],
    queryFn: () => getMonitorOverview({ window: windowValue }),
  });

  const eventsQuery = useQuery({
    queryKey: ['monitor-events', windowValue, moduleValue, statusValue, sourceValue, stepValue, keyword],
    queryFn: () =>
      listMonitorEvents({
        page: 1,
        page_size: 40,
        window: windowValue,
        module: moduleValue,
        status: statusValue,
        source_type: sourceValue,
        step_type: stepValue,
        keyword,
      }),
  });

  const events = eventsQuery.data?.items ?? [];

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsKey);

    setWindowValue(parseWindowParam(nextParams.get('window')));
    setModuleValue(parseFilterParam(nextParams.get('module'), modules));
    setStatusValue(parseFilterParam(nextParams.get('status'), statuses));
    setSourceValue(parseFilterParam(nextParams.get('source_type'), sourceTypes));
    setStepValue(parseFilterParam(nextParams.get('step_type'), stepTypes));
    setKeyword(nextParams.get('keyword') ?? '');
  }, [searchParamsKey]);

  const metrics = useMemo(() => {
    const summary = overviewQuery.data?.summary;
    if (!summary) return [];

    return [
      { label: '总事件', value: `${summary.events_total}`, helper: `${windowValue} 窗口` },
      { label: '成功率', value: formatPercent(summary.success_rate), helper: '统一事件流' },
      { label: '平均延迟', value: formatLatency(summary.average_latency_ms), helper: '有延迟事件' },
      { label: 'P95 延迟', value: formatLatency(summary.p95_latency_ms), helper: '有延迟事件' },
      { label: '总成本', value: formatMoney(summary.total_cost), helper: '模型调用' },
      { label: '活跃会话', value: `${summary.active_conversations}`, helper: '当前线程' },
    ];
  }, [overviewQuery.data, windowValue]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">M09</StatusBadge>
            <StatusBadge tone="ready">M22</StatusBadge>
            <StatusBadge tone="ready">M46</StatusBadge>
            <StatusBadge tone="healthy">真实监控</StatusBadge>
            <StatusBadge tone="planned">独立下钻</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">监控中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            聚合控制服务、运行时、模型、工具、检索和会话运行数据，保留概览、事件列表、服务健康和快捷入口。
          </p>
        </div>
        <Button
          onClick={() => {
            void overviewQuery.refetch();
            void eventsQuery.refetch();
          }}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          刷新数据
        </Button>
      </motion.section>

      {legacyTraceHref ? (
        <Card className="grid gap-3 border-primary/25 bg-primary/5 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-sm font-semibold">旧 Trace 链接已兼容</div>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              当前链接带有 trace_id={legacyTraceId}，Trace 链路已迁移到独立页面。
            </p>
          </div>
          <Button asChild type="button" variant="outline">
            <Link href={legacyTraceHref}>
              <GitBranch className="size-4" />
              打开 Trace
            </Link>
          </Button>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <QuickEntry href="/monitor/observability" label="可观测性质量" text="Trace 覆盖、慢链路和错误链路" />
        <QuickEntry href="/runtime/workflows" label="工作流后端" text="运行时派发状态和恢复重试" />
        <QuickEntry href="/monitor?status=FAILED" label="异常事件" text="筛选失败事件并进入详情" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ServiceHealthCard
          description="控制服务健康状态，由当前 API 进程直接汇总。"
          health={overviewQuery.data?.health.control_api ?? null}
          isLoading={overviewQuery.isLoading}
          onRefresh={() => void overviewQuery.refetch()}
          title="控制服务"
        />
        <ServiceHealthCard
          description="运行时健康状态，通过同一配置的运行时地址拉取。"
          health={overviewQuery.data?.health.runtime ?? null}
          isLoading={overviewQuery.isLoading}
          onRefresh={() => void overviewQuery.refetch()}
          title="运行时服务"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <RunStepSummaryCard loading={overviewQuery.isLoading} summary={overviewQuery.data?.run_step_summary ?? null} />
        <RunStepBreakdownCard items={overviewQuery.data?.run_step_breakdown ?? []} loading={overviewQuery.isLoading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <TrendCard loading={overviewQuery.isLoading} points={overviewQuery.data?.latency_trend ?? []} />
        <ErrorCard errors={overviewQuery.data?.errors ?? []} loading={overviewQuery.isLoading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <RankingCard
          items={overviewQuery.data?.agent_rankings.map((item) => ({
            title: item.agent_name,
            subtitle: item.agent_code,
            value: `${item.run_count} 次`,
            helper: `成功率 ${formatPercent(item.success_rate)}`,
          })) ?? []}
          loading={overviewQuery.isLoading}
          title="智能体排行"
        />
        <RankingCard
          items={overviewQuery.data?.model_rankings.map((item) => ({
            title: item.model_name,
            subtitle: item.provider_name,
            value: `${item.call_count} 次`,
            helper: `${formatMoney(item.total_cost)} · ${formatLatency(item.average_latency_ms)}`,
          })) ?? []}
          loading={overviewQuery.isLoading}
          title="模型排行"
        />
        <RankingCard
          items={overviewQuery.data?.tool_rankings.map((item) => ({
            title: item.tool_name,
            subtitle: item.tool_code,
            value: `${item.call_count} 次`,
            helper: `${item.failure_count} 次失败 · ${formatLatency(item.average_latency_ms)}`,
          })) ?? []}
          loading={overviewQuery.isLoading}
          title="工具排行"
        />
        <RankingCard
          items={overviewQuery.data?.knowledge_rankings.map((item) => ({
            title: item.knowledge_name,
            subtitle: item.knowledge_code,
            value: `${item.recall_count} 次`,
            helper: `成功率 ${formatPercent(item.success_rate)}`,
          })) ?? []}
          loading={overviewQuery.isLoading}
          title="检索排行"
        />
      </section>

      <PlatformEventUsagePanel windowValue={windowValue} />

      <EventListCard
        events={events}
        eventsTotal={eventsQuery.data?.total ?? 0}
        keyword={keyword}
        loading={eventsQuery.isLoading}
        loadError={eventsQuery.isError}
        moduleValue={moduleValue}
        sourceValue={sourceValue}
        statusValue={statusValue}
        stepValue={stepValue}
        windowValue={windowValue}
        onClear={() => {
          setKeyword('');
          setModuleValue('');
          setStatusValue('');
          setSourceValue('');
          setStepValue('');
          setWindowValue('24h');
        }}
        onKeywordChange={setKeyword}
        onModuleChange={setModuleValue}
        onSourceChange={setSourceValue}
        onStatusChange={setStatusValue}
        onStepChange={setStepValue}
        onWindowChange={setWindowValue}
      />
    </main>
  );
}

function QuickEntry({ href, label, text }: { href: string; label: string; text: string }) {
  return (
    <Link className="rounded-md border bg-background/80 p-4 transition-colors hover:bg-muted/35" href={href}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{label}</div>
        <ExternalLink className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}

function EventListCard({
  events,
  eventsTotal,
  keyword,
  loading,
  loadError,
  moduleValue,
  onClear,
  onKeywordChange,
  onModuleChange,
  onSourceChange,
  onStatusChange,
  onStepChange,
  onWindowChange,
  sourceValue,
  statusValue,
  stepValue,
  windowValue,
}: {
  events: Array<{
    event_id: string;
    trace_id: string;
    module: MonitorModule;
    source_type: MonitorEventSourceType;
    status: MonitorEventStatus;
    title: string;
    summary: string;
    latency_ms: number | null;
    token_total: number | null;
    cost_total: number | null;
    step_type: MonitorRunStepType | null;
    occurred_at: string;
  }>;
  eventsTotal: number;
  keyword: string;
  loading: boolean;
  loadError: boolean;
  moduleValue: string;
  onClear: () => void;
  onKeywordChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onStepChange: (value: string) => void;
  onWindowChange: (value: MonitorWindow) => void;
  sourceValue: string;
  statusValue: string;
  stepValue: string;
  windowValue: MonitorWindow;
}) {
  return (
    <Card className="min-w-0">
      <div className="border-b p-4">
        <div className="grid gap-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-sm font-semibold">统一事件流</h2>
              <p className="mt-1 text-sm text-muted-foreground">列表只负责筛选和导航，事件详情与 Trace 时间线已拆到独立页面。</p>
            </div>
            <div className="text-sm text-muted-foreground">
              显示 {events.length} / {eventsTotal}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-[minmax(220px,1fr)_120px_128px_120px_136px_120px_auto]">
            <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => onKeywordChange(event.target.value)}
                placeholder="搜索追踪、标题、摘要"
                value={keyword}
              />
            </label>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onWindowChange(event.target.value as MonitorWindow)} value={windowValue}>
              {windows.map((windowItem) => (
                <option key={windowItem} value={windowItem}>
                  {windowItem}
                </option>
              ))}
            </select>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onModuleChange(event.target.value)} value={moduleValue}>
              <option value="">全部模块</option>
              {modules.map((moduleItem) => (
                <option key={moduleItem} value={moduleItem}>
                  {monitorModuleLabel(moduleItem)}
                </option>
              ))}
            </select>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onStatusChange(event.target.value)} value={statusValue}>
              <option value="">全部状态</option>
              {statuses.map((statusItem) => (
                <option key={statusItem} value={statusItem}>
                  {monitorStatusLabel(statusItem)}
                </option>
              ))}
            </select>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onSourceChange(event.target.value)} value={sourceValue}>
              <option value="">全部来源</option>
              {sourceTypes.map((sourceItem) => (
                <option key={sourceItem} value={sourceItem}>
                  {monitorSourceTypeLabel(sourceItem)}
                </option>
              ))}
            </select>
            <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onStepChange(event.target.value)} value={stepValue}>
              <option value="">全部步骤</option>
              {stepTypes.map((stepItem) => (
                <option key={stepItem} value={stepItem}>
                  {monitorStepTypeLabel(stepItem)}
                </option>
              ))}
            </select>
            <Button onClick={onClear} type="button" variant="outline">
              清空
            </Button>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="p-6 text-sm text-destructive">监控事件加载失败。</div>
      ) : loading ? (
        <div className="p-6 text-sm text-muted-foreground">正在加载监控事件...</div>
      ) : events.length === 0 ? (
        <EmptyState description="当前筛选窗口内没有事件记录。" title="暂无监控数据" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1360px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['追踪 ID', '模块', '来源', '状态', '标题', '延迟', '词元', '成本', '步骤', '发生时间', '操作'].map((column) => (
                  <th className="px-4 py-3 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <motion.tr
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b transition-colors last:border-0 hover:bg-muted/25"
                  initial={{ opacity: 0, y: 8 }}
                  key={event.event_id}
                  transition={{ delay: index * 0.02, duration: 0.22 }}
                >
                  <td className="px-4 py-3">
                    <Link className="font-mono text-xs text-primary hover:underline" href={`/monitor/traces/${event.trace_id}`}>
                      {event.trace_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{monitorModuleLabel(event.module)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{monitorSourceTypeLabel(event.source_type)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={monitorStatusTone(event.status)}>{monitorStatusLabel(event.status)}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{event.title}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">{event.summary}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatLatency(event.latency_ms)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{event.token_total ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatMoney(event.cost_total)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{monitorStepTypeLabel(event.step_type)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(event.occurred_at)}</td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" type="button" variant="outline">
                      <Link href={`/monitor/events/${event.event_id}`}>详情</Link>
                    </Button>
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

function RunStepSummaryCard({ loading, summary }: { loading: boolean; summary: MonitorRunStepSummary | null }) {
  const items = summary
    ? [
        { label: '步骤总数', value: formatInteger(summary.steps_total), helper: '来自会话运行步骤' },
        { label: '失败步骤', value: formatInteger(summary.failed_steps), helper: '状态为失败' },
        { label: '平均步骤延迟', value: formatLatency(summary.average_latency_ms), helper: '含模型、检索、工具' },
        { label: '步骤词元', value: formatInteger(summary.total_tokens), helper: '模型步骤聚合' },
        { label: '步骤成本', value: formatMoney(summary.total_cost), helper: '按步骤成本汇总' },
      ]
    : [];

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="size-4 text-primary" />
          运行步骤观测
        </div>
        <StatusBadge tone="healthy">M22</StatusBadge>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在聚合运行步骤...</div>
      ) : !summary || summary.steps_total === 0 ? (
        <EmptyState description="当前窗口内还没有可聚合的会话运行步骤。" title="暂无步骤数据" />
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.label}>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="mt-1 text-base font-semibold">{item.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.helper}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 rounded-md border bg-background/70 p-3 text-sm">
            <StepCountRow label="模型步骤" total={summary.steps_total} value={summary.model_steps} />
            <StepCountRow label="检索步骤" total={summary.steps_total} value={summary.knowledge_steps} />
            <StepCountRow label="工具步骤" total={summary.steps_total} value={summary.tool_steps} />
          </div>
        </div>
      )}
    </Card>
  );
}

function RunStepBreakdownCard({ items, loading }: { items: MonitorRunStepMetricItem[]; loading: boolean }) {
  const maxCount = Math.max(...items.map((item) => item.step_count), 1);

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers3 className="size-4 text-primary" />
          步骤类型分布
        </div>
        <span className="text-xs text-muted-foreground">{items.length} 类步骤</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在计算步骤分布...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口没有模型、检索或工具步骤。" title="暂无分布数据" />
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border bg-muted/20 p-3"
              initial={{ opacity: 0, y: 8 }}
              key={item.step_type}
              transition={{ delay: index * 0.03, duration: 0.24 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={item.failed_count > 0 ? 'degraded' : 'healthy'}>{monitorStepTypeLabel(item.step_type)}</StatusBadge>
                  <span className="text-sm font-medium">{formatInteger(item.step_count)} 次</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  失败 {formatInteger(item.failed_count)} · P95 {formatLatency(item.p95_latency_ms)}
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-primary/45" style={{ width: `${Math.max(8, (item.step_count / maxCount) * 100)}%` }} />
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>平均 {formatLatency(item.average_latency_ms)}</span>
                <span>词元 {formatInteger(item.total_tokens)}</span>
                <span>成本 {formatMoney(item.total_cost)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
}

function StepCountRow({ label, total, value }: { label: string; total: number; value: number }) {
  const width = total > 0 && value > 0 ? Math.max(6, (value / total) * 100) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatInteger(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary/40" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function TrendCard({ loading, points }: { loading: boolean; points: MonitorTrendPoint[] }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">延迟趋势</h2>
        <span className="text-xs text-muted-foreground">{points.length} 个时间桶</span>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在计算趋势...</div>
      ) : points.length === 0 ? (
        <EmptyState description="当前窗口没有足够的延迟数据。" title="暂无趋势数据" />
      ) : (
        <div className="grid gap-3">
          <div className="flex h-44 items-end gap-2">
            {points.map((point) => (
              <div className="flex min-w-0 flex-1 flex-col justify-end gap-2" key={point.bucket}>
                <div className="w-full rounded-t-md bg-primary/25" style={{ height: `${Math.max(12, Math.min(100, point.average_latency_ms / 4))}%` }} />
                <div className="text-center text-[11px] text-muted-foreground">{point.bucket}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {points.slice(-3).map((point) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2" key={point.bucket}>
                <div className="text-xs text-muted-foreground">{point.bucket}</div>
                <div className="mt-1 text-sm font-medium">{formatLatency(point.average_latency_ms)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {point.success}/{point.total} 成功
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function ErrorCard({ errors, loading }: { errors: MonitorErrorSampleItem[]; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="size-4 text-amber-600" />
        最近错误
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载错误样本...</div>
      ) : errors.length === 0 ? (
        <EmptyState description="当前窗口没有错误事件。" title="暂无错误" />
      ) : (
        <div className="grid gap-3">
          {errors.map((error) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={error.event_id}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{error.title}</div>
                <span className="text-xs text-muted-foreground">{formatDateTime(error.occurred_at)}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{error.error_message}</p>
              <Button asChild className="mt-2" size="sm" type="button" variant="outline">
                <Link href={`/monitor/events/${error.event_id}`}>查看事件</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RankingCard({
  items,
  loading,
  title,
}: {
  items: Array<{ title: string; subtitle: string; value: string; helper: string }>;
  loading: boolean;
  title: string;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载排行...</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无排行数据。</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={`${title}-${item.title}-${index}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                </div>
                <div className="text-sm font-semibold">{item.value}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{item.helper}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}
