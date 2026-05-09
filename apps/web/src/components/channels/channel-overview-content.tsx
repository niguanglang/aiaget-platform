'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ClipboardList,
  FileText,
  GitBranch,
  Inbox,
  KeyRound,
  Layers3,
  RefreshCw,
  Rocket,
  Send,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

import type {
  ChannelAccountItem,
  ChannelDeliveryItem,
  ChannelOperationsListResult,
  ChannelProviderItem,
  ChannelPublishJobItem,
  PublishChannelOverview,
} from '@aiaget/shared-types';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelOperationStatusBadge,
  channelOperationStatusLabel,
  channelOperationStatusTone,
  formatLatency,
  formatNumber,
  formatOptionalDateTime,
  formatPercent,
} from '@/components/channels/channel-operations-pages';
import {
  publishChannelHealthLabel,
  publishChannelHealthTone,
  publishChannelStatusLabel,
  publishChannelStatusTone,
} from '@/components/channels/channel-status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { MetricCard } from '@/components/ui/metric-card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  getPublishChannelOverview,
  listChannelAccounts,
  listChannelDeliveries,
  listChannelProviders,
  listChannelPublishJobs,
} from '@/lib/api-client';

const overviewPageSize = 5;

const navigationItems = [
  {
    href: '/channels/publish',
    title: '发布渠道',
    description: '查看已发布 Agent 的渠道入口、启停状态和健康巡检。',
    icon: Rocket,
    badge: '渠道入口',
  },
  {
    href: '/channels/providers',
    title: '渠道提供方',
    description: '维护平台适配、能力边界、健康状态和基础供应商信息。',
    icon: Layers3,
    badge: '供应商',
  },
  {
    href: '/channels/accounts',
    title: '账号凭据',
    description: '管理供应商账号、环境归属、凭据状态和轮换节奏。',
    icon: KeyRound,
    badge: '凭据',
  },
  {
    href: '/channels/templates',
    title: '消息模板',
    description: '进入模板编码、语言、版本和启停状态的专属页面。',
    icon: FileText,
    badge: '模板',
  },
  {
    href: '/channels/route-rules',
    title: '路由规则',
    description: '维护匹配方式、目标类型、优先级和兜底策略。',
    icon: GitBranch,
    badge: '路由',
  },
  {
    href: '/channels/jobs',
    title: '发布任务',
    description: '跟踪任务进度、失败原因、取消任务和重试任务。',
    icon: ClipboardList,
    badge: '任务',
  },
  {
    href: '/channels/deliveries',
    title: '投递记录',
    description: '查看响应状态、耗时、重试次数和链路追踪。',
    icon: Truck,
    badge: '投递',
  },
  {
    href: '/channels/replies',
    title: '回复记录',
    description: '定位外部会话、回复方向、Trace 和接收处理状态。',
    icon: Inbox,
    badge: '回复',
  },
  {
    href: '/channels/sender',
    title: 'Sender 投递',
    description: '查看主动回复投递、失败重试和自动清理任务。',
    icon: Send,
    badge: 'Sender',
  },
  {
    href: '/channels/release',
    title: '发布治理',
    description: '进入发布流水线、自动推进、自愈和治理报表。',
    icon: ShieldCheck,
    badge: '治理',
  },
];

