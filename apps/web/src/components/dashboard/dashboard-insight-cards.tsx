'use client';

import type { MonitorAgentRankingItem } from '@aiaget/shared-types';
import { AlertTriangle, Bot, ChevronDown, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { formatPercent } from '@/components/monitor/monitor-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

import {
  buildDonutGradient,
  dashboardSurfaceClass,
  type ErrorSegment,
  formatNumber,
  formatRelativeTime,
  type IncidentItem,
  severityClasses,
  severityLabels,
} from './dashboard-shared';

export function AgentRankingCard({
  items,
  loading,
}: {
  items: MonitorAgentRankingItem[];
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

export function ErrorDistributionCard({
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

export function RecentAlertsCard({ incidents, loading }: { incidents: IncidentItem[]; loading: boolean }) {
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
