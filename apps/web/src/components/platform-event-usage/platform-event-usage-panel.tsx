'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  PlatformEventDetail,
  PlatformEventListItem,
  PlatformEventUsageOverview,
  PlatformEventWindow,
  PlatformUsageAnomalyItem,
  PlatformUsageAnomalyOverview,
  PlatformUsageAnomalySeverity,
  PlatformUsageAnomalyType,
  PlatformUsageAlertAction,
  PlatformUsageAlertItem,
  PlatformUsageAlertNotificationItem,
  PlatformUsageAlertNotificationOverview,
  PlatformUsageAlertNotificationStatus,
  PlatformUsageAlertNotificationTaskOverview,
  PlatformUsageAlertNotificationTaskRunResult,
  PlatformUsageAlertOverview,
  PlatformUsageAlertStatus,
  PlatformUsageLedgerItem,
  PlatformUsageTrendPoint,
} from '@aiaget/shared-types';
import { motion } from 'motion/react';
import { Activity, AlertTriangle, BellRing, Coins, GitBranch, RefreshCw, Route, Search, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  detectPlatformUsageAnomalies,
  getPlatformEvent,
  getPlatformUsageAlertNotificationTaskOverview,
  getPlatformUsageOverview,
  listPlatformEvents,
  listPlatformUsageAlertNotifications,
  listPlatformUsageAlerts,
  listPlatformUsageLedger,
  listPlatformUsageTrends,
  notifyPlatformUsageAlert,
  rebuildPlatformUsageRollups,
  retryPlatformUsageAlertNotification,
  runPlatformUsageAlertNotificationAutoRetry,
  updatePlatformUsageAlert,
} from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { PlatformUsageConfirmDialog } from '@/components/platform-event-usage/platform-usage-shared';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime, formatMoney } from '@/components/monitor/monitor-status';
import { cn } from '@/lib/utils';

type PlatformUsageActionTarget =
  | { type: 'detect-anomalies'; window: PlatformEventWindow }
  | { type: 'rebuild-rollups'; window: PlatformEventWindow }
  | { alertId: string; title: string; type: 'notify-alert' }
  | { action: PlatformUsageAlertAction; alertId: string; title: string; type: 'update-alert' }
  | { notificationEventId: string; type: 'retry-notification' }
  | { type: 'run-auto-retry' };

