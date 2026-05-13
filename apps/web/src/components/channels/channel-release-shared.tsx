'use client';

import type { ChannelReleaseSchedulerOverview, PublishChannelListItem } from '@aiaget/shared-types';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  ChannelFocusedHeader,
  DetailGrid,
  formatNumber,
  useChannelOperationPermissions,
  type ChannelOperationMetric,
} from '@/components/channels/channel-operations-pages';
import {
  publishChannelHealthLabel,
  publishChannelHealthTone,
  publishChannelStatusLabel,
  publishChannelStatusTone,
  publishChannelTypeLabel,
} from '@/components/channels/channel-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

export const releaseSubnavItems = [
  { href: '/channels/release', label: '治理总览' },
  { href: '/channels/release/control', label: '发布控制' },
  { href: '/channels/release/pipeline', label: '发布流水线' },
  { href: '/channels/release/gate', label: '观测门禁' },
  { href: '/channels/release/automation', label: '自动推进' },
  { href: '/channels/release/self-healing', label: '发布自愈' },
  { href: '/channels/release/scheduler', label: '巡检调度' },
  { href: '/channels/release/reports', label: '复盘报告' },
];

export function ChannelReleaseHeader({
  badge,
  children,
  description,
  refreshing,
  subtitle,
  title,
  onRefresh,
}: {
  badge: string;
  children?: ReactNode;
  description: string;
  refreshing: boolean;
  subtitle: string;
  title: string;
  onRefresh: () => void;
}) {
  const permissions = useChannelOperationPermissions();

  return (
    <section className="grid gap-4">
      <ChannelFocusedHeader
        activeRoute="release"
        badge={badge}
        description={description}
        permissions={permissions}
        refreshing={refreshing}
        subtitle={subtitle}
        title={title}
        onRefresh={onRefresh}
      />
      <ChannelReleaseSubnav />
      {children}
    </section>
  );
}

export function ChannelReleaseSubnav() {
  return (
    <nav className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      {releaseSubnavItems.map((item) => (
        <Link
          className="rounded-md border bg-background/80 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
          href={item.href}
          key={item.href}
        >
          <div className="text-sm font-semibold">{item.label}</div>
        </Link>
      ))}
    </nav>
  );
}

export function ReleaseChannelPicker({
  channels,
  selectedChannel,
  onSelect,
}: {
  channels: PublishChannelListItem[];
  selectedChannel: PublishChannelListItem | null;
  onSelect: (channelId: string) => void;
}) {
  return (
    <Card className="grid gap-4 p-5">
      <PanelTitle helper="" title="治理渠道" />
      {channels.length === 0 ? (
        <EmptyState description="" title="暂无发布渠道" />
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {channels.map((channel) => (
            <button
              className={cn(
                'min-w-64 rounded-md border bg-background/90 p-3 text-left transition-colors hover:bg-muted/20',
                selectedChannel?.id === channel.id && 'border-primary/50 bg-primary/5',
              )}
              key={channel.id}
              onClick={() => onSelect(channel.id)}
              type="button"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="ready">{publishChannelTypeLabel(channel.channel)}</StatusBadge>
                <StatusBadge tone={publishChannelStatusTone(channel.status)}>{publishChannelStatusLabel(channel.status)}</StatusBadge>
                <StatusBadge tone={publishChannelHealthTone(channel.health_status)}>{publishChannelHealthLabel(channel.health_status)}</StatusBadge>
              </div>
              <div className="mt-2 truncate text-sm font-semibold">{channel.name}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{channel.agent?.name ?? '未绑定 Agent'}</div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ReleaseChannelEmpty({ title = '未选择渠道' }: { title?: string }) {
  return (
    <Card className="p-5">
      <EmptyState description="" title={title} />
    </Card>
  );
}

export function ReleaseModuleEntry({
  action,
  href,
  title,
}: {
  action?: ReactNode;
  href: string;
  title: string;
}) {
  return (
    <Card className="grid gap-3 p-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={href}>进入模块</Link>
        </Button>
        {action}
      </div>
    </Card>
  );
}

export function ReleaseSchedulerSummaryCard({ overview }: { overview: ChannelReleaseSchedulerOverview | null | undefined }) {
  return (
    <Card className="grid gap-4 p-5">
      <PanelTitle helper="" title="发布巡检调度概览" />
      {!overview ? (
        <EmptyState description="" title="暂无调度概览" />
      ) : (
        <DetailGrid
          items={[
            { label: '调度状态', value: overview.scheduler_enabled ? '启用' : '停用' },
            { label: '运行中', value: overview.running ? '是' : '否' },
            { label: '总渠道', value: formatNumber(overview.summary.total_channels) },
            { label: '自动推进候选', value: formatNumber(overview.summary.automation_enabled_channel_count) },
            { label: '自愈候选', value: formatNumber(overview.summary.self_healing_enabled_channel_count) },
            { label: '可回滚渠道', value: formatNumber(overview.summary.rollback_ready_channel_count) },
          ]}
        />
      )}
    </Card>
  );
}

export function PanelTitle({ helper, title }: { helper: string; title: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      {helper ? <p className="mt-1 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

export function buildReleaseMetrics(
  channels: PublishChannelListItem[],
  scheduler: ChannelReleaseSchedulerOverview | null | undefined,
): ChannelOperationMetric[] {
  const activeCount = channels.filter((item) => item.status === 'ACTIVE').length;
  const errorCount = channels.filter((item) => item.status === 'ERROR').length;

  return [
    { label: '治理渠道', value: formatNumber(channels.length), helper: '发布渠道范围' },
    { label: '启用渠道', value: formatNumber(activeCount), helper: 'ACTIVE' },
    { label: '异常渠道', value: formatNumber(errorCount), helper: 'ERROR' },
    {
      label: '活跃批次',
      value: formatNumber(scheduler?.summary.active_batch_channel_count),
      helper: `可回滚 ${formatNumber(scheduler?.summary.rollback_ready_channel_count)}`,
    },
  ];
}

export function releaseStatusLabel(status: string) {
  const labels: Record<string, string> = {
    CURRENT: '当前',
    DONE: '完成',
    FAILED: '失败',
    SKIPPED: '跳过',
    WAITING: '等待',
  };

  return labels[status] ?? status;
}

export function releaseStatusTone(status: string) {
  if (status === 'DONE') return 'healthy' as const;
  if (status === 'CURRENT') return 'loading' as const;
  if (status === 'FAILED') return 'unavailable' as const;
  if (status === 'SKIPPED') return 'planned' as const;

  return 'mock' as const;
}
