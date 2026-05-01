'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  MonitorErrorSampleItem,
  MonitorEventDetail,
  MonitorEventSourceType,
  MonitorEventStatus,
  MonitorModule,
  MonitorObservabilityOverview,
  MonitorRunStepMetricItem,
  MonitorRunStepSummary,
  MonitorRunStepType,
  MonitorTraceDetail,
  MonitorTraceSummaryItem,
  MonitorTrendPoint,
  MonitorWindow,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, Copy, GitBranch, Layers3, Search } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMonitorEvent, getMonitorObservabilityOverview, getMonitorOverview, getMonitorTrace, listMonitorEvents } from '@/lib/api-client';

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
  const [windowValue, setWindowValue] = useState<MonitorWindow>(() => parseWindowParam(searchParams.get('window')));
  const [moduleValue, setModuleValue] = useState(() => parseFilterParam(searchParams.get('module'), modules));
  const [statusValue, setStatusValue] = useState(() => parseFilterParam(searchParams.get('status'), statuses));
  const [sourceValue, setSourceValue] = useState(() => parseFilterParam(searchParams.get('source_type'), sourceTypes));
  const [stepValue, setStepValue] = useState(() => parseFilterParam(searchParams.get('step_type'), stepTypes));
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') ?? '');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
  const activeEventId = selectedEventId ?? events[0]?.event_id ?? null;

  const selectedEventQuery = useQuery({
    enabled: Boolean(activeEventId),
    queryKey: ['monitor-event', activeEventId],
    queryFn: () => getMonitorEvent(activeEventId ?? ''),
  });
  const activeTraceId = selectedEventQuery.data?.trace_id ?? events.find((event) => event.event_id === activeEventId)?.trace_id ?? null;
  const traceQuery = useQuery({
    enabled: Boolean(activeTraceId),
    queryKey: ['monitor-trace', activeTraceId, windowValue],
    queryFn: () => getMonitorTrace(activeTraceId ?? '', { window: windowValue }),
  });
  const observabilityQuery = useQuery({
    queryKey: ['monitor-observability', windowValue],
    queryFn: () => getMonitorObservabilityOverview({ window: windowValue }),
  });

  useEffect(() => {
    if (!events.length) {
      setSelectedEventId(null);
    }
  }, [events]);

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
            <StatusBadge tone="planned">Trace 下钻</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">监控中心</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            聚合控制服务、运行时、模型、工具、检索和会话运行数据，追踪 Trace 链路、传播质量、慢链路和错误来源。
          </p>
        </div>
        <Button onClick={() => {
          void overviewQuery.refetch();
          void eventsQuery.refetch();
          void selectedEventQuery.refetch();
          void traceQuery.refetch();
          void observabilityQuery.refetch();
        }} type="button" variant="outline">
          刷新数据
        </Button>
      </motion.section>

      <ObservabilityOverviewCard
        loading={observabilityQuery.isLoading}
        overview={observabilityQuery.data ?? null}
        onSelectTrace={(traceId) => {
          const event = events.find((item) => item.trace_id === traceId);
          setSelectedEventId(event?.event_id ?? null);
        }}
      />

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
        <RunStepSummaryCard
          loading={overviewQuery.isLoading}
          summary={overviewQuery.data?.run_step_summary ?? null}
        />
        <RunStepBreakdownCard
          items={overviewQuery.data?.run_step_breakdown ?? []}
          loading={overviewQuery.isLoading}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <TrendCard
          loading={overviewQuery.isLoading}
          points={overviewQuery.data?.latency_trend ?? []}
        />
        <ErrorCard
          errors={overviewQuery.data?.errors ?? []}
          loading={overviewQuery.isLoading}
        />
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

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="min-w-0">
          <div className="border-b p-4">
            <div className="grid gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">统一事件流</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    聚合写操作、模型调用、工具执行、检索日志、会话运行和运行步骤，统一查看状态与耗时。
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  显示 {events.length} / {eventsQuery.data?.total ?? 0}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-[minmax(220px,1fr)_120px_128px_120px_136px_120px_auto]">
                <label className="flex h-9 items-center gap-2 rounded-md border bg-background/70 px-3 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    className="min-w-0 flex-1 bg-transparent outline-none"
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="搜索追踪、标题、摘要"
                    value={keyword}
                  />
                </label>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as MonitorWindow)} value={windowValue}>
                  {windows.map((windowItem) => (
                    <option key={windowItem} value={windowItem}>
                      {windowItem}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setModuleValue(event.target.value)} value={moduleValue}>
                  <option value="">全部模块</option>
                  {modules.map((moduleItem) => (
                    <option key={moduleItem} value={moduleItem}>
                      {monitorModuleLabel(moduleItem)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStatusValue(event.target.value)} value={statusValue}>
                  <option value="">全部状态</option>
                  {statuses.map((statusItem) => (
                    <option key={statusItem} value={statusItem}>
                      {monitorStatusLabel(statusItem)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setSourceValue(event.target.value)} value={sourceValue}>
                  <option value="">全部来源</option>
                  {sourceTypes.map((sourceItem) => (
                    <option key={sourceItem} value={sourceItem}>
                      {monitorSourceTypeLabel(sourceItem)}
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setStepValue(event.target.value)} value={stepValue}>
                  <option value="">全部步骤</option>
                  {stepTypes.map((stepItem) => (
                    <option key={stepItem} value={stepItem}>
                      {monitorStepTypeLabel(stepItem)}
                    </option>
                  ))}
                </select>
                <Button onClick={() => {
                  setKeyword('');
                  setModuleValue('');
                  setStatusValue('');
                  setSourceValue('');
                  setStepValue('');
                  setWindowValue('24h');
                }} type="button" variant="outline">
                  清空
                </Button>
              </div>
            </div>
          </div>

          {eventsQuery.isError ? (
            <div className="p-6 text-sm text-destructive">监控事件加载失败。</div>
          ) : eventsQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">正在加载监控事件...</div>
          ) : events.length === 0 ? (
            <EmptyState description="当前筛选窗口内没有事件记录。" title="暂无监控数据" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {['追踪 ID', '模块', '来源', '状态', '标题', '延迟', '词元', '成本', '步骤', '发生时间'].map((column) => (
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
                      onClick={() => setSelectedEventId(event.event_id)}
                      transition={{ delay: index * 0.02, duration: 0.22 }}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{event.trace_id}</td>
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
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <TraceDetailPanel
          loading={traceQuery.isLoading}
          trace={traceQuery.data ?? null}
          traceId={activeTraceId}
        />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <EventDetailPanel
          event={selectedEventQuery.data ?? null}
          loading={selectedEventQuery.isLoading}
        />
        <TraceSignalCards
          loading={observabilityQuery.isLoading}
          overview={observabilityQuery.data ?? null}
          onSelectTrace={(traceId) => {
            const event = events.find((item) => item.trace_id === traceId);
            setSelectedEventId(event?.event_id ?? null);
          }}
        />
      </section>
    </main>
  );
}

function RunStepSummaryCard({
  loading,
  summary,
}: {
  loading: boolean;
  summary: MonitorRunStepSummary | null;
}) {
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

function ObservabilityOverviewCard({
  loading,
  overview,
  onSelectTrace,
}: {
  loading: boolean;
  overview: MonitorObservabilityOverview | null;
  onSelectTrace: (traceId: string) => void;
}) {
  const metrics = overview
    ? [
        { label: 'Trace 覆盖率', value: formatPercent(overview.trace_coverage), helper: `${overview.window} 窗口` },
        { label: '关联 Trace', value: formatInteger(overview.linked_trace_count), helper: '可下钻链路' },
        { label: '孤儿事件', value: formatInteger(overview.orphan_event_count), helper: '缺少标准 Trace' },
        { label: '错误 Trace', value: formatInteger(overview.error_trace_count), helper: '包含失败或降级' },
        { label: '慢 Trace', value: formatInteger(overview.slow_trace_count), helper: 'P95 超过阈值' },
      ]
    : [];

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GitBranch className="size-4 text-primary" />
            可观测性质量
          </div>
          <p className="mt-1 text-sm text-muted-foreground">检查事件是否能汇入 Trace 链路，并快速定位错误链路和慢链路。</p>
        </div>
        <StatusBadge tone={overview && overview.trace_coverage >= 80 ? 'healthy' : 'degraded'}>
          {loading ? '计算中' : overview && overview.trace_coverage >= 80 ? '覆盖良好' : '需要关注'}
        </StatusBadge>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="h-24 rounded-md border bg-muted/30" key={index} />
          ))}
        </div>
      ) : !overview ? (
        <EmptyState description="当前窗口内暂无可观测性数据。" title="暂无观测数据" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <div className="rounded-md border bg-muted/20 px-3 py-3" key={metric.label}>
              <div className="text-xs text-muted-foreground">{metric.label}</div>
              <div className="mt-2 text-xl font-semibold">{metric.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{metric.helper}</div>
            </div>
          ))}
        </div>
      )}

      {overview?.recent_error_traces.length ? (
        <div className="grid gap-2 rounded-md border bg-background/70 p-3">
          <div className="text-xs font-medium text-muted-foreground">最近错误链路</div>
          <div className="flex gap-2 overflow-x-auto">
            {overview.recent_error_traces.slice(0, 4).map((trace) => (
              <button
                className="min-w-56 rounded-md border bg-muted/20 px-3 py-2 text-left text-xs transition-colors hover:bg-muted/40"
                key={trace.trace_id}
                onClick={() => onSelectTrace(trace.trace_id)}
                type="button"
              >
                <div className="font-medium text-foreground">{trace.title}</div>
                <div className="mt-1 font-mono text-muted-foreground">{shortTraceId(trace.trace_id)}</div>
                <div className="mt-1 text-muted-foreground">{trace.failed_count} 个异常事件</div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function RunStepBreakdownCard({
  items,
  loading,
}: {
  items: MonitorRunStepMetricItem[];
  loading: boolean;
}) {
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
                  <StatusBadge tone={item.failed_count > 0 ? 'degraded' : 'healthy'}>
                    {monitorStepTypeLabel(item.step_type)}
                  </StatusBadge>
                  <span className="text-sm font-medium">{formatInteger(item.step_count)} 次</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  失败 {formatInteger(item.failed_count)} · P95 {formatLatency(item.p95_latency_ms)}
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary/45"
                  style={{ width: `${Math.max(8, (item.step_count / maxCount) * 100)}%` }}
                />
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

function TrendCard({
  loading,
  points,
}: {
  loading: boolean;
  points: MonitorTrendPoint[];
}) {
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
                <div
                  className="w-full rounded-t-md bg-primary/25"
                  style={{ height: `${Math.max(12, Math.min(100, point.average_latency_ms / 4))}%` }}
                />
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

function ErrorCard({
  errors,
  loading,
}: {
  errors: MonitorErrorSampleItem[];
  loading: boolean;
}) {
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
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TraceDetailPanel({
  loading,
  trace,
  traceId,
}: {
  loading: boolean;
  trace: MonitorTraceDetail | null;
  traceId: string | null;
}) {
  if (loading) {
    return (
      <Card className="grid gap-4 p-5">
        <div className="text-sm text-muted-foreground">正在加载 Trace 链路...</div>
      </Card>
    );
  }

  if (!traceId) {
    return (
      <Card className="grid gap-4 p-5">
        <EmptyState description="选择一条带 Trace ID 的事件后，在这里查看完整链路。" title="未选择 Trace" />
      </Card>
    );
  }

  if (!trace) {
    return (
      <Card className="grid gap-4 p-5">
        <EmptyState description="当前窗口没有找到该 Trace 的关联事件。" title="暂无链路详情" />
      </Card>
    );
  }

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={trace.metrics.failed_count > 0 ? 'degraded' : 'healthy'}>
              {trace.metrics.failed_count > 0 ? '存在异常' : '链路正常'}
            </StatusBadge>
            <StatusBadge tone={trace.propagation.quality_score >= 80 ? 'healthy' : 'degraded'}>
              传播质量 {trace.propagation.quality_score}%
            </StatusBadge>
          </div>
          <h2 className="mt-3 text-base font-semibold">Trace 链路详情</h2>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{trace.trace_id}</p>
        </div>
        <Button onClick={() => void navigator.clipboard?.writeText(trace.trace_id)} size="sm" type="button" variant="outline">
          <Copy className="size-4" />
          复制
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <DetailRow label="事件数量" value={formatInteger(trace.metrics.event_count)} />
        <DetailRow label="总延迟" value={formatLatency(trace.metrics.total_latency_ms)} />
        <DetailRow label="P95 延迟" value={formatLatency(trace.metrics.p95_latency_ms)} />
        <DetailRow label="模块数量" value={formatInteger(trace.metrics.module_count)} />
        <DetailRow label="总词元" value={formatInteger(trace.metrics.total_tokens)} />
        <DetailRow label="总成本" value={formatMoney(trace.metrics.total_cost)} />
      </div>

      <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
        <PropagationItem label="标准 Trace" value={trace.propagation.has_trace_id ? '已识别' : '缺失'} />
        <PropagationItem label="Span 数量" value={formatInteger(trace.propagation.span_count)} />
        <PropagationItem label="孤儿 Span" value={formatInteger(trace.propagation.orphan_span_count)} />
        <PropagationItem label="缺失 Span" value={formatInteger(trace.propagation.missing_span_count)} />
        <PropagationItem label="根 Span" value={formatInteger(trace.propagation.root_span_count)} />
        <PropagationItem label="父子关系" value={trace.propagation.has_span_links ? '已连接' : '不完整'} />
      </div>

      {trace.errors.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          当前链路包含 {trace.errors.length} 条错误样本，优先检查时间线中的失败节点。
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="text-sm font-semibold">链路时间线</div>
        <div className="relative grid gap-3">
          {trace.timeline.map((item, index) => (
            <div className="relative grid gap-2 rounded-md border bg-background px-3 py-3 shadow-sm" key={item.event_id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={monitorStatusTone(item.status)}>{monitorStatusLabel(item.status)}</StatusBadge>
                  <StatusBadge tone="planned">{monitorModuleLabel(item.module)}</StatusBadge>
                  <span className="text-sm font-medium">{index + 1}. {item.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatLatency(item.duration_ms)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.summary}</p>
              <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                <span>{monitorSourceTypeLabel(item.source_type)}</span>
                <span>{monitorStepTypeLabel(item.step_type)}</span>
                <span>{formatDateTime(item.started_at)}</span>
                <span className="font-mono">span {item.span_id ? shortTraceId(item.span_id) : '-'}</span>
                <span className="font-mono">parent {item.parent_span_id ? shortTraceId(item.parent_span_id) : '-'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function PropagationItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function TraceSignalCards({
  loading,
  overview,
  onSelectTrace,
}: {
  loading: boolean;
  overview: MonitorObservabilityOverview | null;
  onSelectTrace: (traceId: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <TraceSummaryList
        emptyTitle="暂无慢链路"
        items={overview?.slow_traces ?? []}
        loading={loading}
        title="慢 Trace"
        onSelectTrace={onSelectTrace}
      />
      <TraceSummaryList
        emptyTitle="暂无错误链路"
        items={overview?.recent_error_traces ?? []}
        loading={loading}
        title="错误 Trace"
        onSelectTrace={onSelectTrace}
      />
      <Card className="grid gap-4 p-5">
        <h2 className="text-sm font-semibold">错误模块</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">正在计算错误模块...</div>
        ) : !overview || overview.top_error_modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无错误模块。</p>
        ) : (
          <div className="grid gap-2">
            {overview.top_error_modules.map((item) => (
              <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-sm" key={item.module}>
                <div>
                  <div className="font-medium">{monitorModuleLabel(item.module)}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(item.latest_error_at)}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{item.error_count} 次错误</div>
                  <div>{item.trace_count} 条链路</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function TraceSummaryList({
  emptyTitle,
  items,
  loading,
  title,
  onSelectTrace,
}: {
  emptyTitle: string;
  items: MonitorTraceSummaryItem[];
  loading: boolean;
  title: string;
  onSelectTrace: (traceId: string) => void;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载链路...</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyTitle}。</p>
      ) : (
        <div className="grid gap-3">
          {items.map((trace) => (
            <button
              className="rounded-md border bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/40"
              key={`${title}-${trace.trace_id}`}
              onClick={() => onSelectTrace(trace.trace_id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{trace.title}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{shortTraceId(trace.trace_id)}</div>
                </div>
                <StatusBadge tone={trace.failed_count > 0 ? 'degraded' : 'healthy'}>
                  {monitorModuleLabel(trace.module)}
                </StatusBadge>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                <span>{trace.event_count} 事件</span>
                <span>{trace.failed_count} 异常</span>
                <span>{formatLatency(trace.p95_latency_ms)}</span>
              </div>
            </button>
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

function EventDetailPanel({
  event,
  loading,
}: {
  event: MonitorEventDetail | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="grid gap-4 p-5">
        <div className="text-sm text-muted-foreground">正在加载事件详情...</div>
      </Card>
    );
  }

  if (!event) {
    return (
      <Card className="grid gap-4 p-5">
        <EmptyState description="选择一条事件后，在这里查看请求、响应和错误细节。" title="未选择事件" />
      </Card>
    );
  }

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={monitorStatusTone(event.status)}>{monitorStatusLabel(event.status)}</StatusBadge>
          <StatusBadge tone="planned">{monitorModuleLabel(event.module)}</StatusBadge>
          <StatusBadge tone="ready">{monitorSourceTypeLabel(event.source_type)}</StatusBadge>
          {event.step_type ? (
            <StatusBadge tone="healthy">{monitorStepTypeLabel(event.step_type)}</StatusBadge>
          ) : null}
        </div>
        <h2 className="mt-3 text-base font-semibold">{event.title}</h2>
        <p className="mt-1 text-xs font-mono text-muted-foreground">{event.trace_id}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.summary}</p>
      </div>

      <div className="grid gap-3 text-sm">
        <DetailRow label="发生时间" value={formatDateTime(event.occurred_at)} />
        <DetailRow label="事件来源" value={monitorSourceTypeLabel(event.source_type)} />
        <DetailRow label="步骤类型" value={monitorStepTypeLabel(event.step_type)} />
        <DetailRow label="延迟" value={formatLatency(event.latency_ms)} />
        <DetailRow label="词元" value={event.token_total?.toString() ?? '-'} />
        <DetailRow label="成本" value={formatMoney(event.cost_total)} />
      </div>

      {event.error_message ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {event.error_message}
        </div>
      ) : null}

      <JsonCard title="请求载荷" value={event.request_payload} />
      <JsonCard title="响应载荷" value={event.response_payload} />
      <JsonCard title="步骤 / 附加信息" value={event.step_payload} />
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

function JsonCard({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-md border bg-slate-950 p-3">
      <div className="mb-2 text-xs font-medium text-slate-300">{title}</div>
      <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </div>
  );
}

function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

function shortTraceId(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
