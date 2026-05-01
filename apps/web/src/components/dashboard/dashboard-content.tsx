'use client';

import type {
  AuditFailureItem,
  HealthResponse,
  HealthStatus,
  MonitorErrorSampleItem,
  MonitorRunStepMetricItem,
  MonitorRunStepSummary,
  MonitorTrendPoint,
  MonitorWindow,
} from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  Gauge,
  HeartPulse,
  Layers3,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  formatLatency,
  formatMoney,
  formatPercent,
  monitorModuleLabel,
  monitorStepTypeLabel,
} from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAuditOverview, getMonitorOverview } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const windowLabels: Record<MonitorWindow, string> = {
  '24h': '24 小时',
  '7d': '近 7 天',
};

const metricToneClasses = {
  blue: {
    card: 'from-blue-50/90 to-white',
    icon: 'bg-blue-50 text-blue-600 ring-blue-100',
    line: '#2f7df6',
  },
  emerald: {
    card: 'from-emerald-50/90 to-white',
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    line: '#2fbf88',
  },
  cyan: {
    card: 'from-cyan-50/90 to-white',
    icon: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
    line: '#29b6c8',
  },
  red: {
    card: 'from-red-50/90 to-white',
    icon: 'bg-red-50 text-red-600 ring-red-100',
    line: '#ef4444',
  },
  amber: {
    card: 'from-amber-50/90 to-white',
    icon: 'bg-amber-50 text-amber-600 ring-amber-100',
    line: '#f59e0b',
  },
  violet: {
    card: 'from-violet-50/90 to-white',
    icon: 'bg-violet-50 text-violet-600 ring-violet-100',
    line: '#7c3aed',
  },
} as const;

const severityClasses = {
  high: 'border-red-100 bg-red-50 text-red-600',
  medium: 'border-amber-100 bg-amber-50 text-amber-600',
  low: 'border-blue-100 bg-blue-50 text-blue-600',
} as const;

const severityLabels = {
  high: '高',
  medium: '中',
  low: '低',
} as const;

const dashboardSurfaceClass =
  'border-white/70 bg-white/[0.88] shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/[0.78]';
const dashboardMetricSurfaceClass =
  'border-white/70 shadow-[0_14px_40px_rgba(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/[0.74]';

type MetricTone = keyof typeof metricToneClasses;
type IncidentSeverity = keyof typeof severityClasses;
type HealthRowStatus = HealthStatus | 'loading';

interface DashboardMetric {
  helper: string;
  icon: LucideIcon;
  label: string;
  tone: MetricTone;
  trend: number[];
  value: string;
}

interface IncidentItem {
  description: string;
  id: string;
  severity: IncidentSeverity;
  source: string;
  time: string;
  title: string;
}

