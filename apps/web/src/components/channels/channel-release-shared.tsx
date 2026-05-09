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
  { description: '发布治理入口和关键指标', href: '/channels/release', label: '治理总览' },
  { description: '审批、灰度比例和回滚控制', href: '/channels/release/control', label: '发布控制' },
  { description: '批次、灰度、全量和回滚步骤', href: '/channels/release/pipeline', label: '发布流水线' },
  { description: '观测指标、放行率和门禁策略', href: '/channels/release/gate', label: '观测门禁' },
  { description: '自动推进策略、运行状态和最近决策', href: '/channels/release/automation', label: '自动推进' },
  { description: '异常自愈、回滚建议和冷却策略', href: '/channels/release/self-healing', label: '发布自愈' },
  { description: '周期巡检、候选渠道和运行结果', href: '/channels/release/scheduler', label: '巡检调度' },
  { description: '复盘报告、风险和快照留存', href: '/channels/release/reports', label: '复盘报告' },
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
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</div>
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
      <PanelTitle helper="子页面按当前渠道加载发布治理数据。" title="治理渠道" />
      {channels.length === 0 ? (
        <EmptyState description="当前没有可治理的发布渠道。请先创建发布渠道。" title="暂无发布渠道" />
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
      <EmptyState description="先选择一个发布渠道查看当前模块。" title={title} />
    </Card>
  );
}

export function ReleaseModuleEntry({
  action,
  description,
  href,
  title,
}: {
  action?: ReactNode;
  description: string;
  href: string;
  title: string;
}) {
  return (
    <Card className="grid gap-3 p-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
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
      <PanelTitle helper="完整巡检运行和触发操作位于巡检调度子页面。" title="发布巡检调度概览" />
      {!overview ? (
        <EmptyState description="发布巡检调度数据暂不可用。" title="暂无调度概览" />
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
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
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
