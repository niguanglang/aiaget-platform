'use client';

import type { MonitorWindow } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { Home, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatDateTime } from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { getAuditOverview, getMonitorOverview } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import {
  AgentRankingCard,
  ErrorDistributionCard,
  RecentAlertsCard,
} from './dashboard-insight-cards';
import {
  DashboardBackdrop,
  HealthOverviewCard,
  MetricTile,
} from './dashboard-overview-cards';
import {
  ExecutionFlowCard,
  OperationsTrendCard,
} from './dashboard-operations-cards';
import {
  buildDashboardMetrics,
  buildErrorSegments,
  buildHealthRows,
  calculateHealthScore,
  mapAuditFailureToIncident,
  mapMonitorErrorToIncident,
  sumBy,
} from './dashboard-shared';

export function DashboardContent() {
  const [windowValue, setWindowValue] = useState<MonitorWindow>('7d');

  const monitorOverviewQuery = useQuery({
    queryKey: ['dashboard-monitor-overview', windowValue],
    queryFn: () => getMonitorOverview({ window: windowValue }),
  });

  const auditOverviewQuery = useQuery({
    queryKey: ['dashboard-audit-overview', windowValue],
    queryFn: () => getAuditOverview({ window: windowValue }),
  });

  const isInitialLoading =
    !monitorOverviewQuery.data &&
    !auditOverviewQuery.data &&
    (monitorOverviewQuery.isLoading || auditOverviewQuery.isLoading);
  const isRefreshing = monitorOverviewQuery.isFetching || auditOverviewQuery.isFetching;

  const error = useMemo(() => {
    const messages: string[] = [];

    if (monitorOverviewQuery.isError) {
      messages.push('监控概览加载失败');
    }

    if (auditOverviewQuery.isError) {
      messages.push('审计概览加载失败');
    }

    return messages.length > 0 ? `${messages.join('，')}。` : null;
  }, [auditOverviewQuery.isError, monitorOverviewQuery.isError]);

  const trendPoints = monitorOverviewQuery.data?.latency_trend ?? [];
  const failedTotal = sumBy(trendPoints, (point) => point.failed);

  const metrics = useMemo(
    () => buildDashboardMetrics({ monitorOverview: monitorOverviewQuery.data, windowValue }),
    [monitorOverviewQuery.data, windowValue],
  );

  const incidents = useMemo(() => {
    const auditFailures = (auditOverviewQuery.data?.failures ?? []).map((item) =>
      mapAuditFailureToIncident(item),
    );
    const monitorErrors = (monitorOverviewQuery.data?.errors ?? []).map((item) =>
      mapMonitorErrorToIncident(item),
    );

    return [...auditFailures, ...monitorErrors]
      .sort((left, right) => Date.parse(right.time) - Date.parse(left.time))
      .slice(0, 8);
  }, [auditOverviewQuery.data, monitorOverviewQuery.data]);

  const errorSegments = useMemo(
    () => buildErrorSegments(monitorOverviewQuery.data?.errors ?? [], auditOverviewQuery.data?.failures ?? []),
    [auditOverviewQuery.data, monitorOverviewQuery.data],
  );

  const healthRows = useMemo(
    () =>
      buildHealthRows({
        auditError: auditOverviewQuery.isError,
        auditLoaded: Boolean(auditOverviewQuery.data),
        auditSuccessRate: auditOverviewQuery.data?.summary.success_rate,
        controlHealth: monitorOverviewQuery.data?.health.control_api ?? null,
        monitorError: monitorOverviewQuery.isError,
        monitorLoaded: Boolean(monitorOverviewQuery.data),
        runtimeHealth: monitorOverviewQuery.data?.health.runtime ?? null,
        summaryLatency: monitorOverviewQuery.data?.summary.average_latency_ms ?? null,
        trendPoints,
      }),
    [
      auditOverviewQuery.data,
      auditOverviewQuery.isError,
      monitorOverviewQuery.data,
      monitorOverviewQuery.isError,
      trendPoints,
    ],
  );

  const healthScore = useMemo(
    () =>
      calculateHealthScore({
        auditSuccessRate: auditOverviewQuery.data?.summary.success_rate,
        controlHealth: monitorOverviewQuery.data?.health.control_api ?? null,
        errorCount: incidents.length,
        monitorSuccessRate: monitorOverviewQuery.data?.summary.success_rate,
        runtimeHealth: monitorOverviewQuery.data?.health.runtime ?? null,
      }),
    [auditOverviewQuery.data, incidents.length, monitorOverviewQuery.data],
  );

  const updatedAt =
    monitorOverviewQuery.data?.health.control_api.timestamp ??
    (monitorOverviewQuery.dataUpdatedAt ? new Date(monitorOverviewQuery.dataUpdatedAt).toISOString() : null);

  return (
    <main className="relative isolate grid min-h-[calc(100vh-66px)] w-full gap-[18px] overflow-hidden px-4 py-6 lg:pl-[39px] lg:pr-[27px]">
      <DashboardBackdrop />

      <section className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Home className="size-4" />
          <span>工作台</span>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="text-sm text-muted-foreground">最近更新：{formatDateTime(updatedAt)}</div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="size-2 rounded-full bg-emerald-500" />
            实时同步
          </span>
          <Button
            disabled={isRefreshing}
            onClick={() => {
              void monitorOverviewQuery.refetch();
              void auditOverviewQuery.refetch();
            }}
            size="icon"
            type="button"
            variant="outline"
          >
            <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
            <span className="sr-only">刷新仪表盘</span>
          </Button>
        </div>
      </section>

      <section className="relative z-10 grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        {metrics.map((metric) => (
          <MetricTile key={metric.label} loading={isInitialLoading} metric={metric} />
        ))}
      </section>

      {error ? (
        <section className="relative z-10 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm backdrop-blur">
          {error}
        </section>
      ) : null}

      <section className="relative z-10 grid gap-4 xl:grid-cols-[0.98fr_1fr]">
        <HealthOverviewCard
          healthRows={healthRows}
          loading={isInitialLoading}
          score={healthScore}
        />
        <OperationsTrendCard
          loading={isInitialLoading}
          onWindowChange={setWindowValue}
          points={trendPoints}
          windowValue={windowValue}
        />
      </section>

      <ExecutionFlowCard
        items={monitorOverviewQuery.data?.run_step_breakdown ?? []}
        loading={isInitialLoading}
        summary={monitorOverviewQuery.data?.run_step_summary ?? null}
        windowValue={windowValue}
      />

      <section className="relative z-10 grid gap-4 xl:grid-cols-[0.95fr_1fr_1.1fr]">
        <AgentRankingCard
          items={monitorOverviewQuery.data?.agent_rankings ?? []}
          loading={isInitialLoading}
        />
        <ErrorDistributionCard
          loading={isInitialLoading}
          segments={errorSegments}
          total={incidents.length || failedTotal}
        />
        <RecentAlertsCard incidents={incidents} loading={isInitialLoading} />
      </section>
    </main>
  );
}
