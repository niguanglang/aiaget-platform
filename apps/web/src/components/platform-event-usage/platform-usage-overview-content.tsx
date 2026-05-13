'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import {
  parsePlatformUsageWindow,
  PlatformEventTable,
  PlatformUsageFilters,
  PlatformUsageHeader,
  PlatformUsageSummaryCards,
  RelationList,
  RollupCard,
  UsageLedgerList,
  UsageTrendCard,
  uniqueOptions,
} from '@/components/platform-event-usage/platform-usage-shared';
import { Notice } from '@/components/platform-event-usage/platform-usage-shared';
import {
  getPlatformUsageOverview,
  listPlatformEvents,
  listPlatformUsageLedger,
  listPlatformUsageTrends,
} from '@/lib/api-client';

export function PlatformUsageOverviewContent() {
  const [windowValue, setWindowValue] = useState(() => parsePlatformUsageWindow(null));
  const [sourceSystem, setSourceSystem] = useState('');
  const [eventType, setEventType] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [metricType, setMetricType] = useState('');
  const [traceId, setTraceId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [keyword, setKeyword] = useState('');
  const normalizedTraceId = traceId.trim();
  const normalizedRequestId = requestId.trim();
  const normalizedKeyword = keyword.trim();
  const period = windowValue === '24h' ? 'hour' : 'day';

  const overviewQuery = useQuery({
    queryKey: ['platform-usage-overview-page', windowValue],
    queryFn: () => getPlatformUsageOverview({ window: windowValue }),
  });
  const eventsQuery = useQuery({
    queryKey: ['platform-events-page', windowValue, sourceSystem, eventType, resourceType, normalizedTraceId, normalizedRequestId, normalizedKeyword],
    queryFn: () =>
      listPlatformEvents({
        window: windowValue,
        page: 1,
        page_size: 20,
        source_system: sourceSystem || undefined,
        event_type: eventType || undefined,
        resource_type: resourceType || undefined,
        trace_id: normalizedTraceId || undefined,
        request_id: normalizedRequestId || undefined,
        keyword: normalizedKeyword || undefined,
      }),
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
  const ledgerQuery = useQuery({
    queryKey: ['platform-usage-ledger-page', windowValue, metricType, resourceType, sourceSystem, normalizedTraceId, normalizedRequestId, normalizedKeyword],
    queryFn: () =>
      listPlatformUsageLedger({
        window: windowValue,
        page: 1,
        page_size: 10,
        metric_type: metricType || undefined,
        resource_type: resourceType || undefined,
        source_system: sourceSystem || undefined,
        trace_id: normalizedTraceId || undefined,
        request_id: normalizedRequestId || undefined,
        keyword: normalizedKeyword || undefined,
      }),
  });

  const overview = overviewQuery.data ?? null;
  const sourceOptions = useMemo(
    () =>
      uniqueOptions([
        ...((overview?.recent_events.map((item) => item.source_system).filter(Boolean) as string[] | undefined) ?? []),
        ...((overview?.recent_usage.map((item) => item.source_system).filter(Boolean) as string[] | undefined) ?? []),
      ]),
    [overview],
  );
  const eventTypeOptions = useMemo(() => uniqueOptions(overview?.event_type_rankings.map((item) => item.event_type) ?? []), [overview]);
  const resourceTypeOptions = useMemo(
    () =>
      uniqueOptions([
        ...(overview?.recent_events.map((item) => item.resource_type) ?? []),
        ...(overview?.recent_usage.map((item) => item.resource_type) ?? []),
      ]),
    [overview],
  );
  const metricTypeOptions = useMemo(() => uniqueOptions(overview?.metric_rankings.map((item) => item.metric_type) ?? []), [overview]);
  const loadError = overviewQuery.isError || eventsQuery.isError || trendsQuery.isError || ledgerQuery.isError;

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <PlatformUsageHeader
        badge="平台事件"
        description="平台事件、用量账本、关系链路、Rollup、告警、通知和任务。"
        refreshing={overviewQuery.isFetching || eventsQuery.isFetching || trendsQuery.isFetching || ledgerQuery.isFetching}
        title="平台事件与用量底座"
        onRefresh={() => {
          void overviewQuery.refetch();
          void eventsQuery.refetch();
          void trendsQuery.refetch();
          void ledgerQuery.refetch();
        }}
      />
      <Notice message={loadError ? '平台事件与用量数据加载失败。' : null} tone="error" />
      <PlatformUsageSummaryCards loading={overviewQuery.isLoading} overview={overview} windowValue={windowValue} />
      <PlatformUsageFilters
        eventType={eventType}
        eventTypeOptions={eventTypeOptions}
        keyword={keyword}
        metricType={metricType}
        metricTypeOptions={metricTypeOptions}
        requestId={requestId}
        resourceType={resourceType}
        resourceTypeOptions={resourceTypeOptions}
        sourceOptions={sourceOptions}
        sourceSystem={sourceSystem}
        traceId={traceId}
        windowValue={windowValue}
        onClear={() => {
          setWindowValue('24h');
          setSourceSystem('');
          setEventType('');
          setResourceType('');
          setMetricType('');
          setTraceId('');
          setRequestId('');
          setKeyword('');
        }}
        onEventTypeChange={setEventType}
        onKeywordChange={setKeyword}
        onMetricTypeChange={setMetricType}
        onRequestIdChange={setRequestId}
        onResourceTypeChange={setResourceType}
        onSourceSystemChange={setSourceSystem}
        onTraceIdChange={setTraceId}
        onWindowChange={setWindowValue}
      />
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <UsageTrendCard loading={trendsQuery.isLoading} points={trendsQuery.data ?? []} />
        <RollupCard loading={overviewQuery.isLoading} items={overview?.recent_rollups ?? []} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <PlatformEventTable items={eventsQuery.data?.items ?? []} loading={eventsQuery.isLoading} total={eventsQuery.data?.total ?? 0} />
        <UsageLedgerList items={ledgerQuery.data?.items ?? []} loading={ledgerQuery.isLoading} />
      </section>
      <RelationList items={overview?.recent_relations ?? []} loading={overviewQuery.isLoading} />
    </main>
  );
}