export function ChannelOverviewContent() {
  const overviewQuery = useQuery({
    queryKey: ['channel-overview-entry', 'publish-overview'],
    queryFn: getPublishChannelOverview,
  });
  const providersQuery = useQuery({
    queryKey: ['channel-overview-entry', 'providers'],
    queryFn: () => listChannelProviders({ page: 1, page_size: overviewPageSize }),
  });
  const accountsQuery = useQuery({
    queryKey: ['channel-overview-entry', 'accounts'],
    queryFn: () => listChannelAccounts({ page: 1, page_size: overviewPageSize }),
  });
  const jobsQuery = useQuery({
    queryKey: ['channel-overview-entry', 'jobs'],
    queryFn: () => listChannelPublishJobs({ page: 1, page_size: overviewPageSize }),
  });
  const deliveriesQuery = useQuery({
    queryKey: ['channel-overview-entry', 'deliveries'],
    queryFn: () => listChannelDeliveries({ page: 1, page_size: overviewPageSize }),
  });

  const queries = [overviewQuery, providersQuery, accountsQuery, jobsQuery, deliveriesQuery] as const;
  const refreshing = queries.some((query) => query.isFetching);
  const loading = queries.some((query) => query.isLoading);
  const hasError = queries.some((query) => query.isError);

  function refresh() {
    for (const query of queries) {
      void query.refetch();
    }
  }

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />

      <section className="grid gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge tone="ready">渠道运营</StatusBadge>
              <StatusBadge tone="mock">轻量总览</StatusBadge>
              <StatusBadge tone={hasError ? 'degraded' : 'healthy'}>{hasError ? '部分异常' : '数据可用'}</StatusBadge>
            </div>
            <p className="text-xs font-medium text-muted-foreground">/channels</p>
            <h1 className="mt-1 text-2xl font-semibold">渠道运营总览</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              汇总发布渠道、提供方、账号凭据、发布任务和投递记录的轻量状态；配置、详情和操作进入对应子页面处理。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={refreshing} onClick={refresh} type="button" variant="outline">
              <RefreshCw className="size-4" />
              刷新
            </Button>
            <Button asChild type="button">
              <Link href="/channels/publish">
                发布渠道
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {hasError ? <Card className="border-amber-200 p-4 text-sm text-amber-700">渠道运营摘要加载不完整，请刷新或进入子页面查看。</Card> : null}

      <OverviewMetrics
        accounts={accountsQuery.data}
        deliveries={deliveriesQuery.data}
        loading={loading}
        overview={overviewQuery.data}
        providers={providersQuery.data}
        jobs={jobsQuery.data}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <HealthSummaryCard overview={overviewQuery.data} providers={providersQuery.data} loading={overviewQuery.isLoading || providersQuery.isLoading} />
        <TaskSummaryCard jobs={jobsQuery.data} loading={jobsQuery.isLoading} />
        <DeliverySummaryCard deliveries={deliveriesQuery.data} loading={deliveriesQuery.isLoading} />
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-base font-semibold">运营入口</h2>
          <p className="mt-1 text-sm text-muted-foreground">根页只保留导航和摘要，完整列表、详情和操作工作台在子页面中完成。</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {navigationItems.map((item) => (
            <NavigationCard key={item.href} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}

function OverviewMetrics({
  accounts,
  deliveries,
  jobs,
  loading,
  overview,
  providers,
}: {
  accounts?: ChannelOperationsListResult<ChannelAccountItem>;
  deliveries?: ChannelOperationsListResult<ChannelDeliveryItem>;
  jobs?: ChannelOperationsListResult<ChannelPublishJobItem>;
  loading: boolean;
  overview?: PublishChannelOverview;
  providers?: ChannelOperationsListResult<ChannelProviderItem>;
}) {
  if (loading) {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-24 rounded-lg border bg-muted/30" key={index} />
        ))}
      </section>
    );
  }

  const failedJobs = jobs?.items.filter((item) => item.status === 'FAILED').length ?? 0;
  const failedDeliveries = deliveries?.items.filter((item) => item.status === 'FAILED').length ?? 0;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        helper={`${formatNumber(overview?.summary.active_channels)} 个启用，${formatNumber(overview?.summary.active_agent_count)} 个 Agent`}
        label="发布渠道"
        value={formatNumber(overview?.summary.total_channels)}
      />
      <MetricCard
        helper={`${formatNumber(providers?.total)} 个提供方，${formatNumber(accounts?.total)} 个账号凭据`}
        label="渠道资源"
        value={formatNumber((providers?.total ?? 0) + (accounts?.total ?? 0))}
      />
      <MetricCard
        helper={`样本失败 ${formatNumber(failedJobs)} 个`}
        label="发布任务"
        value={formatNumber(jobs?.total)}
      />
      <MetricCard
        helper={`24h 成功率 ${formatPercent(overview?.summary.success_rate_24h)}，样本失败 ${formatNumber(failedDeliveries)} 条`}
        label="投递记录"
        value={formatNumber(deliveries?.total)}
      />
    </section>
  );
}

