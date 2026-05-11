'use client';

import type {
  MonitorEventDetail,
  MonitorObservabilityOverview,
  MonitorTraceDetail,
  MonitorTraceSummaryItem,
  RuntimeWorkflowStatusOverview,
  RuntimeWorkflowRecoverableTaskItem,
  RuntimeWorkflowTaskType,
} from '@aiaget/shared-types';
import { Copy, GitBranch, RotateCcw } from 'lucide-react';
import Link from 'next/link';

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
import { StatusBadge } from '@/components/ui/status-badge';

export function EventDetailPanel({ event, loading }: { event: MonitorEventDetail | null; loading: boolean }) {
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
        <EmptyState description="事件不存在，或当前账号没有查看权限。" title="未找到事件" />
      </Card>
    );
  }

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={monitorStatusTone(event.status)}>{monitorStatusLabel(event.status)}</StatusBadge>
            <StatusBadge tone="planned">{monitorModuleLabel(event.module)}</StatusBadge>
            <StatusBadge tone="ready">{monitorSourceTypeLabel(event.source_type)}</StatusBadge>
            {event.step_type ? <StatusBadge tone="healthy">{monitorStepTypeLabel(event.step_type)}</StatusBadge> : null}
          </div>
          <h2 className="mt-3 text-base font-semibold">{event.title}</h2>
          <p className="mt-1 text-xs font-mono text-muted-foreground">{event.trace_id}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.summary}</p>
        </div>
        <Button asChild size="sm" type="button" variant="outline">
          <Link href={`/monitor/traces/${event.trace_id}`}>
            <GitBranch className="size-4" />
            Trace 链路
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-3">
        <DetailRow label="发生时间" value={formatDateTime(event.occurred_at)} />
        <DetailRow label="事件来源" value={monitorSourceTypeLabel(event.source_type)} />
        <DetailRow label="步骤类型" value={monitorStepTypeLabel(event.step_type)} />
        <DetailRow label="延迟" value={formatLatency(event.latency_ms)} />
        <DetailRow label="词元" value={event.token_total?.toString() ?? '-'} />
        <DetailRow label="成本" value={formatMoney(event.cost_total)} />
      </div>

      {event.error_message ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{event.error_message}</div>
      ) : null}

      <JsonCard title="请求载荷" value={event.request_payload} />
      <JsonCard title="响应载荷" value={event.response_payload} />
      <JsonCard title="步骤 / 附加信息" value={event.step_payload} />
    </Card>
  );
}

export function TraceDetailPanel({ loading, trace, traceId }: { loading: boolean; trace: MonitorTraceDetail | null; traceId: string | null }) {
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
        <EmptyState description="打开一条带 Trace ID 的链路后，在这里查看完整时间线。" title="未选择 Trace" />
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
            <StatusBadge tone={trace.metrics.failed_count > 0 ? 'degraded' : 'healthy'}>{trace.metrics.failed_count > 0 ? '存在异常' : '链路正常'}</StatusBadge>
            <StatusBadge tone={trace.propagation.quality_score >= 80 ? 'healthy' : 'degraded'}>传播质量 {trace.propagation.quality_score}%</StatusBadge>
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
                  <Link className="text-sm font-medium text-primary hover:underline" href={`/monitor/events/${item.event_id}`}>
                    {index + 1}. {item.title}
                  </Link>
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

export function ObservabilityOverviewCard({ loading, overview }: { loading: boolean; overview: MonitorObservabilityOverview | null }) {
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
    </Card>
  );
}

export function TraceSignalCards({ loading, overview }: { loading: boolean; overview: MonitorObservabilityOverview | null }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <TraceSummaryList emptyTitle="暂无慢链路" items={overview?.slow_traces ?? []} loading={loading} title="慢 Trace" />
      <TraceSummaryList emptyTitle="暂无错误链路" items={overview?.recent_error_traces ?? []} loading={loading} title="错误 Trace" />
      <Card className="grid gap-4 p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold">错误模块</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">正在计算错误模块...</div>
        ) : !overview || overview.top_error_modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无错误模块。</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
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

