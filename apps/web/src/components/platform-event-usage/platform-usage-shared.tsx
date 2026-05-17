'use client';

import type {
  PlatformEventDetail,
  PlatformEventListItem,
  PlatformEventUsageOverview,
  PlatformEventWindow,
  PlatformUsageAlertAction,
  PlatformUsageAlertItem,
  PlatformUsageAlertNotificationItem,
  PlatformUsageAlertNotificationStatus,
  PlatformUsageAlertNotificationTaskOverview,
  PlatformUsageAlertNotificationTaskRunResult,
  PlatformUsageAnomalyItem,
  PlatformUsageAnomalyOverview,
  PlatformUsageAnomalySeverity,
  PlatformUsageAnomalyType,
  PlatformUsageLedgerItem,
  PlatformUsageTrendPoint,
} from '@aiaget/shared-types';
import { Activity, AlertTriangle, BellRing, Coins, ExternalLink, GitBranch, RefreshCw, Route, Search, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { formatDateTime, formatMoney } from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

export const platformUsageWindows: PlatformEventWindow[] = ['24h', '7d', '30d'];

export const platformUsageSubnavItems = [
  { href: '/monitor/platform-usage', label: '事件总览' },
  { href: '/monitor/platform-usage/events', label: '平台事件' },
  { href: '/monitor/platform-usage/ledger', label: '用量账本' },
  { href: '/monitor/platform-usage/trends', label: '用量趋势' },
  { href: '/monitor/platform-usage/alerts', label: '用量告警' },
  { href: '/monitor/platform-usage/notifications', label: '通知审计' },
  { href: '/monitor/platform-usage/tasks', label: '重试任务' },
];

export function parsePlatformUsageWindow(value: string | null): PlatformEventWindow {
  return platformUsageWindows.includes(value as PlatformEventWindow) ? (value as PlatformEventWindow) : '24h';
}

export function PlatformUsageHeader({
  badge,
  children,
  refreshing,
  title,
  onRefresh,
}: {
  badge: string;
  children?: ReactNode;
  description?: string;
  refreshing: boolean;
  title: string;
  onRefresh: () => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">{badge}</StatusBadge>
            <StatusBadge tone="healthy">平台事件</StatusBadge>
            <StatusBadge tone="planned">用量</StatusBadge>
          </div>
          <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
        </div>
        <Button disabled={refreshing} onClick={onRefresh} type="button" variant="outline">
          <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
          刷新数据
        </Button>
      </div>
      <nav className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {platformUsageSubnavItems.map((item) => (
          <Link
            className="rounded-md border bg-background/80 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
            href={item.href}
            key={item.href}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">{item.label}</div>
              <ExternalLink className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </nav>
      {children}
    </section>
  );
}

export function PlatformUsageSummaryCards({
  loading,
  overview,
  windowValue,
}: {
  loading: boolean;
  overview: PlatformEventUsageOverview | null;
  windowValue: PlatformEventWindow;
}) {
  const summary = overview?.summary;
  const metrics = summary
    ? [
        { label: '平台事件', value: `${summary.event_count}`, helper: `${windowValue} 窗口` },
        { label: '用量事件', value: `${summary.usage_count}`, helper: '统一用量账本' },
        { label: '关系链路', value: `${summary.relation_count}`, helper: '父子 / 审批 / 用量' },
        { label: '汇总批次', value: `${summary.rollup_count}`, helper: '小时 / 天聚合' },
        { label: 'Trace 数', value: `${summary.trace_count}`, helper: '链路覆盖' },
        { label: '总成本', value: formatMoney(summary.total_cost), helper: '账本汇总' },
      ]
    : [];

  return loading ? (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="h-24 rounded-md border bg-muted/30" key={index} />
      ))}
    </div>
  ) : (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <PlatformUsageMetricTile helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </section>
  );
}

export function PlatformUsageFilters({
  eventType,
  eventTypeOptions,
  keyword,
  metricType,
  metricTypeOptions,
  onClear,
  onEventTypeChange,
  onKeywordChange,
  onMetricTypeChange,
  onRequestIdChange,
  onResourceTypeChange,
  onSourceSystemChange,
  onTraceIdChange,
  onWindowChange,
  requestId,
  resourceType,
  resourceTypeOptions,
  sourceOptions,
  sourceSystem,
  traceId,
  windowValue,
}: {
  eventType: string;
  eventTypeOptions: string[];
  keyword: string;
  metricType: string;
  metricTypeOptions: string[];
  onClear: () => void;
  onEventTypeChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onMetricTypeChange: (value: string) => void;
  onRequestIdChange: (value: string) => void;
  onResourceTypeChange: (value: string) => void;
  onSourceSystemChange: (value: string) => void;
  onTraceIdChange: (value: string) => void;
  onWindowChange: (value: PlatformEventWindow) => void;
  requestId: string;
  resourceType: string;
  resourceTypeOptions: string[];
  sourceOptions: string[];
  sourceSystem: string;
  traceId: string;
  windowValue: PlatformEventWindow;
}) {
  return (
    <Card className="grid gap-3 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Search className="size-4 text-primary" />
        事件筛选
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[100px_1fr_1fr_1fr_1fr]">
        <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onWindowChange(event.target.value as PlatformEventWindow)} value={windowValue}>
          {platformUsageWindows.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <FilterSelect label="全部来源" onChange={onSourceSystemChange} options={sourceOptions} value={sourceSystem} />
        <FilterSelect label="全部事件" onChange={onEventTypeChange} options={eventTypeOptions} value={eventType} />
        <FilterSelect label="全部资源" onChange={onResourceTypeChange} options={resourceTypeOptions} value={resourceType} />
        <FilterSelect label="全部指标" onChange={onMetricTypeChange} options={metricTypeOptions} value={metricType} />
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_auto]">
        <input className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => onTraceIdChange(event.target.value)} placeholder="Trace ID" value={traceId} />
        <input className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => onRequestIdChange(event.target.value)} placeholder="Request ID" value={requestId} />
        <input className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => onKeywordChange(event.target.value)} placeholder="搜索事件、资源、来源" value={keyword} />
        <Button onClick={onClear} type="button" variant="outline">清空</Button>
      </div>
    </Card>
  );
}

