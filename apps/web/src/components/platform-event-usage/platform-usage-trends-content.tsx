'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import {
  parsePlatformUsageWindow,
  PlatformUsageFilters,
  PlatformUsageHeader,
  RollupCard,
  uniqueOptions,
  UsageTrendCard,
} from '@/components/platform-event-usage/platform-usage-shared';
import { Notice } from '@/components/platform-event-usage/platform-usage-shared';
import { getPlatformUsageOverview, listPlatformUsageTrends } from '@/lib/api-client';

export function PlatformUsageTrendsContent() {
  const [windowValue, setWindowValue] = useState(() => parsePlatformUsageWindow(null));
  const [resourceType, setResourceType] = useState('');
  const [metricType, setMetricType] = useState('');
  const period = windowValue === '24h' ? 'hour' : 'day';

  const overviewQuery = useQuery({
    queryKey: ['platform-trends-filter-overview', windowValue],
    queryFn: () => getPlatformUsageOverview({ window: windowValue }),
  });
  const trendsQuery = useQuery({
    queryKey: ['platform-usage-trends-page', windowValue, period, metricType, resourceType],
    queryFn: () =>
      listPlatformUsageTrends({
        window: windowValue,
        period,
        metric_type: metricType || undefined,
        resource_type: resourceType || undefined,
      }),
  });

  const overview = overviewQuery.data ?? null;
  const resourceTypeOptions = useMemo(
    () =>
      uniqueOptions([
        ...(overview?.recent_events.map((item) => item.resource_type) ?? []),
        ...(overview?.recent_usage.map((item) => item.resource_type) ?? []),
      ]),
    [overview],
  );
  const metricTypeOptions = useMemo(() => uniqueOptions(overview?.metric_rankings.map((item) => item.metric_type) ?? []), [overview]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <PlatformUsageHeader
        badge="用量趋势"
        refreshing={overviewQuery.isFetching || trendsQuery.isFetching}
        title="用量趋势"
        onRefresh={() => {
          void overviewQuery.refetch();
          void trendsQuery.refetch();
        }}
      />
      <Notice message={overviewQuery.isError || trendsQuery.isError ? '用量趋势加载失败。' : null} tone="error" />
      <PlatformUsageFilters
        eventType=""
        eventTypeOptions={[]}
        keyword=""
        metricType={metricType}
        metricTypeOptions={metricTypeOptions}
        requestId=""
        resourceType={resourceType}
        resourceTypeOptions={resourceTypeOptions}
        sourceOptions={[]}
        sourceSystem=""
        traceId=""
        windowValue={windowValue}
        onClear={() => {
          setWindowValue('24h');
          setResourceType('');
          setMetricType('');
        }}
        onEventTypeChange={() => undefined}
        onKeywordChange={() => undefined}
        onMetricTypeChange={setMetricType}
        onRequestIdChange={() => undefined}
        onResourceTypeChange={setResourceType}
        onSourceSystemChange={() => undefined}
        onTraceIdChange={() => undefined}
        onWindowChange={setWindowValue}
      />
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <UsageTrendCard loading={trendsQuery.isLoading} points={trendsQuery.data ?? []} />
        <RollupCard loading={overviewQuery.isLoading} items={overview?.recent_rollups ?? []} />
      </section>
    </main>
  );
}