function HealthSummaryCard({
  loading,
  overview,
  providers,
}: {
  loading: boolean;
  overview?: PublishChannelOverview;
  providers?: ChannelOperationsListResult<ChannelProviderItem>;
}) {
  const channels = overview?.channels.slice(0, 3) ?? [];
  const providerItems = providers?.items.slice(0, 2) ?? [];

  return (
    <Card className="grid gap-4 p-5">
      <SummaryHeader badge="健康摘要" title="渠道健康" />
      {loading ? (
        <SummarySkeleton />
      ) : channels.length === 0 && providerItems.length === 0 ? (
        <EmptyState className="py-8" description="当前没有可展示的渠道健康数据。" title="暂无健康数据" />
      ) : (
        <div className="grid gap-3">
          {channels.map((channel) => (
            <div className="rounded-md border bg-muted/15 p-3" key={channel.id}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={publishChannelStatusTone(channel.status)}>{publishChannelStatusLabel(channel.status)}</StatusBadge>
                <StatusBadge tone={publishChannelHealthTone(channel.health_status)}>{publishChannelHealthLabel(channel.health_status)}</StatusBadge>
                <span className="text-sm font-medium">{channel.name}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                24h 请求 {formatNumber(channel.request_count_24h)}，成功率 {formatPercent(channel.success_rate_24h)}
              </p>
            </div>
          ))}
          {providerItems.map((provider) => (
            <div className="rounded-md border bg-muted/15 p-3" key={provider.id}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={channelOperationStatusTone(provider.status)}>{channelOperationStatusLabel(provider.status)}</StatusBadge>
                <span className="text-sm font-medium">{provider.name}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                账号 {formatNumber(provider.account_count)}，模板 {formatNumber(provider.template_count)}，24h 成功率 {formatPercent(provider.success_rate_24h)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TaskSummaryCard({
  jobs,
  loading,
}: {
  jobs?: ChannelOperationsListResult<ChannelPublishJobItem>;
  loading: boolean;
}) {
  const items = jobs?.items.slice(0, 5) ?? [];

  return (
    <Card className="grid gap-4 p-5">
      <SummaryHeader badge={`${formatNumber(jobs?.total)} 个`} title="任务摘要" />
      {loading ? (
        <SummarySkeleton />
      ) : items.length === 0 ? (
        <EmptyState className="py-8" description="当前没有发布任务样本。" title="暂无发布任务" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="rounded-md border bg-muted/15 p-3" key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <ChannelOperationStatusBadge status={item.status} />
                <span className="truncate text-sm font-medium">{item.title ?? item.job_no ?? item.id}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                进度 {formatJobProgress(item)}，重试 {formatNumber(item.retry_count ?? 0)} 次，更新 {formatOptionalDateTime(item.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DeliverySummaryCard({
  deliveries,
  loading,
}: {
  deliveries?: ChannelOperationsListResult<ChannelDeliveryItem>;
  loading: boolean;
}) {
  const items = deliveries?.items.slice(0, 5) ?? [];

  return (
    <Card className="grid gap-4 p-5">
      <SummaryHeader badge={`${formatNumber(deliveries?.total)} 条`} title="投递摘要" />
      {loading ? (
        <SummarySkeleton />
      ) : items.length === 0 ? (
        <EmptyState className="py-8" description="当前没有投递记录样本。" title="暂无投递记录" />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div className="rounded-md border bg-muted/15 p-3" key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <ChannelOperationStatusBadge status={item.status} />
                <StatusBadge tone="ready">响应 {item.response_status ?? '无'}</StatusBadge>
                <span className="truncate text-sm font-medium">{item.delivery_id ?? item.id}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                耗时 {formatLatency(item.latency_ms)}，重试 {formatNumber(item.retry_count ?? 0)} 次，Trace {item.trace_id ?? '未记录'}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function NavigationCard({ item }: { item: (typeof navigationItems)[number] }) {
  const Icon = item.icon;

  return (
    <Card className="min-w-0 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
      <Link className="grid h-full gap-3" href={item.href}>
        <div className="flex items-center justify-between gap-3">
          <span className="flex size-9 items-center justify-center rounded-md border bg-background">
            <Icon className="size-4 text-primary" />
          </span>
          <StatusBadge tone="planned">{item.badge}</StatusBadge>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
        </div>
        <div className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
          进入页面
          <ArrowRight className="size-3" />
        </div>
      </Link>
    </Card>
  );
}

function SummaryHeader({ badge, title }: { badge: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <StatusBadge tone="mock">{badge}</StatusBadge>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="h-20 rounded-md border bg-muted/30" key={index} />
      ))}
    </div>
  );
}

function formatJobProgress(item: ChannelPublishJobItem) {
  const progress = item.progress_percent ?? item.progress;
  if (typeof progress === 'number' && Number.isFinite(progress)) return `${Math.round(progress)}%`;
  if (typeof item.completed_count === 'number' && typeof item.total_count === 'number' && item.total_count > 0) {
    return `${formatNumber(item.completed_count)}/${formatNumber(item.total_count)}`;
  }

  return '-';
}