interface ErrorSegment {
  color: string;
  count: number;
  label: string;
}

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
  const trendTotal = sumBy(trendPoints, (point) => point.total);

  const metrics = useMemo<DashboardMetric[]>(() => {
    const summary = monitorOverviewQuery.data?.summary;
    const agentRankings = monitorOverviewQuery.data?.agent_rankings ?? [];
    const toolRankings = monitorOverviewQuery.data?.tool_rankings ?? [];
    const knowledgeRankings = monitorOverviewQuery.data?.knowledge_rankings ?? [];
    const points = monitorOverviewQuery.data?.latency_trend ?? [];
    const activeAgents = agentRankings.length;
    const activeConversations = summary?.active_conversations ?? 0;
    const eventsTotal = summary?.events_total ?? 0;
    const failedEvents = sumBy(points, (point) => point.failed);
    const totalToolCalls = sumBy(toolRankings, (item) => item.call_count);
    const totalKnowledgeRecalls = sumBy(knowledgeRankings, (item) => item.recall_count);

    return [
      {
        helper: '有调用记录',
        icon: BrainCircuit,
        label: '活跃智能体',
        tone: 'blue',
        trend: agentRankings.map((item) => item.run_count),
        value: summary ? formatNumber(activeAgents) : '--',
      },
      {
        helper: '当前线程',
        icon: Activity,
        label: '运行中会话',
        tone: 'emerald',
        trend: points.map((point) => point.success),
        value: summary ? formatNumber(activeConversations) : '--',
      },
      {
        helper: `${windowLabels[windowValue]}窗口`,
        icon: Zap,
        label: '窗口调用量',
        tone: 'blue',
        trend: points.map((point) => point.total),
        value: summary ? formatNumber(eventsTotal) : '--',
      },
      {
        helper: `失败率 ${trendTotal > 0 ? formatPercent((failedEvents / trendTotal) * 100) : '0.0%'}`,
        icon: TriangleAlert,
        label: '失败事件',
        tone: 'red',
        trend: points.map((point) => point.failed),
        value: summary ? formatNumber(failedEvents) : '--',
      },
      {
        helper: `P95 ${summary ? formatLatency(summary.p95_latency_ms) : '--'}`,
        icon: Clock3,
        label: '平均延迟',
        tone: 'cyan',
        trend: points.map((point) => point.average_latency_ms),
        value: summary ? formatLatency(summary.average_latency_ms) : '--',
      },
      {
        helper: '模型调用成本',
        icon: CircleDollarSign,
        label: '费用预估',
        tone: 'emerald',
        trend: monitorOverviewQuery.data?.model_rankings.map((item) => item.total_cost) ?? [],
        value: summary ? formatDashboardMoney(summary.total_cost) : '--',
      },
      {
        helper: '知识库召回',
        icon: Database,
        label: '检索调用量',
        tone: 'blue',
        trend: knowledgeRankings.map((item) => item.recall_count),
        value: summary ? formatNumber(totalKnowledgeRecalls) : '--',
      },
      {
        helper: '工具执行记录',
        icon: Wrench,
        label: '工具调用次数',
        tone: 'blue',
        trend: toolRankings.map((item) => item.call_count),
        value: summary ? formatNumber(totalToolCalls) : '--',
      },
    ];
  }, [monitorOverviewQuery.data, trendTotal, windowValue]);

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

function DashboardBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_28%_0%,rgba(59,130,246,0.14),transparent_48%),radial-gradient(ellipse_at_78%_12%,rgba(20,184,166,0.12),transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-white/80 via-slate-50/50 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
    </div>
  );
}