export function WorkflowBackendCard({
  canRetry,
  loading,
  onRefresh,
  onRetry,
  pendingTask,
  retrying,
  workflow,
}: {
  canRetry: (task: RuntimeWorkflowRecoverableTaskItem) => boolean;
  loading: boolean;
  onRefresh: () => void;
  onRetry: (taskType: RuntimeWorkflowTaskType, taskId: string) => void;
  pendingTask: { task_type: RuntimeWorkflowTaskType; task_id: string } | null;
  retrying: boolean;
  workflow: RuntimeWorkflowStatusOverview | null;
}) {
  const latestFailure = workflow?.latest_failure ?? null;
  const tasks = workflow?.recoverable_tasks ?? [];

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GitBranch className="size-4 text-sky-600" />
            工作流后端
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge tone={workflow?.backend_status === 'DISPATCH_FAILED' ? 'unavailable' : 'healthy'}>{workflow ? workflowBackendStatusLabel(workflow.backend_status) : '待加载'}</StatusBadge>
            <StatusBadge tone="ready">{workflow ? workflowBackendLabel(workflow.workflow_backend) : '-'}</StatusBadge>
            <StatusBadge tone="planned">{workflow ? workflowModeLabel(workflow.workflow_mode) : '-'}</StatusBadge>
          </div>
        </div>
        <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
          刷新工作流
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载工作流状态...</div>
      ) : latestFailure ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
          <div className="font-medium">最近派发失败</div>
          <p className="mt-1 leading-6 text-muted-foreground">{latestFailure.error_message}</p>
          <div className="mt-1 text-xs text-muted-foreground">{latestFailure.occurred_at ? formatDateTime(latestFailure.occurred_at) : '-'}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {latestFailure.failure_event_id ? (
              <Button asChild size="sm" type="button" variant="outline">
                <Link href={`/monitor/events/${latestFailure.failure_event_id}`}>查看最近失败事件</Link>
              </Button>
            ) : null}
            {latestFailure.failure_trace_id ? (
              <Button asChild size="sm" type="button" variant="outline">
                <Link href={`/monitor/traces/${latestFailure.failure_trace_id}`}>查看最近失败 Trace</Link>
              </Button>
            ) : null}
            {latestFailure.failure_request_id ? (
              <Button asChild size="sm" type="button" variant="outline">
                <Link href={`/monitor?requestId=${encodeURIComponent(latestFailure.failure_request_id)}`}>查看最近失败请求</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <EmptyState description="当前没有可恢复的工作流任务。" title="暂无恢复项" />
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => {
            const pending = retrying && pendingTask?.task_id === task.task_id && pendingTask.task_type === task.task_type;

            return (
              <div className="grid gap-3 rounded-md border bg-muted/20 px-3 py-3 md:grid-cols-[1fr_auto] md:items-center" key={`${task.task_type}:${task.task_id}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-medium">{task.title}</div>
                    <StatusBadge tone="planned">{workflowTaskTypeLabel(task.task_type)}</StatusBadge>
                    <StatusBadge tone="degraded">{task.workflow_task_type}</StatusBadge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{task.error_message ?? '任务失败，等待恢复。'}</p>
                  <div className="mt-1 flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
                    <span>{task.task_id}</span>
                    <span>Workflow ID {task.workflow_id ?? '-'}</span>
                    <span>Workflow Run ID {task.workflow_run_id ?? '-'}</span>
                    {task.team_id ? <span>团队 {task.team_id}</span> : null}
                    {task.run_id ? <span>运行 {task.run_id}</span> : null}
                    {task.channel_id ? <span>渠道 {task.channel_id}</span> : null}
                    <span>{formatDateTime(task.updated_at)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.failure_event_id ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/monitor/events/${task.failure_event_id}`}>查看失败事件</Link>
                      </Button>
                    ) : null}
                    {task.failure_trace_id ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/monitor/traces/${task.failure_trace_id}`}>查看失败 Trace</Link>
                      </Button>
                    ) : null}
                    {task.failure_request_id ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/monitor?requestId=${encodeURIComponent(task.failure_request_id)}`}>查看失败请求</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
                <Button disabled={!canRetry(task) || pending} onClick={() => onRetry(task.task_type, task.task_id)} type="button" variant="outline">
                  <RotateCcw className={pending ? 'size-4 animate-spin' : 'size-4'} />
                  恢复重试
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
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
      <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-100">{JSON.stringify(value ?? null, null, 2)}</pre>
    </div>
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

function TraceSummaryList({ emptyTitle, items, loading, title }: { emptyTitle: string; items: MonitorTraceSummaryItem[]; loading: boolean; title: string }) {
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
            <Link className="rounded-md border bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40" href={`/monitor/traces/${trace.trace_id}`} key={`${title}-${trace.trace_id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{trace.title}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{shortTraceId(trace.trace_id)}</div>
                </div>
                <StatusBadge tone={trace.failed_count > 0 ? 'degraded' : 'healthy'}>{monitorModuleLabel(trace.module)}</StatusBadge>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                <span>{trace.event_count} 事件</span>
                <span>{trace.failed_count} 异常</span>
                <span>{formatLatency(trace.p95_latency_ms)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(value);
}

function workflowBackendLabel(value: RuntimeWorkflowStatusOverview['workflow_backend']) {
  if (value === 'TEMPORAL') return 'Temporal';
  if (value === 'LOCAL_FALLBACK') return '本地兜底';
  if (value === 'LOCAL') return '本地执行';
  return '未确认后端';
}

function workflowModeLabel(value: RuntimeWorkflowStatusOverview['workflow_mode']) {
  const labels: Record<RuntimeWorkflowStatusOverview['workflow_mode'], string> = {
    local: '本地模式',
    temporal_first: 'Temporal 优先',
    temporal: '仅 Temporal',
  };

  return labels[value];
}

function workflowBackendStatusLabel(value: RuntimeWorkflowStatusOverview['backend_status']) {
  return value === 'DISPATCH_FAILED' ? '派发失败' : '可用';
}

function workflowTaskTypeLabel(value: RuntimeWorkflowTaskType) {
  const labels: Record<RuntimeWorkflowTaskType, string> = {
    knowledge_task: '知识库任务',
    agent_team_run: '团队协作运行',
    channel_release_automation: '渠道自动推进',
    channel_release_self_healing: '渠道发布自愈',
    plugin_rollback: '插件回滚',
    plugin_hook_execution: '插件 Hook 执行',
  };

  return labels[value];
}

function shortTraceId(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}
