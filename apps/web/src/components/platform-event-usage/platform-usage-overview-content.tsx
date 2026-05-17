'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

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
import {
  getPlatformUsageOverview,
  listPlatformEvents,
  listPlatformUsageLedger,
  listPlatformUsageTrends,
} from '@/lib/api-client';

export function PlatformUsageOverviewContent() {
  const windowValue = parsePlatformUsageWindow(null);

  const overviewQuery = useQuery({
    queryKey: ['platform-usage-overview-page', windowValue],
    queryFn: () => getPlatformUsageOverview({ window: windowValue }),
  });
  const eventPreviewQuery = useQuery({
    queryKey: ['platform-usage-overview-events-preview', windowValue],
    queryFn: () => listPlatformEvents({ page: 1, page_size: 1, window: windowValue }),
  });
  const trendPreviewQuery = useQuery({
    queryKey: ['platform-usage-overview-trends-preview', windowValue],
    queryFn: () => listPlatformUsageTrends({ period: 'day', window: windowValue }),
  });
  const ledgerPreviewQuery = useQuery({
    queryKey: ['platform-usage-overview-ledger-preview', windowValue],
    queryFn: () => listPlatformUsageLedger({ page: 1, page_size: 1, window: windowValue }),
  });

  const overview = overviewQuery.data ?? null;
  const loadError = overviewQuery.isError || eventPreviewQuery.isError || trendPreviewQuery.isError || ledgerPreviewQuery.isError;
  const refreshing = overviewQuery.isFetching || eventPreviewQuery.isFetching || trendPreviewQuery.isFetching || ledgerPreviewQuery.isFetching;

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm lg:p-6">
      <PlatformUsageHeader
        badge="平台事件"
        refreshing={refreshing}
        title="事件总览"
        onRefresh={() => {
          void overviewQuery.refetch();
          void eventPreviewQuery.refetch();
          void trendPreviewQuery.refetch();
          void ledgerPreviewQuery.refetch();
        }}
      />
      <Notice message={loadError ? '平台事件与用量数据加载失败。' : null} tone="error" />
      <PlatformUsageSummaryCards loading={overviewQuery.isLoading} overview={overview} windowValue={windowValue} />
      <section className="grid gap-4 md:grid-cols-3">
        <RouteCard href="/monitor/platform-usage/events" title="平台事件" value={`${eventPreviewQuery.data?.total ?? overview?.summary.event_count ?? 0}`} />
        <RouteCard href="/monitor/platform-usage/ledger" title="用量账本" value={`${ledgerPreviewQuery.data?.total ?? overview?.summary.usage_count ?? 0}`} />
        <RouteCard href="/monitor/platform-usage/trends" title="用量趋势" value={`${trendPreviewQuery.data?.length ?? overview?.metric_rankings.length ?? 0}`} />
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
