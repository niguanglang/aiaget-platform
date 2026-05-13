'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import {
  parsePlatformUsageWindow,
  PlatformUsageHeader,
  PlatformUsageSummaryCards,
  RelationList,
  RollupCard,
} from '@/components/platform-event-usage/platform-usage-shared';
import { Notice } from '@/components/platform-event-usage/platform-usage-shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getPlatformUsageOverview } from '@/lib/api-client';

export function PlatformUsageOverviewContent() {
  const windowValue = parsePlatformUsageWindow(null);

  const overviewQuery = useQuery({
    queryKey: ['platform-usage-overview-page', windowValue],
    queryFn: () => getPlatformUsageOverview({ window: windowValue }),
  });

  const overview = overviewQuery.data ?? null;
  const loadError = overviewQuery.isError;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <PlatformUsageHeader
        badge="平台事件"
        refreshing={overviewQuery.isFetching}
        title="事件总览"
        onRefresh={() => {
          void overviewQuery.refetch();
        }}
      />
      <Notice message={loadError ? '平台事件与用量数据加载失败。' : null} tone="error" />
      <PlatformUsageSummaryCards loading={overviewQuery.isLoading} overview={overview} windowValue={windowValue} />
      <section className="grid gap-4 md:grid-cols-3">
        <RouteCard href="/monitor/platform-usage/events" title="平台事件" value={`${overview?.summary.event_count ?? 0}`} />
        <RouteCard href="/monitor/platform-usage/ledger" title="用量账本" value={`${overview?.summary.usage_count ?? 0}`} />
        <RouteCard href="/monitor/platform-usage/trends" title="用量趋势" value={`${overview?.metric_rankings.length ?? 0}`} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <RollupCard loading={overviewQuery.isLoading} items={overview?.recent_rollups ?? []} />
        <RelationList items={overview?.recent_relations ?? []} loading={overviewQuery.isLoading} />
      </section>
    </main>
  );
}

function RouteCard({ href, title, value }: { href: string; title: string; value: string }) {
  return (
    <Card className="grid gap-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
        <Button asChild type="button" variant="outline">
          <Link href={href}>查看</Link>
        </Button>
      </div>
    </Card>
  );
}
