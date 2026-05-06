'use client';

import { HeartPulse } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import {
  buildPolylinePoints,
  dashboardMetricSurfaceClass,
  dashboardSurfaceClass,
  type DashboardMetric,
  type HealthRowStatus,
  metricToneClasses,
} from './dashboard-shared';

export function DashboardBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_28%_0%,rgba(59,130,246,0.14),transparent_48%),radial-gradient(ellipse_at_78%_12%,rgba(20,184,166,0.12),transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-white/80 via-slate-50/50 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
    </div>
  );
}

export function MetricTile({ loading, metric }: { loading: boolean; metric: DashboardMetric }) {
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

export function HealthOverviewCard({
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