function FilterSelect({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

export function UsageTrendCard({ loading, points }: { loading: boolean; points: PlatformUsageTrendPoint[] }) {
  const maxCost = Math.max(...points.map((point) => point.cost_total), 0.000001);

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><Activity className="size-4 text-primary" />用量趋势</div>
        <span className="text-xs text-muted-foreground">{points.length} 个时间桶</span>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载用量趋势...</div>
      ) : points.length === 0 ? (
        <EmptyState title="暂无趋势数据" />
      ) : (
        <div className="grid gap-4">
          <div className="flex h-48 items-end gap-2">
            {points.map((point) => (
              <div className="flex min-w-0 flex-1 flex-col justify-end gap-2" key={`${point.bucket}-${point.metric_type}`}>
                <div className="rounded-t-md bg-primary/40" style={{ height: `${Math.max(8, (point.cost_total / maxCost) * 160)}px` }} title={formatMoney(point.cost_total)} />
                <div className="truncate text-center text-[11px] text-muted-foreground">{point.bucket}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {points.slice(-3).map((point) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2" key={`${point.bucket}-${point.metric_type}-summary`}>
                <div className="text-xs text-muted-foreground">{point.metric_type}</div>
                <div className="mt-1 text-sm font-medium">{formatMoney(point.cost_total)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{point.event_count} 条 · {point.bucket}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function RollupCard({ loading, items }: { loading: boolean; items: PlatformEventUsageOverview['recent_rollups'] }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><GitBranch className="size-4 text-primary" />Rollup 汇总</div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载汇总批次...</div>
      ) : items.length === 0 ? (
        <EmptyState title="暂无汇总" />
      ) : (
        <div className="grid gap-3">
          {items.slice(0, 4).map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><div className="text-sm font-medium">{item.metric_type}</div><div className="text-xs text-muted-foreground">{item.period_type} · {item.period_start}</div></div>
                <StatusBadge tone={item.error_count > 0 ? 'degraded' : 'healthy'}>{item.event_count} 条</StatusBadge>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <span>数量 {item.quantity_total}</span><span>金额 {formatMoney(item.amount_total)}</span><span>成本 {formatMoney(item.cost_total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function PlatformEventTable({ loading, items, total }: { loading: boolean; items: PlatformEventListItem[]; total: number }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><Route className="size-4 text-primary" />平台事件</div>
        <span className="text-xs text-muted-foreground">显示 {items.length} / {total}</span>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载平台事件...</div>
      ) : items.length === 0 ? (
        <EmptyState title="暂无事件" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['时间', '事件类型', '资源', '状态', '摘要', '链路', '操作'].map((column) => <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b transition-colors last:border-0 hover:bg-muted/25" key={item.id}>
                  <td className="px-3 py-2 text-muted-foreground">{formatDateTime(item.occurred_at)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.event_type}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.resource_type}{item.resource_id ? ` / ${item.resource_id}` : ''}</td>
                  <td className="px-3 py-2"><StatusBadge tone={eventTone(item.status)}>{item.status}</StatusBadge></td>
                  <td className="px-3 py-2"><div className="font-medium">{item.summary ?? '-'}</div><div className="mt-1 text-xs text-muted-foreground">用量 {item.linked_usage_count} 条 · {formatMoney(item.linked_amount_total)}</div></td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{shortId(item.trace_id ?? item.request_id ?? item.id)}</td>
                  <td className="px-3 py-2"><Button asChild size="sm" type="button" variant="outline"><Link href={`/monitor/platform-usage/events/${item.id}`}>详情</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function PlatformEventDetailPanel({ detail, loading }: { detail: PlatformEventDetail | null; loading: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><Route className="size-4 text-primary" />事件详情</div>
        {detail ? <StatusBadge tone={eventTone(detail.status)}>{detail.status}</StatusBadge> : null}
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载事件详情...</div>
      ) : !detail ? (
        <EmptyState title="未找到事件" />
      ) : (
        <div className="grid gap-4">
          <DetailGrid items={[
            { label: '事件类型', value: detail.event_type },
            { label: '来源系统', value: detail.source_system ?? '无' },
            { label: '资源', value: `${detail.resource_type}${detail.resource_id ? ` / ${detail.resource_id}` : ''}` },
            { label: '安全级别', value: detail.security_level },
            { label: 'Trace ID', value: detail.trace_id ?? '无' },
            { label: 'Request ID', value: detail.request_id ?? '无' },
            { label: '发生时间', value: formatDateTime(detail.occurred_at) },
            { label: '用量数量', value: `${detail.linked_usage_count} 条` },
          ]} />
          <div className="flex flex-wrap gap-2">
            {detail.trace_id ? <Button asChild type="button" variant="outline"><Link href={`/monitor/traces/${detail.trace_id}`}>查看 Trace</Link></Button> : null}
            <Button asChild type="button" variant="outline"><Link href={`/monitor/platform-usage?event_type=${encodeURIComponent(detail.event_type)}`}>同类事件</Link></Button>
          </div>
          {detail.summary ? <div className="rounded-md border bg-slate-50/70 p-3 text-sm leading-6 text-muted-foreground">{detail.summary}</div> : null}
          <UsageLedgerList items={detail.usage_events} loading={false} title="关联用量" />
          <RelationList items={detail.relations} loading={false} />
          <JsonPreview title="Payload JSON" value={detail.payload_json} />
        </div>
      )}
    </Card>
  );
}

export function UsageLedgerList({ items, loading, title = '用量账本' }: { items: PlatformUsageLedgerItem[]; loading: boolean; title?: string }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="size-4 text-amber-600" />{title}</div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载用量账本...</div>
      ) : items.length === 0 ? (
        <EmptyState title="暂无用量" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-3" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><div className="text-sm font-medium">{item.metric_type}</div><div className="text-xs text-muted-foreground">{item.resource_type}{item.resource_id ? ` / ${item.resource_id}` : ''}</div></div>
                <div className="text-right text-sm font-semibold">{formatMoney(item.amount)}</div>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <span>数量 {item.quantity}</span><span>单位 {item.unit}</span><span>{formatDateTime(item.occurred_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function RelationList({ loading, items }: { loading: boolean; items: PlatformEventUsageOverview['recent_relations'] }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><GitBranch className="size-4 text-primary" />事件关系</div>
      {loading ? <div className="text-sm text-muted-foreground">正在加载事件关系...</div> : items.length === 0 ? (
        <EmptyState title="暂无关系" />
      ) : (
        <div className="grid gap-3">
          {items.slice(0, 8).map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
              <div className="flex items-center justify-between gap-2"><div className="text-sm font-medium">{item.relation_type}</div><span className="text-xs text-muted-foreground">{formatDateTime(item.occurred_at)}</span></div>
              <div className="mt-1 text-xs text-muted-foreground">父 {shortId(item.parent_event_id)} · 子 {shortId(item.child_event_id)}</div>
              <div className="mt-1 text-xs text-muted-foreground">源 {shortId(item.source_event_id)} · 目标 {shortId(item.target_event_id)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function UsageAnomalyCard({ detecting, overview }: { detecting: boolean; overview: PlatformUsageAnomalyOverview | null }) {
  const summary = overview?.summary;

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-amber-600" />用量异常信号</div>
        <StatusBadge tone={usageAnomalySummaryTone(summary?.highest_severity ?? null)}>{detecting ? '检测中' : summary ? usageAnomalySeverityLabel(summary.highest_severity) : '未检测'}</StatusBadge>
      </div>
      {detecting ? <div className="text-sm text-muted-foreground">正在检测用量异常...</div> : !overview ? (
        <EmptyState title="尚未检测" />
      ) : overview.items.length === 0 ? (
        <EmptyState title="暂无异常信号" />
      ) : (
        <div className="grid gap-3">
          {overview.items.slice(0, 8).map((item) => <AnomalyRow item={item} key={item.id} />)}
        </div>
      )}
    </Card>
  );
}

function AnomalyRow({ item }: { item: PlatformUsageAnomalyItem }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-3">
      <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={usageAnomalySeverityTone(item.severity)}>{usageAnomalySeverityLabel(item.severity)}</StatusBadge><StatusBadge tone="planned">{usageAnomalyTypeLabel(item.anomaly_type)}</StatusBadge><span className="text-sm font-medium">{item.metric_type}</span></div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
        </div>
        <div className="text-xs text-muted-foreground">{formatDateTime(item.detected_at)}</div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-5"><span>资源 {item.resource_type}{item.resource_id ? ` / ${item.resource_id}` : ''}</span><span>当前 {formatAnomalyValue(item)}</span><span>基线 {formatAnomalyBaseline(item)}</span><span>倍率 {item.ratio}</span><span>错误 {item.error_count} · 重试 {item.retry_count}</span></div>
    </div>
  );
}

export function UsageAlertList({
  items,
  loading,
  notifying,
  onAction,
  onNotify,
  pendingAction,
  pendingAlertId,
  pendingNotifyAlertId,
  updating,
}: {
  items: PlatformUsageAlertItem[];
  loading: boolean;
  notifying: boolean;
  onAction: (alert: PlatformUsageAlertItem, action: PlatformUsageAlertAction) => void;
  onNotify: (alert: PlatformUsageAlertItem) => void;
  pendingAction: PlatformUsageAlertAction | null;
  pendingAlertId: string | null;
  pendingNotifyAlertId: string | null;
  updating: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><BellRing className="size-4 text-primary" />告警生命周期</div>
      {loading ? <div className="text-sm text-muted-foreground">正在加载告警队列...</div> : items.length === 0 ? <EmptyState title="暂无用量告警" /> : (
        <div className="grid gap-3">
          {items.slice(0, 10).map((alert) => (
            <div className="rounded-md border bg-muted/20 px-3 py-3" key={alert.alert_id}>
              <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={usageAlertStatusTone(alert.status)}>{usageAlertStatusLabel(alert.status)}</StatusBadge><StatusBadge tone={usageAnomalySeverityTone(alert.severity)}>{usageAnomalySeverityLabel(alert.severity)}</StatusBadge><span className="text-sm font-medium">{alert.title}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{alert.summary}</p><div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>异常 {alert.anomaly_count} 条</span><span>创建 {formatDateTime(alert.created_at)}</span><span>更新 {formatDateTime(alert.updated_at)}</span></div></div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" type="button" variant="outline"><Link href={`/monitor/platform-usage/events/${alert.source_event_id}`}>查看事件</Link></Button>
                  <Button disabled={notifying && pendingNotifyAlertId === alert.alert_id || alert.status === 'CLOSED'} onClick={() => onNotify(alert)} size="sm" type="button" variant="outline">{notifying && pendingNotifyAlertId === alert.alert_id ? '通知中' : '通知'}</Button>
                  {(['ACKNOWLEDGE', 'ESCALATE', 'CLOSE'] as PlatformUsageAlertAction[]).map((action) => (
                    <Button disabled={updating && pendingAlertId === alert.alert_id && pendingAction === action || !canRunUsageAlertAction(alert, action)} key={action} onClick={() => onAction(alert, action)} size="sm" type="button" variant="outline">{updating && pendingAlertId === alert.alert_id && pendingAction === action ? '处理中' : usageAlertActionLabel(action)}</Button>
                  ))}
                </div>
              </div>
              {alert.last_note ? <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-xs text-muted-foreground">最近备注：{alert.last_note}</div> : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function UsageNotificationList({
  items,
  loading,
  onRetry,
  pendingNotificationEventId,
  retrying,
}: {
  items: PlatformUsageAlertNotificationItem[];
  loading: boolean;
  onRetry: (notification: PlatformUsageAlertNotificationItem) => void;
  pendingNotificationEventId: string | null;
  retrying: boolean;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><BellRing className="size-4 text-primary" />通知投递审计</div>
      {loading ? <div className="text-sm text-muted-foreground">正在加载通知投递记录...</div> : items.length === 0 ? <EmptyState title="暂无投递记录" /> : (
        <div className="grid gap-3">
          {items.slice(0, 12).map((item) => {
            const pending = retrying && pendingNotificationEventId === item.notification_event_id;
            const retryable = item.status === 'FAILED' || item.status === 'PARTIAL';
            return (
              <div className="rounded-md border bg-muted/20 px-3 py-3" key={item.notification_event_id}>
                <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={notificationStatusTone(item.status)}>{notificationStatusLabel(item.status)}</StatusBadge>{item.channels.map((channel) => <StatusBadge key={channel} tone="planned">{notificationChannelLabel(channel)}</StatusBadge>)}<span className="font-mono text-xs text-muted-foreground">{shortId(item.notification_event_id)}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p><div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>告警 {shortId(item.alert_id)}</span><span>Webhook {item.webhook_status ?? '无'}</span><span>重试 {item.retry_count} 次</span><span>投递 {formatDateTime(item.delivered_at)}</span></div>{item.webhook_error ? <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">Webhook 错误：{item.webhook_error}</div> : null}</div>
                  <div className="flex flex-wrap gap-2"><Button asChild size="sm" type="button" variant="outline"><Link href={`/monitor/platform-usage/events/${item.notification_event_id}`}>查看事件</Link></Button><Button disabled={!retryable || pending} onClick={() => onRetry(item)} size="sm" type="button" variant="outline">{pending ? '重试中' : '重试'}</Button></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function UsageTaskOverviewCard({ loading, overview, running, onRunAutoRetry }: { loading: boolean; overview: PlatformUsageAlertNotificationTaskOverview | null; running: boolean; onRunAutoRetry: () => void }) {
  const summary = overview?.summary;
  const policy = overview?.policy;
  const result = overview?.last_auto_retry_result ?? null;

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div><div className="flex flex-wrap items-center gap-2"><StatusBadge tone="ready">自动重试</StatusBadge><StatusBadge tone={overview?.scheduler_enabled ? 'healthy' : 'planned'}>{overview?.scheduler_enabled ? '任务已启用' : '任务未启用'}</StatusBadge><StatusBadge tone={policy?.source === 'SYSTEM_SETTING' ? 'healthy' : 'planned'}>{policy?.source === 'SYSTEM_SETTING' ? '租户策略' : '环境变量'}</StatusBadge></div><h2 className="mt-3 text-base font-semibold">告警通知自动重试</h2></div>
        <Button disabled={loading || running} onClick={onRunAutoRetry} type="button" variant="outline"><RefreshCw className={cn('size-4', running && 'animate-spin')} />{running ? '扫描中' : '立即扫描重试'}</Button>
      </div>
      {loading ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div className="h-24 rounded-md border bg-muted/30" key={index} />)}</div> : (
        <div className="grid gap-4">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <PlatformUsageMetricTile helper="满足退避与次数限制" label="待自动重试" value={`${summary?.pending_auto_retry_count ?? 0}`} />
            <PlatformUsageMetricTile helper="最近窗口内失败" label="失败投递" value={`${summary?.failed_notification_count ?? 0}`} />
            <PlatformUsageMetricTile helper="站内成功或外部失败" label="部分成功" value={`${summary?.partial_notification_count ?? 0}`} />
            <PlatformUsageMetricTile helper="已有重试链路" label="已重试" value={`${summary?.retried_notification_count ?? 0}`} />
          </section>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]"><Card className="border-slate-200/80 p-4"><div className="mb-3 text-sm font-semibold">调度状态</div><DetailGrid items={[{ label: '任务开关', value: overview?.scheduler_enabled ? '已启用' : '未启用' }, { label: '运行状态', value: overview?.running || running ? '执行中' : '空闲' }, { label: '最近扫描', value: formatDateTime(overview?.last_tick_at ?? '') }, { label: '扫描间隔', value: overview?.next_tick_after_seconds ? `${overview.next_tick_after_seconds} 秒` : '未配置' }]} /></Card><Card className="border-slate-200/80 p-4"><div className="mb-3 text-sm font-semibold">当前策略</div><DetailGrid items={[{ label: '单批数量', value: `${policy?.retry_batch_size ?? 0}` }, { label: '最大重试', value: `${policy?.max_retry_count ?? 0} 次` }, { label: '退避时间', value: `${policy?.retry_backoff_seconds ?? 0} 秒` }, { label: '回看窗口', value: `${policy?.lookback_hours ?? 0} 小时` }]} /></Card></div>
          <TaskResultCard result={result} />
        </div>
      )}
    </Card>
  );
}

function TaskResultCard({ result }: { result: PlatformUsageAlertNotificationTaskRunResult | null }) {
  if (!result) return <EmptyState className="rounded-md border bg-slate-50/60 p-5" title="暂无执行结果" />;
  return <Card className="border-slate-200/80 p-4"><div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm font-semibold">最近执行结果</span><StatusBadge tone={taskRunTone(result.status)}>{taskRunLabel(result.status)}</StatusBadge></div><DetailGrid items={[{ label: '扫描', value: `${result.scanned_count}` }, { label: '重试', value: `${result.retried_count}` }, { label: '成功', value: `${result.success_count}` }, { label: '失败', value: `${result.failed_count}` }, { label: '跳过', value: `${result.skipped_count}` }, { label: '完成时间', value: formatDateTime(result.finished_at) }]} />{result.error_message ? <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{result.error_message}</div> : null}</Card>;
}

export function DetailGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return <div className="grid gap-2 text-sm md:grid-cols-2">{items.map((item) => <div className="grid gap-1 rounded-md border bg-white/70 p-3" key={item.label}><span className="text-xs text-muted-foreground">{item.label}</span><span className="break-words font-medium">{item.value}</span></div>)}</div>;
}

export function PlatformUsageMetricTile({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-none">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-normal">{value}</div>
      <div className="mt-2 text-xs text-muted-foreground">{helper}</div>
    </Card>
  );
}

export function JsonPreview({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  return <div className="grid gap-2"><div className="text-sm font-semibold">{title}</div><pre className="max-h-72 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">{stringifyPayload(value)}</pre></div>;
}

export function Notice({ message, tone }: { message: string | null; tone: 'success' | 'error' }) {
  if (!message) return null;
  return <div className={cn('rounded-md border px-3 py-2 text-sm', tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-destructive/40 bg-destructive/5 text-destructive')}>{message}</div>;
}

export function PlatformUsageConfirmDialog({
  body,
  confirmLabel = '确认',
  pending,
  title,
  onCancel,
  onConfirm,
}: {
  body: string;
  confirmLabel?: string;
  pending: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button disabled={pending} onClick={onCancel} type="button" variant="outline">取消</Button>
          <Button disabled={pending} onClick={onConfirm} type="button" variant="destructive">{pending ? '处理中' : confirmLabel}</Button>
        </div>
      </div>
    </section>
  );
}

export function eventTone(status: string) {
  if (['FAILED', 'REJECTED', 'DENIED', 'CANCELLED'].includes(status)) return 'unavailable';
  if (['PENDING', 'WAITING_HUMAN'].includes(status)) return 'degraded';
  return 'healthy';
}

export function usageAnomalySeverityTone(severity: PlatformUsageAnomalySeverity) {
  if (severity === 'CRITICAL' || severity === 'ERROR') return 'unavailable';
  if (severity === 'WARN') return 'degraded';
  return 'healthy';
}

function usageAnomalySummaryTone(severity: PlatformUsageAnomalySeverity | null) {
  if (!severity) return 'planned';
  return usageAnomalySeverityTone(severity);
}

export function usageAnomalySeverityLabel(severity: PlatformUsageAnomalySeverity | null) {
  if (!severity) return '无异常';
  const labels: Record<PlatformUsageAnomalySeverity, string> = { INFO: '提示', WARN: '警告', ERROR: '错误', CRITICAL: '严重' };
  return labels[severity];
}

function usageAnomalyTypeLabel(type: PlatformUsageAnomalyType) {
  const labels: Record<PlatformUsageAnomalyType, string> = { COST_SPIKE: '成本突增', EVENT_SPIKE: '调用突增', ERROR_RATE: '错误率过高', RETRY_RATE: '重试率过高', NO_SUCCESS: '无成功记录' };
  return labels[type];
}

export function usageAlertStatusTone(status: PlatformUsageAlertItem['status']) {
  if (status === 'CLOSED') return 'healthy';
  if (status === 'ESCALATED') return 'unavailable';
  if (status === 'ACKNOWLEDGED') return 'degraded';
  return 'planned';
}

export function usageAlertStatusLabel(status: PlatformUsageAlertItem['status']) {
  const labels: Record<PlatformUsageAlertItem['status'], string> = { OPEN: '待处理', ACKNOWLEDGED: '已确认', ESCALATED: '已升级', CLOSED: '已关闭' };
  return labels[status];
}

function usageAlertActionLabel(action: PlatformUsageAlertAction) {
  const labels: Record<PlatformUsageAlertAction, string> = { ACKNOWLEDGE: '确认', ESCALATE: '升级', CLOSE: '关闭' };
  return labels[action];
}

function canRunUsageAlertAction(alert: PlatformUsageAlertItem, action: PlatformUsageAlertAction) {
  if (alert.status === 'CLOSED') return false;
  if (action === 'ACKNOWLEDGE') return alert.status === 'OPEN' || alert.status === 'ESCALATED';
  if (action === 'ESCALATE') return alert.status !== 'ESCALATED';
  return true;
}

export function notificationStatusTone(status: PlatformUsageAlertNotificationStatus) {
  if (status === 'FAILED') return 'unavailable';
  if (status === 'PARTIAL' || status === 'SKIPPED') return 'degraded';
  return 'healthy';
}

export function notificationStatusLabel(status: PlatformUsageAlertNotificationStatus) {
  const labels: Record<PlatformUsageAlertNotificationStatus, string> = { SENT: '已投递', PARTIAL: '部分成功', SKIPPED: '已跳过', FAILED: '失败' };
  return labels[status];
}

function notificationChannelLabel(channel: string) {
  if (channel === 'IN_APP') return '站内';
  if (channel === 'WEBHOOK') return 'Webhook';
  return channel;
}

function taskRunTone(status: PlatformUsageAlertNotificationTaskRunResult['status']) {
  if (status === 'SUCCESS') return 'healthy';
  if (status === 'FAILED') return 'unavailable';
  return 'planned';
}

function taskRunLabel(status: PlatformUsageAlertNotificationTaskRunResult['status']) {
  const labels: Record<PlatformUsageAlertNotificationTaskRunResult['status'], string> = { SUCCESS: '成功', FAILED: '失败', SKIPPED: '已跳过' };
  return labels[status];
}

function formatAnomalyValue(item: PlatformUsageAnomalyItem) {
  if (item.anomaly_type === 'ERROR_RATE' || item.anomaly_type === 'RETRY_RATE') return `${Math.round(item.current_value * 100)}%`;
  if (item.anomaly_type === 'COST_SPIKE') return formatMoney(item.current_value);
  return `${item.current_value}`;
}

function formatAnomalyBaseline(item: PlatformUsageAnomalyItem) {
  if (item.anomaly_type === 'ERROR_RATE' || item.anomaly_type === 'RETRY_RATE') return `${Math.round(item.baseline_value * 100)}%`;
  if (item.anomaly_type === 'COST_SPIKE') return formatMoney(item.baseline_value);
  return `${item.baseline_value}`;
}

export function shortId(value: string | null | undefined) {
  if (!value) return '-';
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value;
}

export function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function stringifyPayload(value: Record<string, unknown> | null) {
  if (!value) return '无 Payload';
  return JSON.stringify(value, null, 2);
}

export { Coins };
