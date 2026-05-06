'use client';

import type { MonitorWindow } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { formatDateTime } from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
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
  OperationsTrendCard,
  RunStepOperationsCard,
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
  const { currentUser } = useAuth();
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

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-end"
        initial={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            早上好，{currentUser?.user.name ?? 'Admin'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            欢迎使用 AI Agent 平台，以下是系统运行概览
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge tone="ready">M12</StatusBadge>
            <StatusBadge tone="ready">M23</StatusBadge>
            <StatusBadge tone="healthy">步骤态势</StatusBadge>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="size-2 rounded-full bg-emerald-500" />
              数据实时更新
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="text-sm text-muted-foreground">最近更新：{formatDateTime(updatedAt)}</div>
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
      </motion.section>

      {error ? (
        <section className="relative z-10 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm backdrop-blur">
          {error}
        </section>
      ) : null}

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8"
        initial={{ opacity: 0, y: 12 }}
        transition={{ delay: 0.05, duration: 0.3, ease: 'easeOut' }}
      >
        {metrics.map((metric) => (
          <MetricTile key={metric.label} loading={isInitialLoading} metric={metric} />
        ))}
      </motion.section>

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

      <RunStepOperationsCard
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

      <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground">
        © 2026 AIAget 平台。保留所有权利。
      </footer>
    </main>
  );
}