export function PlatformEventUsagePanel({
  compact = false,
  windowValue,
}: {
  compact?: boolean;
  windowValue: PlatformEventWindow;
}) {
  const [localWindow, setLocalWindow] = useState<PlatformEventWindow>(windowValue);
  const [sourceSystem, setSourceSystem] = useState('');
  const [eventType, setEventType] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [metricType, setMetricType] = useState('');
  const [traceId, setTraceId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rollupNotice, setRollupNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [anomalyOverview, setAnomalyOverview] = useState<PlatformUsageAnomalyOverview | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<PlatformUsageAlertNotificationStatus | ''>('');
  const [platformUsageActionTarget, setPlatformUsageActionTarget] = useState<PlatformUsageActionTarget | null>(null);
  const activeWindow = compact ? windowValue : localWindow;
  const period = activeWindow === '24h' ? 'hour' : 'day';
  const normalizedTraceId = traceId.trim();
  const normalizedRequestId = requestId.trim();
  const normalizedKeyword = keyword.trim();
  const overviewQuery = useQuery({
    queryKey: ['platform-usage-overview', activeWindow],
    queryFn: () => getPlatformUsageOverview({ window: activeWindow }),
  });
  const eventsQuery = useQuery({
    queryKey: ['platform-events', activeWindow, sourceSystem, eventType, resourceType, normalizedTraceId, normalizedRequestId, normalizedKeyword, compact],
    queryFn: () =>
      listPlatformEvents({
        window: activeWindow,
        page: 1,
        page_size: compact ? 8 : 12,
        source_system: sourceSystem || undefined,
        event_type: eventType || undefined,
        resource_type: resourceType || undefined,
        trace_id: normalizedTraceId || undefined,
        request_id: normalizedRequestId || undefined,
        keyword: normalizedKeyword || undefined,
      }),
  });
  const activeEventId = selectedEventId ?? eventsQuery.data?.items[0]?.id ?? null;
  const eventDetailQuery = useQuery({
    enabled: Boolean(activeEventId) && !compact,
    queryKey: ['platform-event-detail', activeEventId],
    queryFn: () => getPlatformEvent(activeEventId ?? ''),
  });
  const trendsQuery = useQuery({
    queryKey: ['platform-usage-trends', activeWindow, period, metricType, resourceType],
    queryFn: () => listPlatformUsageTrends({ window: activeWindow, period, metric_type: metricType || undefined, resource_type: resourceType || undefined }),
  });
  const ledgerQuery = useQuery({
    queryKey: [
      'platform-usage-ledger',
      activeWindow,
      compact,
      metricType,
      resourceType,
      sourceSystem,
      normalizedTraceId,
      normalizedRequestId,
      normalizedKeyword,
      activeEventId,
    ],
    queryFn: () =>
      listPlatformUsageLedger({
        window: activeWindow,
        page: 1,
        page_size: compact ? 8 : 10,
        metric_type: metricType || undefined,
        resource_type: resourceType || undefined,
        source_system: sourceSystem || undefined,
        trace_id: normalizedTraceId || undefined,
        request_id: normalizedRequestId || undefined,
        event_id: !compact && activeEventId ? activeEventId : undefined,
        keyword: normalizedKeyword || undefined,
      }),
  });
  const alertsQuery = useQuery({
    enabled: !compact,
    queryKey: ['platform-usage-alerts', activeWindow],
    queryFn: () => listPlatformUsageAlerts({ window: activeWindow }),
  });
  const alertNotificationsQuery = useQuery({
    enabled: !compact,
    queryKey: ['platform-usage-alert-notifications', activeWindow, notificationStatus],
    queryFn: () =>
      listPlatformUsageAlertNotifications({
        window: activeWindow,
        status: notificationStatus || undefined,
      }),
  });
  const alertNotificationTaskQuery = useQuery({
    enabled: !compact,
    queryKey: ['platform-usage-alert-notification-task-overview'],
    queryFn: () => getPlatformUsageAlertNotificationTaskOverview(),
  });
  const rebuildRollupsMutation = useMutation({
    mutationFn: () => rebuildPlatformUsageRollups({ window: activeWindow }),
    onMutate: () => {
      setRollupNotice(null);
    },
    onSuccess: async (result) => {
      setRollupNotice({ tone: 'success', message: `Rollup 已重建 ${result.rebuilt_count} 个汇总桶。` });
      setPlatformUsageActionTarget(null);
      await Promise.all([overviewQuery.refetch(), trendsQuery.refetch(), ledgerQuery.refetch()]);
    },
    onError: () => {
      setRollupNotice({ tone: 'error', message: 'Rollup 重建失败。' });
    },
  });
  const detectAnomaliesMutation = useMutation({
    mutationFn: () => detectPlatformUsageAnomalies({ window: activeWindow }),
    onMutate: () => {
      setRollupNotice(null);
    },
    onSuccess: async (result) => {
      setAnomalyOverview(result);
      setRollupNotice({
        tone: result.summary.anomaly_count > 0 ? 'error' : 'success',
        message: result.summary.anomaly_count > 0
          ? `检测到 ${result.summary.anomaly_count} 条用量异常信号。`
          : '用量异常检测完成，当前窗口未发现异常信号。',
      });
      setPlatformUsageActionTarget(null);
      await Promise.all([overviewQuery.refetch(), eventsQuery.refetch(), trendsQuery.refetch(), ledgerQuery.refetch()]);
    },
    onError: () => {
      setRollupNotice({ tone: 'error', message: '用量异常检测失败。' });
    },
  });
  const updateAlertMutation = useMutation({
    mutationFn: ({ action, alertId }: { action: PlatformUsageAlertAction; alertId: string }) => updatePlatformUsageAlert(alertId, { action }),
    onSuccess: async (alert, variables) => {
      setRollupNotice({ tone: 'success', message: `告警已${usageAlertActionLabel(variables.action)}。` });
      setPlatformUsageActionTarget(null);
      await Promise.all([alertsQuery.refetch(), eventsQuery.refetch(), overviewQuery.refetch()]);
      if (alert.source_event_id === selectedEventId) {
        void eventDetailQuery.refetch();
      }
    },
    onError: () => {
      setRollupNotice({ tone: 'error', message: '告警状态更新失败。' });
    },
  });
  const notifyAlertMutation = useMutation({
    mutationFn: ({ alertId }: { alertId: string }) =>
      notifyPlatformUsageAlert(alertId, { channels: ['IN_APP', 'WEBHOOK'] }),
    onSuccess: async (result) => {
      setRollupNotice({
        tone: result.status === 'FAILED' ? 'error' : 'success',
        message: result.message,
      });
      setPlatformUsageActionTarget(null);
      await Promise.all([
        alertsQuery.refetch(),
        alertNotificationsQuery.refetch(),
        eventsQuery.refetch(),
        eventDetailQuery.refetch(),
        overviewQuery.refetch(),
      ]);
    },
    onError: () => {
      setRollupNotice({ tone: 'error', message: '告警通知投递失败。' });
    },
  });
  const retryAlertNotificationMutation = useMutation({
    mutationFn: ({ notificationEventId }: { notificationEventId: string }) =>
      retryPlatformUsageAlertNotification(notificationEventId),
    onSuccess: async (result) => {
      setRollupNotice({
        tone: result.status === 'FAILED' ? 'error' : 'success',
        message: `重试完成：${result.message}`,
      });
      setPlatformUsageActionTarget(null);
      await Promise.all([
        alertNotificationsQuery.refetch(),
        alertNotificationTaskQuery.refetch(),
        alertsQuery.refetch(),
        eventsQuery.refetch(),
        eventDetailQuery.refetch(),
        overviewQuery.refetch(),
      ]);
    },
    onError: () => {
      setRollupNotice({ tone: 'error', message: '告警通知重试失败。' });
    },
  });
  const runAlertNotificationTaskMutation = useMutation({
    mutationFn: () => runPlatformUsageAlertNotificationAutoRetry(),
    onSuccess: async (result) => {
      setRollupNotice({
        tone: result.status === 'FAILED' ? 'error' : 'success',
        message: `自动重试任务完成：扫描 ${result.scanned_count} 条，重试 ${result.retried_count} 条，成功 ${result.success_count} 条，失败 ${result.failed_count} 条。`,
      });
      setPlatformUsageActionTarget(null);
      await Promise.all([
        alertNotificationTaskQuery.refetch(),
        alertNotificationsQuery.refetch(),
        alertsQuery.refetch(),
        eventsQuery.refetch(),
        overviewQuery.refetch(),
      ]);
    },
    onError: () => {
      setRollupNotice({ tone: 'error', message: '告警通知自动重试任务执行失败。' });
    },
  });

  function confirmPlatformUsageAction() {
    if (!platformUsageActionTarget) return;

    if (platformUsageActionTarget.type === 'detect-anomalies') {
      detectAnomaliesMutation.mutate();
      return;
    }

    if (platformUsageActionTarget.type === 'rebuild-rollups') {
      rebuildRollupsMutation.mutate();
      return;
    }

    if (platformUsageActionTarget.type === 'notify-alert') {
      notifyAlertMutation.mutate({ alertId: platformUsageActionTarget.alertId });
      return;
    }

    if (platformUsageActionTarget.type === 'update-alert') {
      updateAlertMutation.mutate({
        action: platformUsageActionTarget.action,
        alertId: platformUsageActionTarget.alertId,
      });
      return;
    }

    if (platformUsageActionTarget.type === 'retry-notification') {
      retryAlertNotificationMutation.mutate({
        notificationEventId: platformUsageActionTarget.notificationEventId,
      });
      return;
    }

    runAlertNotificationTaskMutation.mutate();
  }

  const platformUsageActionPending =
    detectAnomaliesMutation.isPending ||
    rebuildRollupsMutation.isPending ||
    notifyAlertMutation.isPending ||
    updateAlertMutation.isPending ||
    retryAlertNotificationMutation.isPending ||
    runAlertNotificationTaskMutation.isPending;

  const overview = overviewQuery.data;
  const summary = overview?.summary;
  const sourceOptions = useMemo(() => uniqueOptions([
    ...(overview?.recent_events.map((item) => item.source_system).filter(Boolean) as string[] | undefined ?? []),
    ...(overview?.recent_usage.map((item) => item.source_system).filter(Boolean) as string[] | undefined ?? []),
  ]), [overview]);
  const eventTypeOptions = useMemo(() => uniqueOptions(overview?.event_type_rankings.map((item) => item.event_type) ?? []), [overview]);
  const resourceTypeOptions = useMemo(() => uniqueOptions([
    ...(overview?.recent_events.map((item) => item.resource_type) ?? []),
    ...(overview?.recent_usage.map((item) => item.resource_type) ?? []),
  ]), [overview]);
  const metricTypeOptions = useMemo(() => uniqueOptions(overview?.metric_rankings.map((item) => item.metric_type) ?? []), [overview]);
  const metrics = summary
    ? [
        { label: '平台事件', value: `${summary.event_count}`, helper: `${activeWindow} 窗口` },
        { label: '用量事件', value: `${summary.usage_count}`, helper: '统一用量账本' },
        { label: '关系链路', value: `${summary.relation_count}`, helper: '父子 / 接力 / 审批' },
        { label: '汇总批次', value: `${summary.rollup_count}`, helper: '日 / 小时聚合' },
        { label: 'Trace 数', value: `${summary.trace_count}`, helper: '链路覆盖' },
        { label: '错误数', value: `${summary.error_count}`, helper: '失败与拒绝' },
      ]
    : [];

  return (
    <section className="grid gap-4">
      <Card className="grid gap-4 p-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">平台事件</StatusBadge>
              <StatusBadge tone="healthy">统一底座</StatusBadge>
              <StatusBadge tone="planned">监控 / 审计 / 成本</StatusBadge>
            </div>
            <h2 className="mt-3 text-base font-semibold">统一平台事件与用量底座</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              把平台事件、用量事件、关系链路和 rollup 汇总收敛为同一套查询入口，供监控、审计、成本与安全中心共享。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!compact ? (
              <>
                <Button
                  disabled={detectAnomaliesMutation.isPending}
                  onClick={() => setPlatformUsageActionTarget({ type: 'detect-anomalies', window: activeWindow })}
                  type="button"
                  variant="outline"
                >
                  <AlertTriangle className={cn('size-4', detectAnomaliesMutation.isPending && 'animate-pulse')} />
                  {detectAnomaliesMutation.isPending ? '正在检测' : '检测异常'}
                </Button>
                <Button
                  disabled={rebuildRollupsMutation.isPending}
                  onClick={() => setPlatformUsageActionTarget({ type: 'rebuild-rollups', window: activeWindow })}
                  type="button"
                  variant="outline"
                >
                  <GitBranch className={cn('size-4', rebuildRollupsMutation.isPending && 'animate-pulse')} />
                  {rebuildRollupsMutation.isPending ? '正在重建' : '重建 Rollup'}
                </Button>
              </>
            ) : null}
            <Button onClick={() => {
              void overviewQuery.refetch();
              void eventsQuery.refetch();
              void eventDetailQuery.refetch();
              void trendsQuery.refetch();
              void ledgerQuery.refetch();
            }} type="button" variant="outline">
              <RefreshCw className="size-4" />
              刷新
            </Button>
          </div>
        </div>

        {overviewQuery.isError || eventsQuery.isError || eventDetailQuery.isError || trendsQuery.isError || ledgerQuery.isError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            统一底座数据加载失败。
          </div>
        ) : null}

        {!compact && rollupNotice ? (
          <div
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              rollupNotice.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-destructive/40 bg-destructive/5 text-destructive',
            )}
          >
            {rollupNotice.message}
          </div>
        ) : null}

        {overviewQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="h-24 rounded-md border bg-muted/30" key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        )}

        {!compact ? (
          <PlatformEventFilters
            eventType={eventType}
            eventTypeOptions={eventTypeOptions}
            keyword={keyword}
            metricType={metricType}
            metricTypeOptions={metricTypeOptions}
            onClear={() => {
              setLocalWindow('24h');
              setSourceSystem('');
              setEventType('');
              setResourceType('');
              setMetricType('');
              setTraceId('');
              setRequestId('');
              setKeyword('');
              setSelectedEventId(null);
            }}
            requestId={requestId}
            resourceType={resourceType}
            resourceTypeOptions={resourceTypeOptions}
            setEventType={setEventType}
            setKeyword={setKeyword}
            setMetricType={setMetricType}
            setRequestId={setRequestId}
            setResourceType={setResourceType}
            setSourceSystem={setSourceSystem}
            setTraceId={setTraceId}
            setWindow={setLocalWindow}
            sourceOptions={sourceOptions}
            sourceSystem={sourceSystem}
            traceId={traceId}
            window={activeWindow}
          />
        ) : null}
      </Card>

      <section className={cn('grid gap-4', compact ? 'xl:grid-cols-[1.15fr_0.85fr]' : 'xl:grid-cols-[1.05fr_0.95fr]')}>
        <UsageTrendCard loading={trendsQuery.isLoading} points={trendsQuery.data ?? []} />
        <RollupCard loading={overviewQuery.isLoading} items={overview?.recent_rollups ?? []} />
      </section>

      {!compact ? (
        <UsageAnomalyCard
          detecting={detectAnomaliesMutation.isPending}
          overview={anomalyOverview}
        />
      ) : null}

      {!compact ? (
        <UsageAlertLifecycleCard
          loading={alertsQuery.isLoading}
          notifying={notifyAlertMutation.isPending}
          onNotify={(alert) => setPlatformUsageActionTarget({ alertId: alert.alert_id, title: alert.title, type: 'notify-alert' })}
          overview={alertsQuery.data ?? null}
          pendingAlertId={updateAlertMutation.variables?.alertId ?? null}
          pendingAction={updateAlertMutation.variables?.action ?? null}
          pendingNotifyAlertId={notifyAlertMutation.variables?.alertId ?? null}
          updating={updateAlertMutation.isPending}
          onAction={(alert, action) => setPlatformUsageActionTarget({ action, alertId: alert.alert_id, title: alert.title, type: 'update-alert' })}
          onSelectEvent={(eventId) => setSelectedEventId(eventId)}
        />
      ) : null}

      {!compact ? (
        <UsageAlertNotificationAuditCard
          loading={alertNotificationsQuery.isLoading}
          onRetry={(notificationEventId) => setPlatformUsageActionTarget({ notificationEventId, type: 'retry-notification' })}
          onSelectEvent={(eventId) => setSelectedEventId(eventId)}
          onStatusChange={setNotificationStatus}
          overview={alertNotificationsQuery.data ?? null}
          pendingNotificationEventId={retryAlertNotificationMutation.variables?.notificationEventId ?? null}
          retrying={retryAlertNotificationMutation.isPending}
          status={notificationStatus}
        />
      ) : null}

      {!compact ? (
        <UsageAlertNotificationTaskCard
          loading={alertNotificationTaskQuery.isLoading}
          onRefresh={() => void alertNotificationTaskQuery.refetch()}
          onRunAutoRetry={() => setPlatformUsageActionTarget({ type: 'run-auto-retry' })}
          overview={alertNotificationTaskQuery.data ?? null}
          running={runAlertNotificationTaskMutation.isPending}
        />
      ) : null}

      <section className={cn('grid gap-4', compact ? 'xl:grid-cols-[1.05fr_0.95fr]' : 'xl:grid-cols-[1.08fr_0.92fr]')}>
        <RecentUsageCard loading={ledgerQuery.isLoading} items={ledgerQuery.data?.items ?? []} />
        {compact ? (
          <RecentRelationCard loading={overviewQuery.isLoading} items={overview?.recent_relations ?? []} />
        ) : (
          <RecentEventCard
            activeEventId={activeEventId}
            loading={eventsQuery.isLoading}
            items={eventsQuery.data?.items ?? []}
            onSelectEvent={(eventId) => setSelectedEventId(eventId)}
            total={eventsQuery.data?.total ?? 0}
          />
        )}
      </section>

      {!compact ? (
        <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <PlatformEventDetailCard
            detail={eventDetailQuery.data ?? null}
            loading={eventDetailQuery.isLoading}
            onFilterRequest={(nextRequestId) => {
              setRequestId(nextRequestId);
              setSelectedEventId(null);
            }}
            onFilterTrace={(nextTraceId) => {
              setTraceId(nextTraceId);
              setSelectedEventId(null);
            }}
          />
          <RecentRelationCard loading={overviewQuery.isLoading} items={overview?.recent_relations ?? []} />
        </section>
      ) : null}

      {!compact ? (
        <section>
          <RecentLedgerCard items={ledgerQuery.data?.items ?? []} loading={ledgerQuery.isLoading} />
        </section>
      ) : null}

      {platformUsageActionTarget ? (
        <PlatformUsageConfirmDialog
          body={platformUsageActionConfirmBody(platformUsageActionTarget)}
          confirmLabel={platformUsageActionConfirmLabel(platformUsageActionTarget)}
          onCancel={() => setPlatformUsageActionTarget(null)}
          onConfirm={confirmPlatformUsageAction}
          pending={platformUsageActionPending}
          title={platformUsageActionConfirmTitle(platformUsageActionTarget)}
        />
      ) : null}
    </section>
  );
}