function MetricTile({ loading, metric }: { loading: boolean; metric: DashboardMetric }) {
  const tone = metricToneClasses[metric.tone];
  const Icon = metric.icon;

  return (
    <Card
      className={cn(
        'h-[146px] overflow-hidden rounded-xl bg-gradient-to-br p-4',
        dashboardMetricSurfaceClass,
        tone.card,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('rounded-lg p-1.5 ring-1', tone.icon)}>
          <Icon className="size-4" />
        </span>
        <span className="line-clamp-1 text-xs font-medium text-slate-500">{metric.label}</span>
      </div>
      <div className="mt-2 text-[22px] font-semibold leading-7 tracking-tight text-slate-950">
        {loading ? <span className="text-slate-300">--</span> : metric.value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{metric.helper}</div>
      <Sparkline className="mt-2" color={tone.line} values={metric.trend} />
    </Card>
  );
}

function Sparkline({
  className,
  color,
  values,
}: {
  className?: string;
  color: string;
  values: number[];
}) {
  const points = buildPolylinePoints(values, 96, 26, 2);

  return (
    <svg aria-hidden="true" className={cn('h-6 w-full overflow-visible', className)} viewBox="0 0 96 28">
      <path d="M 0 22 C 18 20, 22 16, 38 18 S 60 8, 96 14" fill="none" stroke="#e2e8f0" strokeWidth="2" />
      {points ? (
        <polyline fill="none" points={points} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      ) : null}
    </svg>
  );
}

function HealthOverviewCard({
  healthRows,
  loading,
  score,
}: {
  healthRows: Array<{
    detail: string;
    latency: string;
    name: string;
    status: HealthRowStatus;
  }>;
  loading: boolean;
  score: number | null;
}) {
  return (
    <Card className={cn('overflow-hidden rounded-xl p-4 xl:h-[293px]', dashboardSurfaceClass)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <HeartPulse className="size-4" />
          系统健康状态
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/monitor">查看详情</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-8 text-sm text-muted-foreground">正在加载健康状态...</div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[168px_1fr]">
          <div className="flex items-center justify-center">
            <HealthGauge score={score} />
          </div>
          <div className="min-w-0">
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-[46%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-3">服务名称</th>
                  <th className="pb-3">状态</th>
                  <th className="pb-3">响应时间</th>
                  <th className="pb-3">说明</th>
                </tr>
              </thead>
              <tbody>
                {healthRows.map((row) => (
                  <tr className="border-t" key={row.name}>
                    <td className="truncate py-3 pr-2 font-medium text-slate-700">{row.name}</td>
                    <td className="py-3">
                      <HealthStatusPill status={row.status} />
                    </td>
                    <td className="truncate py-3 pr-2 text-slate-600">{row.latency}</td>
                    <td className="truncate py-3 text-muted-foreground">{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

function HealthGauge({ score }: { score: number | null }) {
  const normalizedScore = score === null ? 0 : Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - normalizedScore / 100);

  return (
    <div className="relative grid size-40 place-items-center">
      <svg className="absolute inset-0 size-40 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" fill="none" r="45" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          fill="none"
          r="45"
          stroke="#2fbf88"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
      <div className="relative text-center">
        <div className="text-xs font-medium text-muted-foreground">健康评分</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{score === null ? '--' : score.toFixed(1)}</div>
        <div className="mt-1 text-xs text-muted-foreground">整体健康</div>
      </div>
    </div>
  );
}

function HealthStatusPill({ status }: { status: HealthRowStatus }) {
  const label = {
    degraded: '降级',
    healthy: '正常',
    loading: '加载中',
    unavailable: '异常',
  }[status];

  const className = {
    degraded: 'text-amber-600 before:bg-amber-500',
    healthy: 'text-emerald-600 before:bg-emerald-500',
    loading: 'text-slate-500 before:bg-slate-400',
    unavailable: 'text-red-600 before:bg-red-500',
  }[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-medium before:size-2 before:rounded-full',
        className,
      )}
    >
      {label}
    </span>
  );
}

function OperationsTrendCard({
  loading,
  onWindowChange,
  points,
  windowValue,
}: {
  loading: boolean;
  onWindowChange: (value: MonitorWindow) => void;
  points: MonitorTrendPoint[];
  windowValue: MonitorWindow;
}) {
  return (
    <Card className={cn('overflow-hidden rounded-xl p-4 xl:h-[293px]', dashboardSurfaceClass)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Gauge className="size-4" />
          运行趋势（{windowLabels[windowValue]}）
        </div>
        <label className="relative">
          <select
            className="h-8 appearance-none rounded-lg border bg-background px-3 pr-8 text-xs font-medium outline-none transition-colors hover:bg-muted/40"
            onChange={(event) => onWindowChange(event.target.value as MonitorWindow)}
            value={windowValue}
          >
            <option value="24h">24 小时</option>
            <option value="7d">近 7 天</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
        <LegendDot color="bg-blue-500" label="调用量" />
        <LegendDot color="bg-amber-500" label="失败数" />
        <LegendDot color="bg-red-500" label="平均耗时 (ms)" />
      </div>

      {loading ? (
        <div className="mt-8 text-sm text-muted-foreground">正在加载运行趋势...</div>
      ) : points.length === 0 ? (
        <EmptyState description="当前窗口没有可展示的运行趋势数据。" title="暂无趋势" />
      ) : (
        <TrendChart points={points} />
      )}
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn('size-2 rounded-full', color)} />
      {label}
    </span>
  );
}

function TrendChart({ points }: { points: MonitorTrendPoint[] }) {
  const width = 690;
  const height = 250;
  const padding = { bottom: 34, left: 44, right: 48, top: 22 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxTotal = Math.max(...points.map((point) => point.total), 1);
  const maxLatency = Math.max(...points.map((point) => point.average_latency_ms), 1);
  const totalLine = buildChartPolyline(points.map((point) => point.total), maxTotal, width, height, padding);
  const failedLine = buildChartPolyline(points.map((point) => point.failed), maxTotal, width, height, padding);
  const latencyLine = buildChartPolyline(
    points.map((point) => point.average_latency_ms),
    maxLatency,
    width,
    height,
    padding,
  );
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg className="mt-2 h-[188px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      {gridLines.map((ratio) => {
        const y = padding.top + plotHeight * ratio;

        return (
          <g key={ratio}>
            <line stroke="#e5e7eb" strokeDasharray="3 5" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
          </g>
        );
      })}

      <text fill="#94a3b8" fontSize="11" x="8" y={padding.top + 4}>
        {formatCompact(maxTotal)}
      </text>
      <text fill="#94a3b8" fontSize="11" x="16" y={padding.top + plotHeight / 2 + 4}>
        {formatCompact(maxTotal / 2)}
      </text>
      <text fill="#94a3b8" fontSize="11" x="28" y={padding.top + plotHeight + 4}>
        0
      </text>
      <text fill="#94a3b8" fontSize="11" textAnchor="end" x={width - 4} y={padding.top + 4}>
        {Math.round(maxLatency)}
      </text>
      <text fill="#94a3b8" fontSize="11" textAnchor="end" x={width - 4} y={padding.top + plotHeight / 2 + 4}>
        {Math.round(maxLatency / 2)}
      </text>
      <text fill="#94a3b8" fontSize="11" textAnchor="end" x={width - 4} y={padding.top + plotHeight + 4}>
        0
      </text>

      <polyline fill="none" points={totalLine} stroke="#2f7df6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <polyline fill="none" points={failedLine} stroke="#f59e0b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <polyline fill="none" points={latencyLine} stroke="#ef4444" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

      {points.map((point, index) => {
        const x = padding.left + (points.length === 1 ? plotWidth / 2 : (plotWidth / (points.length - 1)) * index);
        const y = padding.top + plotHeight - (point.total / maxTotal) * plotHeight;

        return (
          <g key={`${point.bucket}-${index}`}>
            <circle cx={x} cy={y} fill="#2f7df6" r="3" />
            <text fill="#64748b" fontSize="11" textAnchor="middle" x={x} y={height - 8}>
              {point.bucket}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RunStepOperationsCard({
  items,
  loading,
  summary,
  windowValue,
}: {
  items: MonitorRunStepMetricItem[];
  loading: boolean;
  summary: MonitorRunStepSummary | null;
  windowValue: MonitorWindow;
}) {
  const maxStepCount = Math.max(...items.map((item) => item.step_count), 1);
  const summaryItems = summary
    ? [
        { helper: '当前窗口', label: '步骤总数', value: formatNumber(summary.steps_total) },
        { helper: '失败状态', label: '失败步骤', value: formatNumber(summary.failed_steps) },
        { helper: '模型、检索、工具', label: '平均步骤延迟', value: formatLatency(summary.average_latency_ms) },
        { helper: '模型步骤聚合', label: '步骤词元', value: formatNumber(summary.total_tokens) },
        { helper: '按步骤成本汇总', label: '步骤成本', value: formatMoney(summary.total_cost) },
      ]
    : [];

  return (
    <Card className={cn('relative z-10 overflow-hidden rounded-xl p-4', dashboardSurfaceClass)}>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Layers3 className="size-4 text-blue-600" />
            运行步骤态势
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            汇总模型、检索、工具和响应阶段的步骤指标，支持跳转到监控中心继续排查。
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={buildMonitorStepHref(windowValue)}>
            查看步骤事件
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-muted-foreground">正在加载运行步骤态势...</div>
      ) : !summary || summary.steps_total === 0 ? (
        <div className="mt-4">
          <EmptyState description="当前窗口还没有可聚合的会话运行步骤。" title="暂无步骤态势" />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-2">
            {summaryItems.map((item) => (
              <div className="rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2.5 shadow-sm" key={item.label}>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{item.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.helper}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            {items.map((item, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-slate-200/80 bg-white/70 p-3 shadow-sm"
                initial={{ opacity: 0, y: 8 }}
                key={item.step_type}
                transition={{ delay: index * 0.025, duration: 0.22, ease: 'easeOut' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusBadge tone={item.failed_count > 0 ? 'degraded' : 'healthy'}>
                      {monitorStepTypeLabel(item.step_type)}
                    </StatusBadge>
                    <span className="text-sm font-medium text-slate-800">{formatNumber(item.step_count)} 次</span>
                    <span className="text-xs text-muted-foreground">失败 {formatNumber(item.failed_count)}</span>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={buildMonitorStepHref(windowValue, item.step_type)}>
                      下钻
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500/55"
                    style={{ width: `${Math.max(8, (item.step_count / maxStepCount) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <span>平均 {formatLatency(item.average_latency_ms)}</span>
                  <span>P95 {formatLatency(item.p95_latency_ms)}</span>
                  <span>词元 {formatNumber(item.total_tokens)}</span>
                  <span>成本 {formatMoney(item.total_cost)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AgentRankingCard({
  items,
  loading,
}: {
  items: Array<{
    agent_code: string;
    agent_id: string;
    agent_name: string;
    average_latency_ms: number;
    run_count: number;
    success_rate: number;
  }>;
  loading: boolean;
}) {
  const topItems = items.slice(0, 5);
  const maxRunCount = Math.max(...topItems.map((item) => item.run_count), 1);

  return (
    <Card className={cn('overflow-hidden rounded-xl p-4 xl:h-[274px]', dashboardSurfaceClass)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bot className="size-4" />
          智能体调用排行
        </div>
        <span className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium text-muted-foreground">
          调用量
          <ChevronDown className="size-3.5" />
        </span>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-muted-foreground">正在加载智能体排行...</div>
      ) : topItems.length === 0 ? (
        <EmptyState description="当前窗口没有智能体调用记录。" title="暂无排行" />
      ) : (
        <div className="mt-2 grid gap-1.5">
          {topItems.map((item, index) => (
            <div className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3" key={item.agent_id}>
              <RankBadge index={index} />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium text-slate-800">{item.agent_name}</div>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.max(8, (item.run_count / maxRunCount) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-sm tabular-nums text-slate-700">{formatNumber(item.run_count)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 border-t pt-2 text-center">
        <Link className="text-xs font-medium text-blue-600 hover:text-blue-700" href="/agents">
          查看全部
        </Link>
      </div>
    </Card>
  );
}

function RankBadge({ index }: { index: number }) {
  const classes = [
    'bg-red-500 text-white',
    'bg-amber-400 text-amber-950',
    'bg-orange-400 text-white',
    'bg-slate-100 text-slate-600',
    'bg-slate-100 text-slate-600',
  ];

  return (
    <span className={cn('grid size-6 place-items-center rounded-md text-xs font-semibold', classes[index] ?? classes[4])}>
      {index + 1}
    </span>
  );
}

function ErrorDistributionCard({
  loading,
  segments,
  total,
}: {
  loading: boolean;
  segments: ErrorSegment[];
  total: number;
}) {
  const donutGradient = buildDonutGradient(segments);

  return (
    <Card className={cn('overflow-hidden rounded-xl p-4 xl:h-[274px]', dashboardSurfaceClass)}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="size-4" />
        错误分布（近 7 天）
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-muted-foreground">正在分析错误分布...</div>
      ) : total === 0 ? (
        <EmptyState description="当前窗口没有失败或降级样本。" title="暂无错误分布" />
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-[148px_1fr] xl:grid-cols-[148px_1fr]">
          <div className="grid place-items-center">
            <div className="relative grid size-[128px] place-items-center rounded-full" style={{ background: donutGradient }}>
              <div className="grid size-[74px] place-items-center rounded-full bg-background text-center shadow-sm">
                <div>
                  <div className="text-xs text-muted-foreground">错误总数</div>
                  <div className="text-2xl font-semibold">{formatNumber(total)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid content-center gap-3">
            {segments.map((segment) => (
              <div className="flex items-center justify-between gap-3 text-sm" key={segment.label}>
                <span className="inline-flex min-w-0 items-center gap-2 text-slate-700">
                  <span className="size-2.5 rounded-full" style={{ background: segment.color }} />
                  <span className="truncate">{segment.label}</span>
                </span>
                <span className="whitespace-nowrap text-muted-foreground">
                  {segment.count} ({formatPercent((segment.count / total) * 100)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 border-t pt-2 text-center">
        <Link className="text-xs font-medium text-blue-600 hover:text-blue-700" href="/monitor">
          查看错误日志
        </Link>
      </div>
    </Card>
  );
}

function RecentAlertsCard({ incidents, loading }: { incidents: IncidentItem[]; loading: boolean }) {
  return (
    <Card className={cn('overflow-hidden rounded-xl p-4 xl:h-[274px]', dashboardSurfaceClass)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-teal-600" />
          近期告警
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/audit">查看全部</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-muted-foreground">正在加载近期告警...</div>
      ) : incidents.length === 0 ? (
        <EmptyState description="当前窗口没有失败、降级或安全告警。" title="暂无告警" />
      ) : (
        <div className="mt-3 divide-y">
          {incidents.slice(0, 3).map((incident) => (
            <div
              className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 py-3 sm:grid-cols-[56px_minmax(0,1fr)_auto]"
              key={incident.id}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-lg border px-2.5 py-2 text-xs font-semibold',
                  severityClasses[incident.severity],
                )}
              >
                {severityLabels[incident.severity]}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-800">{incident.title}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {incident.source} · {incident.description}
                </div>
              </div>
              <div className="col-start-2 whitespace-nowrap text-xs text-muted-foreground sm:col-start-auto">
                {formatRelativeTime(incident.time)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function buildHealthRows({
  auditError,
  auditLoaded,
  auditSuccessRate,
  controlHealth,
  monitorError,
  monitorLoaded,
  runtimeHealth,
  summaryLatency,
  trendPoints,
}: {
  auditError: boolean;
  auditLoaded: boolean;
  auditSuccessRate: number | undefined;
  controlHealth: HealthResponse | null;
  monitorError: boolean;
  monitorLoaded: boolean;
  runtimeHealth: HealthResponse | null;
  summaryLatency: number | null;
  trendPoints: MonitorTrendPoint[];
}) {
  const failedTotal = sumBy(trendPoints, (point) => point.failed);
  const eventTotal = sumBy(trendPoints, (point) => point.total);
  const monitorFailureRate = eventTotal > 0 ? formatPercent((failedTotal / eventTotal) * 100) : '0.0%';
  const auditFailureRate = auditSuccessRate === undefined ? '--' : formatPercent(100 - auditSuccessRate);

  return [
    {
      detail: controlHealth?.version ? `版本 ${controlHealth.version}` : '等待控制服务返回',
      latency: '--',
      name: '控制服务 (control-api)',
      status: controlHealth?.status ?? (monitorError ? 'unavailable' : 'loading'),
    },
    {
      detail: runtimeHealth?.version ? `版本 ${runtimeHealth.version}` : '等待运行时返回',
      latency: '--',
      name: '运行时服务 (agent-runtime)',
      status: runtimeHealth?.status ?? (monitorLoaded ? 'unavailable' : 'loading'),
    },
    {
      detail: `失败率 ${monitorFailureRate}`,
      latency: formatLatency(summaryLatency),
      name: '监控聚合',
      status: monitorError ? 'unavailable' : monitorLoaded ? 'healthy' : 'loading',
    },
    {
      detail: `失败率 ${auditFailureRate}`,
      latency: '--',
      name: '审计聚合',
      status: auditError ? 'unavailable' : auditLoaded ? 'healthy' : 'loading',
    },
  ] satisfies Array<{
    detail: string;
    latency: string;
    name: string;
    status: HealthRowStatus;
  }>;
}

function calculateHealthScore({
  auditSuccessRate,
  controlHealth,
  errorCount,
  monitorSuccessRate,
  runtimeHealth,
}: {
  auditSuccessRate: number | undefined;
  controlHealth: HealthResponse | null;
  errorCount: number;
  monitorSuccessRate: number | undefined;
  runtimeHealth: HealthResponse | null;
}) {
  if (monitorSuccessRate === undefined && auditSuccessRate === undefined && !controlHealth && !runtimeHealth) {
    return null;
  }

  const baseRates = [monitorSuccessRate, auditSuccessRate].filter((value): value is number => value !== undefined);
  const base = baseRates.length > 0 ? baseRates.reduce((total, value) => total + value, 0) / baseRates.length : 92;
  const servicePenalty = [controlHealth?.status, runtimeHealth?.status].reduce((total, status) => {
    if (status === 'degraded') return total + 6;
    if (status === 'unavailable' || status === undefined) return total + 14;
    return total;
  }, 0);
  const incidentPenalty = Math.min(10, errorCount * 1.2);

  return Math.max(0, Math.min(100, base - servicePenalty - incidentPenalty));
}

function mapAuditFailureToIncident(item: AuditFailureItem): IncidentItem {
  return {
    description: item.error_message,
    id: item.event_id,
    severity: item.source_type === 'login' ? 'high' : 'medium',
    source: item.source_type === 'login' ? '登录审计' : '操作审计',
    time: item.occurred_at,
    title: item.title,
  };
}

function mapMonitorErrorToIncident(item: MonitorErrorSampleItem): IncidentItem {
  return {
    description: item.error_message,
    id: item.event_id,
    severity: item.module === 'model' ? 'high' : item.module === 'tool' ? 'medium' : 'low',
    source: monitorModuleLabel(item.module),
    time: item.occurred_at,
    title: item.title,
  };
}

function buildErrorSegments(errors: MonitorErrorSampleItem[], auditFailures: AuditFailureItem[]) {
  const segmentMap = new Map<string, ErrorSegment>([
    ['模型调用失败', { color: '#ef4444', count: 0, label: '模型调用失败' }],
    ['工具调用失败', { color: '#f59e0b', count: 0, label: '工具调用失败' }],
    ['知识库/检索错误', { color: '#2f7df6', count: 0, label: '知识库/检索错误' }],
    ['审计/认证失败', { color: '#14b8a6', count: 0, label: '审计/认证失败' }],
    ['其他错误', { color: '#94a3b8', count: 0, label: '其他错误' }],
  ]);

  for (const error of errors) {
    if (error.module === 'model') {
      incrementSegment(segmentMap, '模型调用失败');
    } else if (error.module === 'tool') {
      incrementSegment(segmentMap, '工具调用失败');
    } else if (error.module === 'knowledge') {
      incrementSegment(segmentMap, '知识库/检索错误');
    } else {
      incrementSegment(segmentMap, '其他错误');
    }
  }

  for (const failure of auditFailures) {
    if (failure.source_type === 'login') {
      incrementSegment(segmentMap, '审计/认证失败');
    } else {
      incrementSegment(segmentMap, '其他错误');
    }
  }

  return [...segmentMap.values()].filter((segment) => segment.count > 0);
}

function incrementSegment(segmentMap: Map<string, ErrorSegment>, label: string) {
  const segment = segmentMap.get(label);

  if (segment) {
    segment.count += 1;
  }
}

function buildDonutGradient(segments: ErrorSegment[]) {
  const total = sumBy(segments, (segment) => segment.count);

  if (total === 0) {
    return 'conic-gradient(#e2e8f0 0 100%)';
  }

  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    const end = cursor + (segment.count / total) * 100;
    cursor = end;

    return `${segment.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

function buildPolylinePoints(values: number[], width: number, height: number, padding = 0) {
  if (values.length === 0) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x = padding + (values.length === 1 ? innerWidth / 2 : (innerWidth / (values.length - 1)) * index);
      const y = padding + innerHeight - ((value - min) / range) * innerHeight;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildChartPolyline(
  values: number[],
  max: number,
  width: number,
  height: number,
  padding: { bottom: number; left: number; right: number; top: number },
) {
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  return values
    .map((value, index) => {
      const x = padding.left + (values.length === 1 ? plotWidth / 2 : (plotWidth / (values.length - 1)) * index);
      const y = padding.top + plotHeight - (value / max) * plotHeight;

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function sumBy<TItem>(items: TItem[], getValue: (item: TItem) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function formatDashboardMoney(value: number) {
  return `¥${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}`;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value);
}

function buildMonitorStepHref(windowValue: MonitorWindow, stepType?: MonitorRunStepMetricItem['step_type']) {
  const params = new URLSearchParams({
    source_type: 'conversation_step',
    window: windowValue,
  });

  if (stepType) {
    params.set('step_type', stepType);
  }

  return `/monitor?${params.toString()}`;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return formatDateTime(value);
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours} 小时前`;

  return `${Math.round(diffHours / 24)} 天前`;
}
