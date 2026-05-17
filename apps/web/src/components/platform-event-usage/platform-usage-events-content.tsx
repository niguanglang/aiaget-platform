'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  parsePlatformUsageWindow,
  PlatformEventTable,
  PlatformUsageFilters,
  PlatformUsageHeader,
  uniqueOptions,
} from '@/components/platform-event-usage/platform-usage-shared';
import { Notice } from '@/components/platform-event-usage/platform-usage-shared';
import { getPlatformUsageOverview, listPlatformEvents } from '@/lib/api-client';

export function PlatformUsageEventsContent() {
  const [windowValue, setWindowValue] = useState(() => parsePlatformUsageWindow(null));
  const [sourceSystem, setSourceSystem] = useState('');
  const [eventType, setEventType] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [traceId, setTraceId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [keyword, setKeyword] = useState('');
  const normalizedTraceId = traceId.trim();
  const normalizedRequestId = requestId.trim();
  const normalizedKeyword = keyword.trim();

  const overviewQuery = useQuery({
    queryKey: ['platform-events-filter-overview', windowValue],
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

  const overview = overviewQuery.data ?? null;
  const sourceOptions = useMemo(() => uniqueOptions((overview?.recent_events.map((item) => item.source_system).filter(Boolean) as string[] | undefined) ?? []), [overview]);
  const eventTypeOptions = useMemo(() => uniqueOptions(overview?.event_type_rankings.map((item) => item.event_type) ?? []), [overview]);
  const resourceTypeOptions = useMemo(() => uniqueOptions(overview?.recent_events.map((item) => item.resource_type) ?? []), [overview]);

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm lg:p-6">
      <PlatformUsageHeader
        badge="平台事件"
        refreshing={overviewQuery.isFetching || eventsQuery.isFetching}
        title="平台事件"
        onRefresh={() => {
          void overviewQuery.refetch();
          void eventsQuery.refetch();
        }}
      />
      <Notice message={overviewQuery.isError || eventsQuery.isError ? '平台事件加载失败。' : null} tone="error" />
      <PlatformUsageFilters
        eventType={eventType}
        eventTypeOptions={eventTypeOptions}
        keyword={keyword}
        metricType=""
        metricTypeOptions={[]}
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
          setTraceId('');
          setRequestId('');
          setKeyword('');
        }}
        onEventTypeChange={setEventType}
        onKeywordChange={setKeyword}
        onMetricTypeChange={() => undefined}
        onRequestIdChange={setRequestId}
        onResourceTypeChange={setResourceType}
        onSourceSystemChange={setSourceSystem}
        onTraceIdChange={setTraceId}
        onWindowChange={setWindowValue}
      />
      <PlatformEventTable items={eventsQuery.data?.items ?? []} loading={eventsQuery.isLoading} total={eventsQuery.data?.total ?? 0} />
    </main>
  );
}