function PlatformEventFilters({
  eventType,
  eventTypeOptions,
  keyword,
  metricType,
  metricTypeOptions,
  onClear,
  requestId,
  resourceType,
  resourceTypeOptions,
  setEventType,
  setKeyword,
  setMetricType,
  setRequestId,
  setResourceType,
  setSourceSystem,
  setTraceId,
  setWindow,
  sourceOptions,
  sourceSystem,
  traceId,
  window,
}: {
  eventType: string;
  eventTypeOptions: string[];
  keyword: string;
  metricType: string;
  metricTypeOptions: string[];
  onClear: () => void;
  requestId: string;
  resourceType: string;
  resourceTypeOptions: string[];
  setEventType: (value: string) => void;
  setKeyword: (value: string) => void;
  setMetricType: (value: string) => void;
  setRequestId: (value: string) => void;
  setResourceType: (value: string) => void;
  setSourceSystem: (value: string) => void;
  setTraceId: (value: string) => void;
  setWindow: (value: PlatformEventWindow) => void;
  sourceOptions: string[];
  sourceSystem: string;
  traceId: string;
  window: PlatformEventWindow;
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-slate-50/70 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Search className="size-4 text-primary" />
        事件筛选
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[100px_1fr_1fr_1fr_1fr]">
        <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindow(event.target.value as PlatformEventWindow)} value={window}>
          <option value="24h">24h</option>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
        </select>
        <FilterSelect label="全部来源" onChange={setSourceSystem} options={sourceOptions} value={sourceSystem} />
        <FilterSelect label="全部事件" onChange={setEventType} options={eventTypeOptions} value={eventType} />
        <FilterSelect label="全部资源" onChange={setResourceType} options={resourceTypeOptions} value={resourceType} />
        <FilterSelect label="全部指标" onChange={setMetricType} options={metricTypeOptions} value={metricType} />
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_auto]">
        <input
          className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setTraceId(event.target.value)}
          placeholder="Trace ID"
          value={traceId}
        />
        <input
          className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setRequestId(event.target.value)}
          placeholder="Request ID"
          value={requestId}
        />
        <input
          className="h-9 rounded-md border bg-background/80 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索事件、资源、来源"
          value={keyword}
        />
        <Button onClick={onClear} type="button" variant="outline">
          清空
        </Button>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function UsageTrendCard({ loading, points }: { loading: boolean; points: PlatformUsageTrendPoint[] }) {
  const maxCost = Math.max(...points.map((point) => point.cost_total), 0.000001);

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="size-4 text-primary" />
          用量趋势
        </div>
        <span className="text-xs text-muted-foreground">{points.length} 个时间桶</span>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载用量趋势...</div>
      ) : points.length === 0 ? (
        <EmptyState description="当前窗口内没有可汇总的用量事件。" title="暂无趋势数据" />
      ) : (
        <div className="grid gap-4">
          <div className="flex h-48 items-end gap-2">
            {points.map((point) => (
              <div className="flex min-w-0 flex-1 flex-col justify-end gap-2" key={`${point.bucket}-${point.metric_type}`}>
                <div
                  className="rounded-t-md bg-primary/40"
                  style={{ height: `${Math.max(8, (point.cost_total / maxCost) * 160)}px` }}
                  title={formatMoney(point.cost_total)}
                />
                <div className="truncate text-center text-[11px] text-muted-foreground">{point.bucket}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {points.slice(-3).map((point) => (
              <div className="rounded-md border bg-muted/20 px-3 py-2" key={`${point.bucket}-${point.metric_type}-summary`}>
                <div className="text-xs text-muted-foreground">{point.metric_type}</div>
                <div className="mt-1 text-sm font-medium">{formatMoney(point.cost_total)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {point.event_count} 条 · {point.bucket}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function RollupCard({ loading, items }: { loading: boolean; items: PlatformEventUsageOverview['recent_rollups'] }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <GitBranch className="size-4 text-primary" />
        Rollup 汇总
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载汇总批次...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口没有可用的汇总批次。" title="暂无汇总" />
      ) : (
        <div className="grid gap-3">
          {items.slice(0, 4).map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{item.metric_type}</div>
                  <div className="text-xs text-muted-foreground">{item.period_type} · {item.period_start}</div>
                </div>
                <StatusBadge tone={item.error_count > 0 ? 'degraded' : 'healthy'}>{item.event_count} 条</StatusBadge>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <span>数量 {item.quantity_total}</span>
                <span>金额 {formatMoney(item.amount_total)}</span>
                <span>成本 {formatMoney(item.cost_total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function UsageAnomalyCard({
  detecting,
  overview,
}: {
  detecting: boolean;
  overview: PlatformUsageAnomalyOverview | null;
}) {
  const summary = overview?.summary;

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-amber-600" />
            用量异常信号
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            基于 Rollup 汇总对比最近周期和历史基线，检测成本、调用量、错误率和重试率异常。
          </p>
        </div>
        <StatusBadge tone={usageAnomalySummaryTone(summary?.highest_severity ?? null)}>
          {detecting ? '检测中' : summary ? usageAnomalySeverityLabel(summary.highest_severity) : '未检测'}
        </StatusBadge>
      </div>

      {detecting ? (
        <div className="text-sm text-muted-foreground">正在检测用量异常...</div>
      ) : !overview ? (
        <EmptyState description="点击顶部“检测异常”后，这里会显示当前窗口的异常信号。" title="尚未检测" />
      ) : overview.items.length === 0 ? (
        <EmptyState description="当前窗口内没有发现成本、调用量、错误率或重试率异常。" title="暂无异常信号" />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <AnomalySummaryTile label="异常总数" value={`${summary?.anomaly_count ?? 0}`} />
            <AnomalySummaryTile label="严重" value={`${summary?.critical_count ?? 0}`} />
            <AnomalySummaryTile label="错误" value={`${summary?.error_count ?? 0}`} />
            <AnomalySummaryTile label="警告" value={`${summary?.warning_count ?? 0}`} />
          </div>
          <div className="grid gap-3">
            {overview.items.slice(0, 8).map((item, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border bg-muted/20 px-3 py-3"
                initial={{ opacity: 0, y: 8 }}
                key={item.id}
                transition={{ delay: index * 0.025, duration: 0.22 }}
              >
                <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={usageAnomalySeverityTone(item.severity)}>{usageAnomalySeverityLabel(item.severity)}</StatusBadge>
                      <StatusBadge tone="planned">{usageAnomalyTypeLabel(item.anomaly_type)}</StatusBadge>
                      <span className="text-sm font-medium">{item.metric_type}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(item.detected_at)}</div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-5">
                  <span>资源 {item.resource_type}{item.resource_id ? ` / ${item.resource_id}` : ''}</span>
                  <span>当前 {formatAnomalyValue(item)}</span>
                  <span>基线 {formatAnomalyBaseline(item)}</span>
                  <span>倍率 {item.ratio}</span>
                  <span>错误 {item.error_count} · 重试 {item.retry_count}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AnomalySummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function UsageAlertLifecycleCard({
  loading,
  notifying,
  onAction,
  onNotify,
  onSelectEvent,
  overview,
  pendingAction,
  pendingAlertId,
  pendingNotifyAlertId,
  updating,
}: {
  loading: boolean;
  notifying: boolean;
  onAction: (alert: PlatformUsageAlertItem, action: PlatformUsageAlertAction) => void;
  onNotify: (alert: PlatformUsageAlertItem) => void;
  onSelectEvent: (eventId: string) => void;
  overview: PlatformUsageAlertOverview | null;
  pendingAction: PlatformUsageAlertAction | null;
  pendingAlertId: string | null;
  pendingNotifyAlertId: string | null;
  updating: boolean;
}) {
  const summary = overview?.summary;

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BellRing className="size-4 text-primary" />
            告警生命周期
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            将异常检测事件纳入确认、升级、关闭流程；通知目标为策略预览，生命周期动作会写入统一事件流。
          </p>
        </div>
        <StatusBadge tone={summary && summary.open_count + summary.escalated_count > 0 ? 'degraded' : 'healthy'}>
          {summary ? `${summary.open_count + summary.escalated_count} 个待处理` : '待加载'}
        </StatusBadge>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载告警队列...</div>
      ) : !overview || overview.items.length === 0 ? (
        <EmptyState description="检测到用量异常后，会在这里形成可确认、升级、关闭的告警队列。" title="暂无用量告警" />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <AnomalySummaryTile label="总数" value={`${summary?.total_count ?? 0}`} />
            <AnomalySummaryTile label="待处理" value={`${summary?.open_count ?? 0}`} />
            <AnomalySummaryTile label="已升级" value={`${summary?.escalated_count ?? 0}`} />
            <AnomalySummaryTile label="已关闭" value={`${summary?.closed_count ?? 0}`} />
          </div>
          <div className="grid gap-3">
            {overview.items.slice(0, 8).map((alert, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border bg-muted/20 px-3 py-3"
                initial={{ opacity: 0, y: 8 }}
                key={alert.alert_id}
                transition={{ delay: index * 0.025, duration: 0.22 }}
              >
                <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={usageAlertStatusTone(alert.status)}>{usageAlertStatusLabel(alert.status)}</StatusBadge>
                      <StatusBadge tone={usageAnomalySeverityTone(alert.severity)}>{usageAnomalySeverityLabel(alert.severity)}</StatusBadge>
                      <span className="text-sm font-medium">{alert.title}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{alert.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>异常 {alert.anomaly_count} 条</span>
                      <span>创建 {formatDateTime(alert.created_at)}</span>
                      <span>更新 {formatDateTime(alert.updated_at)}</span>
                      {alert.notification_targets.length > 0 ? <span>通知 {alert.notification_targets.join('、')}</span> : <span>无需通知</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => onSelectEvent(alert.source_event_id)} size="sm" type="button" variant="outline">
                      查看事件
                    </Button>
                    <AlertNotifyButton
                      alert={alert}
                      notifying={notifying}
                      onNotify={onNotify}
                      pendingNotifyAlertId={pendingNotifyAlertId}
                    />
                    <AlertActionButton
                      action="ACKNOWLEDGE"
                      alert={alert}
                      onAction={onAction}
                      pendingAction={pendingAction}
                      pendingAlertId={pendingAlertId}
                      updating={updating}
                    />
                    <AlertActionButton
                      action="ESCALATE"
                      alert={alert}
                      onAction={onAction}
                      pendingAction={pendingAction}
                      pendingAlertId={pendingAlertId}
                      updating={updating}
                    />
                    <AlertActionButton
                      action="CLOSE"
                      alert={alert}
                      onAction={onAction}
                      pendingAction={pendingAction}
                      pendingAlertId={pendingAlertId}
                      updating={updating}
                    />
                  </div>
                </div>
                {alert.last_note ? (
                  <div className="mt-3 rounded-md border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                    最近备注：{alert.last_note}
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AlertNotifyButton({
  alert,
  notifying,
  onNotify,
  pendingNotifyAlertId,
}: {
  alert: PlatformUsageAlertItem;
  notifying: boolean;
  onNotify: (alert: PlatformUsageAlertItem) => void;
  pendingNotifyAlertId: string | null;
}) {
  const pending = notifying && pendingNotifyAlertId === alert.alert_id;

  return (
    <Button
      disabled={pending || alert.status === 'CLOSED'}
      onClick={() => onNotify(alert)}
      size="sm"
      type="button"
      variant="outline"
    >
      {pending ? '通知中' : '通知'}
    </Button>
  );
}

function AlertActionButton({
  action,
  alert,
  onAction,
  pendingAction,
  pendingAlertId,
  updating,
}: {
  action: PlatformUsageAlertAction;
  alert: PlatformUsageAlertItem;
  onAction: (alert: PlatformUsageAlertItem, action: PlatformUsageAlertAction) => void;
  pendingAction: PlatformUsageAlertAction | null;
  pendingAlertId: string | null;
  updating: boolean;
}) {
  const pending = updating && pendingAlertId === alert.alert_id && pendingAction === action;

  return (
    <Button
      disabled={pending || !canRunUsageAlertAction(alert, action)}
      onClick={() => onAction(alert, action)}
      size="sm"
      type="button"
      variant="outline"
    >
      {pending ? '处理中' : usageAlertActionLabel(action)}
    </Button>
  );
}

function UsageAlertNotificationAuditCard({
  loading,
  onRetry,
  onSelectEvent,
  onStatusChange,
  overview,
  pendingNotificationEventId,
  retrying,
  status,
}: {
  loading: boolean;
  onRetry: (notificationEventId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onStatusChange: (status: PlatformUsageAlertNotificationStatus | '') => void;
  overview: PlatformUsageAlertNotificationOverview | null;
  pendingNotificationEventId: string | null;
  retrying: boolean;
  status: PlatformUsageAlertNotificationStatus | '';
}) {
  const summary = overview?.summary;

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BellRing className="size-4 text-primary" />
            通知投递审计
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            统一查看告警通知投递结果，失败或部分成功的投递可以直接重试，重试链路会继续写入统一事件。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={summary && summary.retryable_count > 0 ? 'degraded' : 'healthy'}>
            {summary ? `${summary.retryable_count} 个可重试` : '待加载'}
          </StatusBadge>
          <select
            className="h-9 rounded-md border bg-background/80 px-3 text-sm"
            onChange={(event) => onStatusChange(event.target.value as PlatformUsageAlertNotificationStatus | '')}
            value={status}
          >
            <option value="">全部状态</option>
            <option value="SENT">已投递</option>
            <option value="PARTIAL">部分成功</option>
            <option value="SKIPPED">已跳过</option>
            <option value="FAILED">失败</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载通知投递记录...</div>
      ) : !overview || overview.items.length === 0 ? (
        <EmptyState description="触发告警通知后，这里会展示投递状态、Webhook 响应和重试链路。" title="暂无投递记录" />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <AnomalySummaryTile label="投递总数" value={`${summary?.total_count ?? 0}`} />
            <AnomalySummaryTile label="失败" value={`${summary?.failed_count ?? 0}`} />
            <AnomalySummaryTile label="部分成功" value={`${summary?.partial_count ?? 0}`} />
            <AnomalySummaryTile label="已重试" value={`${summary?.retried_count ?? 0}`} />
          </div>
          <div className="grid gap-3">
            {overview.items.slice(0, 8).map((item, index) => (
              <UsageAlertNotificationAuditRow
                item={item}
                key={item.notification_event_id}
                onRetry={onRetry}
                onSelectEvent={onSelectEvent}
                pendingNotificationEventId={pendingNotificationEventId}
                retrying={retrying}
                rowIndex={index}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function UsageAlertNotificationAuditRow({
  item,
  onRetry,
  onSelectEvent,
  pendingNotificationEventId,
  retrying,
  rowIndex,
}: {
  item: PlatformUsageAlertNotificationItem;
  onRetry: (notificationEventId: string) => void;
  onSelectEvent: (eventId: string) => void;
  pendingNotificationEventId: string | null;
  retrying: boolean;
  rowIndex: number;
}) {
  const pending = retrying && pendingNotificationEventId === item.notification_event_id;
  const retryable = item.status === 'FAILED' || item.status === 'PARTIAL';

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border bg-muted/20 px-3 py-3"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: rowIndex * 0.025, duration: 0.22 }}
    >
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={notificationStatusTone(item.status)}>{notificationStatusLabel(item.status)}</StatusBadge>
            {item.channels.map((channel) => (
              <StatusBadge key={channel} tone="planned">{notificationChannelLabel(channel)}</StatusBadge>
            ))}
            <span className="font-mono text-xs text-muted-foreground">{shortId(item.notification_event_id)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.message}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>告警 {shortId(item.alert_id)}</span>
            <span>Webhook {item.webhook_status ?? '无'}</span>
            <span>重试 {item.retry_count} 次</span>
            <span>投递 {formatDateTime(item.delivered_at)}</span>
            {item.targets.length > 0 ? <span>目标 {item.targets.join('、')}</span> : <span>无目标</span>}
          </div>
          {item.webhook_error ? (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Webhook 错误：{item.webhook_error}
            </div>
          ) : null}
          {item.retried_from_event_id ? (
            <div className="mt-2 text-xs text-muted-foreground">
              来源投递：{shortId(item.retried_from_event_id)}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onSelectEvent(item.notification_event_id)} size="sm" type="button" variant="outline">
            查看事件
          </Button>
          <Button
            disabled={!retryable || pending}
            onClick={() => onRetry(item.notification_event_id)}
            size="sm"
            type="button"
            variant="outline"
          >
            {pending ? '重试中' : '重试'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function UsageAlertNotificationTaskCard({
  loading,
  onRefresh,
  onRunAutoRetry,
  overview,
  running,
}: {
  loading: boolean;
  onRefresh: () => void;
  onRunAutoRetry: () => void;
  overview: PlatformUsageAlertNotificationTaskOverview | null;
  running: boolean;
}) {
  const summary = overview?.summary;
  const policy = overview?.policy;
  const hasWork = (summary?.pending_auto_retry_count ?? 0) > 0;
  const metrics = [
    { label: '待自动重试', value: `${summary?.pending_auto_retry_count ?? 0}`, helper: '满足退避与次数限制' },
    { label: '失败投递', value: `${summary?.failed_notification_count ?? 0}`, helper: '最近窗口内失败' },
    { label: '部分成功', value: `${summary?.partial_notification_count ?? 0}`, helper: '站内成功或外部失败' },
    { label: '已重试', value: `${summary?.retried_notification_count ?? 0}`, helper: '已有重试链路' },
  ];

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">自动重试</StatusBadge>
            <StatusBadge tone={overview?.scheduler_enabled ? 'healthy' : 'planned'}>
              {overview?.scheduler_enabled ? '任务已启用' : '任务未启用'}
            </StatusBadge>
            <StatusBadge tone={policy?.source === 'SYSTEM_SETTING' ? 'healthy' : 'planned'}>
              {policy?.source === 'SYSTEM_SETTING' ? '租户策略' : '环境变量'}
            </StatusBadge>
            <StatusBadge tone={overview?.running || running ? 'loading' : 'mock'}>
              {overview?.running || running ? '执行中' : '空闲'}
            </StatusBadge>
          </div>
          <h3 className="mt-3 text-base font-semibold">告警通知自动重试</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            扫描失败或部分成功的告警通知投递，满足退避时间和最大重试次数后自动追加重试投递事件。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            刷新任务
          </Button>
          <Button disabled={loading || running} onClick={onRunAutoRetry} type="button" variant="outline">
            <RefreshCw className={cn('size-4', running && 'animate-spin')} />
            {running ? '扫描中' : '立即扫描重试'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-24 rounded-md border bg-muted/30" key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard helper={metric.helper} key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>

          {!hasWork ? (
            <EmptyState
              className="rounded-md border bg-slate-50/60 p-5"
              description="当前没有达到退避时间且未超过最大重试次数的告警通知投递。"
              title="暂无待自动重试项"
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-slate-200/80 p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold">调度状态</div>
                <p className="mt-1 text-sm text-muted-foreground">应用内轻量任务调度，不依赖额外中间件。</p>
              </div>
              <div className="grid gap-2 text-sm">
                <DetailRow label="任务开关" value={overview?.scheduler_enabled ? '已启用' : '未启用'} />
                <DetailRow label="运行状态" value={overview?.running || running ? '执行中' : '空闲'} />
                <DetailRow label="最近扫描" value={formatDateTime(overview?.last_tick_at ?? '')} />
                <DetailRow label="扫描间隔" value={overview?.next_tick_after_seconds ? `${overview.next_tick_after_seconds} 秒` : '未配置'} />
                <DetailRow label="最早待重试" value={formatDateTime(summary?.oldest_retryable_at ?? '')} />
                <DetailRow label="策略来源" value={policy?.source === 'SYSTEM_SETTING' ? '租户系统设置' : '环境变量兜底'} />
              </div>
            </Card>

            <Card className="border-slate-200/80 p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold">当前策略</div>
                <p className="mt-1 text-sm text-muted-foreground">策略可在设置中心的通知策略分类中维护。</p>
              </div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <DetailRow label="单批数量" value={`${policy?.retry_batch_size ?? 0}`} />
                <DetailRow label="最大重试" value={`${policy?.max_retry_count ?? 0} 次`} />
                <DetailRow label="退避时间" value={`${policy?.retry_backoff_seconds ?? 0} 秒`} />
                <DetailRow label="回看窗口" value={`${policy?.lookback_hours ?? 0} 小时`} />
              </div>
            </Card>
          </div>

          <Card className="border-slate-200/80 p-4">
            <div className="mb-3">
              <div className="text-sm font-semibold">最近执行结果</div>
              <p className="mt-1 text-sm text-muted-foreground">展示最近一次自动重试任务结果。</p>
            </div>
            <AlertNotificationTaskResultCard result={overview?.last_auto_retry_result ?? null} />
          </Card>
        </div>
      )}
    </Card>
  );
}

function AlertNotificationTaskResultCard({
  result,
}: {
  result: PlatformUsageAlertNotificationTaskRunResult | null;
}) {
  if (!result) {
    return (
      <div className="rounded-md border bg-background/70 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">自动重试</span>
          <StatusBadge tone="planned">暂无结果</StatusBadge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">任务执行后会显示最近一次扫描和重试摘要。</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">自动重试</span>
        <StatusBadge tone={taskRunTone(result.status)}>{taskRunLabel(result.status)}</StatusBadge>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <DetailRow label="扫描" value={`${result.scanned_count}`} />
        <DetailRow label="重试" value={`${result.retried_count}`} />
        <DetailRow label="成功" value={`${result.success_count}`} />
        <DetailRow label="失败" value={`${result.failed_count}`} />
        <DetailRow label="跳过" value={`${result.skipped_count}`} />
        <DetailRow label="完成时间" value={formatDateTime(result.finished_at)} />
      </div>
      {result.error_message ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {result.error_message}
        </div>
      ) : null}
    </div>
  );
}

function RecentEventCard({
  activeEventId,
  loading,
  items,
  onSelectEvent,
  total,
}: {
  activeEventId: string | null;
  loading: boolean;
  items: PlatformEventListItem[];
  onSelectEvent: (eventId: string) => void;
  total: number;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Route className="size-4 text-primary" />
          平台事件
        </div>
        <span className="text-xs text-muted-foreground">显示 {items.length} / {total}</span>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载平台事件...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口暂无平台事件。" title="暂无事件" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['时间', '事件类型', '资源', '状态', '摘要', '链路'].map((column) => (
                  <th className="px-3 py-2 font-medium text-muted-foreground" key={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <motion.tr
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'border-b transition-colors last:border-0 hover:bg-muted/25',
                    activeEventId === item.id && 'bg-primary/5',
                  )}
                  initial={{ opacity: 0, y: 6 }}
                  key={item.id}
                  onClick={() => onSelectEvent(item.id)}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                >
                  <td className="px-3 py-2 text-muted-foreground">{formatDateTime(item.occurred_at)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.event_type}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.resource_type}{item.resource_id ? ` / ${item.resource_id}` : ''}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={eventTone(item.status)}>{item.status}</StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.summary ?? '-'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">用量 {item.linked_usage_count} 条</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{shortId(item.trace_id ?? item.request_id ?? item.id)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function PlatformEventDetailCard({
  detail,
  loading,
  onFilterRequest,
  onFilterTrace,
}: {
  detail: PlatformEventDetail | null;
  loading: boolean;
  onFilterRequest: (requestId: string) => void;
  onFilterTrace: (traceId: string) => void;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Route className="size-4 text-primary" />
          事件详情
        </div>
        {detail ? <StatusBadge tone={eventTone(detail.status)}>{detail.status}</StatusBadge> : null}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载事件详情...</div>
      ) : !detail ? (
        <EmptyState description="选择一条平台事件后查看 Payload、关系链路和关联用量。" title="未选择事件" />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <DetailRow label="事件类型" value={detail.event_type} />
            <DetailRow label="来源系统" value={detail.source_system ?? '无'} />
            <DetailRow label="资源" value={`${detail.resource_type}${detail.resource_id ? ` / ${detail.resource_id}` : ''}`} />
            <DetailRow label="安全级别" value={detail.security_level} />
            <DetailRow label="Trace ID" value={detail.trace_id ?? '无'} />
            <DetailRow label="Request ID" value={detail.request_id ?? '无'} />
            <DetailRow label="发生时间" value={formatDateTime(detail.occurred_at)} />
            <DetailRow label="用量数量" value={`${detail.linked_usage_count} 条`} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={!detail.trace_id} onClick={() => detail.trace_id && onFilterTrace(detail.trace_id)} type="button" variant="outline">
              按 Trace 筛选
            </Button>
            <Button disabled={!detail.request_id} onClick={() => detail.request_id && onFilterRequest(detail.request_id)} type="button" variant="outline">
              按 Request 筛选
            </Button>
          </div>

          {detail.summary ? (
            <div className="rounded-md border bg-slate-50/70 p-3 text-sm leading-6 text-muted-foreground">
              {detail.summary}
            </div>
          ) : null}

          <div className="grid gap-2">
            <div className="text-sm font-semibold">关联用量</div>
            {detail.usage_events.length === 0 ? (
              <EmptyState className="rounded-md border bg-slate-50/60 p-5" description="当前事件没有直接关联的用量账本。" title="暂无关联用量" />
            ) : (
              <div className="grid gap-2">
                {detail.usage_events.slice(0, 4).map((item) => (
                  <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={item.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{item.metric_type}</span>
                      <span>{formatMoney(item.amount)}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      数量 {item.quantity} {item.unit} · {formatDateTime(item.occurred_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold">事件关系</div>
            {detail.relations.length === 0 ? (
              <EmptyState className="rounded-md border bg-slate-50/60 p-5" description="当前事件暂未建立父子、审批或用量关系。" title="暂无关系链路" />
            ) : (
              <div className="grid gap-2">
                {detail.relations.slice(0, 4).map((item) => (
                  <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm" key={item.id}>
                    <div className="font-medium">{item.relation_type}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      父 {shortId(item.parent_event_id)} · 子 {shortId(item.child_event_id)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold">Payload JSON</div>
            <pre className="max-h-72 overflow-auto rounded-md border bg-slate-950 px-3 py-3 text-xs leading-6 text-slate-100">
{stringifyPayload(detail.payload_json)}
            </pre>
          </div>
        </div>
      )}
    </Card>
  );
}

function RecentUsageCard({ loading, items }: { loading: boolean; items: PlatformUsageLedgerItem[] }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert className="size-4 text-amber-600" />
        用量账本
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载用量账本...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口没有用量记录。" title="暂无用量" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-3" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{item.metric_type}</div>
                  <div className="text-xs text-muted-foreground">{item.resource_type}{item.resource_id ? ` / ${item.resource_id}` : ''}</div>
                </div>
                <div className="text-right text-sm font-semibold">{formatMoney(item.amount)}</div>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <span>数量 {item.quantity}</span>
                <span>单位 {item.unit}</span>
                <span>{formatDateTime(item.occurred_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentRelationCard({
  loading,
  items,
}: {
  loading: boolean;
  items: PlatformEventUsageOverview['recent_relations'];
}) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <GitBranch className="size-4 text-primary" />
        事件关系
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载事件关系...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口没有事件关系链路。" title="暂无关系" />
      ) : (
        <div className="grid gap-3">
          {items.slice(0, 8).map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{item.relation_type}</div>
                <span className="text-xs text-muted-foreground">{formatDateTime(item.occurred_at)}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                父 {shortId(item.parent_event_id)} · 子 {shortId(item.child_event_id)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                源 {shortId(item.source_event_id)} · 目标 {shortId(item.target_event_id)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentLedgerCard({ loading, items }: { loading: boolean; items: PlatformUsageLedgerItem[] }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Coins className="size-4 text-primary" />
        最近账本
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">正在加载账本明细...</div>
      ) : items.length === 0 ? (
        <EmptyState description="当前窗口没有账本明细。" title="暂无明细" />
      ) : (
        <div className="grid gap-3">
          {items.slice(0, 6).map((item) => (
            <div className="rounded-md border bg-muted/20 px-3 py-2" key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{item.metric_type}</div>
                <div className="text-sm font-semibold">{formatMoney(item.amount)}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.subject_type}{item.subject_id ? ` / ${item.subject_id}` : ''} · {item.resource_type}{item.resource_id ? ` / ${item.resource_id}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function eventTone(status: string) {
  if (['FAILED', 'REJECTED', 'DENIED', 'CANCELLED'].includes(status)) return 'unavailable';
  if (['PENDING', 'WAITING_HUMAN'].includes(status)) return 'degraded';
  return 'healthy';
}

function usageAnomalySeverityTone(severity: PlatformUsageAnomalySeverity) {
  if (severity === 'CRITICAL' || severity === 'ERROR') return 'unavailable';
  if (severity === 'WARN') return 'degraded';
  return 'healthy';
}

function usageAnomalySummaryTone(severity: PlatformUsageAnomalySeverity | null) {
  if (!severity) return 'planned';
  return usageAnomalySeverityTone(severity);
}

function usageAnomalySeverityLabel(severity: PlatformUsageAnomalySeverity | null) {
  if (!severity) return '无异常';
  const labels: Record<PlatformUsageAnomalySeverity, string> = {
    INFO: '提示',
    WARN: '警告',
    ERROR: '错误',
    CRITICAL: '严重',
  };
  return labels[severity];
}

function usageAnomalyTypeLabel(type: PlatformUsageAnomalyType) {
  const labels: Record<PlatformUsageAnomalyType, string> = {
    COST_SPIKE: '成本突增',
    EVENT_SPIKE: '调用突增',
    ERROR_RATE: '错误率过高',
    RETRY_RATE: '重试率过高',
    NO_SUCCESS: '无成功记录',
  };
  return labels[type];
}

function usageAlertStatusTone(status: PlatformUsageAlertStatus) {
  if (status === 'CLOSED') return 'healthy';
  if (status === 'ESCALATED') return 'unavailable';
  if (status === 'ACKNOWLEDGED') return 'degraded';
  return 'planned';
}

function usageAlertStatusLabel(status: PlatformUsageAlertStatus) {
  const labels: Record<PlatformUsageAlertStatus, string> = {
    OPEN: '待处理',
    ACKNOWLEDGED: '已确认',
    ESCALATED: '已升级',
    CLOSED: '已关闭',
  };
  return labels[status];
}

function usageAlertActionLabel(action: PlatformUsageAlertAction) {
  const labels: Record<PlatformUsageAlertAction, string> = {
    ACKNOWLEDGE: '确认',
    ESCALATE: '升级',
    CLOSE: '关闭',
  };
  return labels[action];
}

function platformUsageActionConfirmTitle(target: PlatformUsageActionTarget) {
  if (target.type === 'detect-anomalies') return '确认检测用量异常';
  if (target.type === 'rebuild-rollups') return '确认重建 Rollup';
  if (target.type === 'notify-alert') return '确认通知用量告警';
  if (target.type === 'update-alert') return '确认更新告警状态';
  if (target.type === 'retry-notification') return '确认重试告警通知';
  return '确认运行自动重试任务';
}

function platformUsageActionConfirmLabel(target: PlatformUsageActionTarget) {
  if (target.type === 'detect-anomalies') return '确认检测';
  if (target.type === 'rebuild-rollups') return '确认重建';
  if (target.type === 'notify-alert') return '确认通知';
  if (target.type === 'update-alert') return '确认更新';
  if (target.type === 'retry-notification') return '确认重试';
  return '确认运行';
}

function platformUsageActionConfirmBody(target: PlatformUsageActionTarget) {
  if (target.type === 'detect-anomalies') return `确认检测 ${target.window} 窗口内的用量异常？系统会基于 Rollup 和历史基线生成异常信号，并刷新告警队列。`;
  if (target.type === 'rebuild-rollups') return `确认重建 ${target.window} 窗口的 Rollup 汇总？系统会重新聚合平台事件和用量账本，可能影响当前告警、趋势和成本汇总。`;
  if (target.type === 'notify-alert') return `确认通知用量告警「${target.title}」？系统会向站内和 Webhook 目标重新投递告警通知，并记录通知审计事件。`;
  if (target.type === 'update-alert') return `确认将用量告警「${target.title}」更新为“${usageAlertActionLabel(target.action)}”？该动作会写入统一事件流和告警生命周期记录。`;
  if (target.type === 'retry-notification') return `确认重试告警通知「${shortId(target.notificationEventId)}」？系统会重新投递失败或部分成功的通知，并追加重试事件。`;
  return '确认立即运行告警通知自动重试任务？系统会扫描可重试通知并追加重试投递事件。';
}

function canRunUsageAlertAction(alert: PlatformUsageAlertItem, action: PlatformUsageAlertAction) {
  if (alert.status === 'CLOSED') return false;
  if (action === 'ACKNOWLEDGE') return alert.status === 'OPEN' || alert.status === 'ESCALATED';
  if (action === 'ESCALATE') return alert.status !== 'ESCALATED';
  return true;
}

function notificationStatusTone(status: PlatformUsageAlertNotificationStatus) {
  if (status === 'FAILED') return 'unavailable';
  if (status === 'PARTIAL' || status === 'SKIPPED') return 'degraded';
  return 'healthy';
}

function notificationStatusLabel(status: PlatformUsageAlertNotificationStatus) {
  const labels: Record<PlatformUsageAlertNotificationStatus, string> = {
    SENT: '已投递',
    PARTIAL: '部分成功',
    SKIPPED: '已跳过',
    FAILED: '失败',
  };

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
  const labels: Record<PlatformUsageAlertNotificationTaskRunResult['status'], string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    SKIPPED: '已跳过',
  };

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-white/70 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-words font-medium">{value}</span>
    </div>
  );
}

function shortId(value: string | null | undefined) {
  if (!value) return '-';
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value;
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function stringifyPayload(value: Record<string, unknown> | null) {
  if (!value) return '无 Payload';
  return JSON.stringify(value, null, 2);
}
