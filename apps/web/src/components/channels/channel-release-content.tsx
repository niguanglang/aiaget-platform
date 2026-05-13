'use client';

import { useQuery } from '@tanstack/react-query';

import { ChannelCenterBackground } from '@/components/channels/channel-center-background';
import {
  ChannelAlert,
  ChannelMetricGrid,
  useChannelOperationPermissions,
} from '@/components/channels/channel-operations-pages';
import {
  ChannelReleaseHeader,
  ReleaseModuleEntry,
  ReleaseSchedulerSummaryCard,
  buildReleaseMetrics,
} from '@/components/channels/channel-release-shared';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { getChannelReleaseSchedulerOverview, getPublishChannelOverview } from '@/lib/api-client';

export function ChannelReleaseContent() {
  const permissions = useChannelOperationPermissions();
  const overviewQuery = useQuery({
    enabled: permissions.canView,
    queryKey: ['channel-release-overview-entry'],
    queryFn: getPublishChannelOverview,
  });
  const schedulerQuery = useQuery({
    enabled: permissions.canView,
    queryKey: ['channel-release-scheduler-entry'],
    queryFn: getChannelReleaseSchedulerOverview,
  });

  const channels = overviewQuery.data?.channels ?? [];
  const metrics = buildReleaseMetrics(channels, schedulerQuery.data);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <ChannelCenterBackground />
      <ChannelReleaseHeader
        badge="发布治理"
        description="发布关键指标、调度概览和治理模块入口。"
        refreshing={overviewQuery.isFetching || schedulerQuery.isFetching}
        subtitle="/channels/release"
        title="发布治理总览"
        onRefresh={() => {
          void overviewQuery.refetch();
          void schedulerQuery.refetch();
        }}
      />

      <ChannelAlert message={overviewQuery.isError || schedulerQuery.isError ? '发布治理总览加载失败。' : null} tone="error" />

      {!permissions.canView ? (
        <Card className="p-5">
          <EmptyState description="当前账号缺少 channel:publish:view 权限，无法查看发布治理。" title="无权查看发布治理" />
        </Card>
      ) : (
        <>
          <ChannelMetricGrid loading={overviewQuery.isLoading || schedulerQuery.isLoading} metrics={metrics} />
          <section className="grid gap-4 xl:grid-cols-3">
            <ReleaseModuleEntry href="/channels/release/pipeline" title="发布流水线" />
            <ReleaseModuleEntry href="/channels/release/gate" title="发布观测门禁" />
            <ReleaseModuleEntry href="/channels/release/automation" title="自动推进" />
            <ReleaseModuleEntry href="/channels/release/self-healing" title="发布自愈" />
            <ReleaseModuleEntry href="/channels/release/scheduler" title="发布巡检调度" />
            <ReleaseModuleEntry href="/channels/release/reports" title="发布复盘报告" />
          </section>
          <ReleaseSchedulerSummaryCard overview={schedulerQuery.data} />
        </>
      )}
    </main>
  );
}
