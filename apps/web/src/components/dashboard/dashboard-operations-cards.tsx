'use client';

import type {
  MonitorRunStepMetricItem,
  MonitorRunStepSummary,
  MonitorTrendPoint,
  MonitorWindow,
} from '@aiaget/shared-types';
import { ArrowRight, ChevronDown, Gauge, Layers3 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import {
  formatLatency,
  formatMoney,
  monitorStepTypeLabel,
} from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

import {
  buildChartPolyline,
  buildMonitorStepHref,
  dashboardSurfaceClass,
  formatCompact,
  formatNumber,
  windowLabels,
} from './dashboard-shared';

export function OperationsTrendCard({
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

export function RunStepOperationsCard({
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
