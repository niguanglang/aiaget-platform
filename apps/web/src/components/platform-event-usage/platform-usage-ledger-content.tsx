'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import {
  parsePlatformUsageWindow,
  PlatformUsageFilters,
  PlatformUsageHeader,
  uniqueOptions,
  UsageLedgerList,
} from '@/components/platform-event-usage/platform-usage-shared';
import { Notice } from '@/components/platform-event-usage/platform-usage-shared';
import { getPlatformUsageOverview, listPlatformUsageLedger } from '@/lib/api-client';

export function PlatformUsageLedgerContent() {
  const [windowValue, setWindowValue] = useState(() => parsePlatformUsageWindow(null));
  const [sourceSystem, setSourceSystem] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [metricType, setMetricType] = useState('');
  const [traceId, setTraceId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [keyword, setKeyword] = useState('');
  const normalizedTraceId = traceId.trim();
  const normalizedRequestId = requestId.trim();
  const normalizedKeyword = keyword.trim();

  const overviewQuery = useQuery({
    queryKey: ['platform-ledger-filter-overview', windowValue],
    queryFn: () => getPlatformUsageOverview({ window: windowValue }),
  });
  const ledgerQuery = useQuery({
    queryKey: ['platform-usage-ledger-page', windowValue, metricType, resourceType, sourceSystem, normalizedTraceId, normalizedRequestId, normalizedKeyword],
    queryFn: () =>
      listPlatformUsageLedger({
        window: windowValue,
        page: 1,
        page_size: 20,
        metric_type: metricType || undefined,
        resource_type: resourceType || undefined,
        source_system: sourceSystem || undefined,
        trace_id: normalizedTraceId || undefined,
        request_id: normalizedRequestId || undefined,
        keyword: normalizedKeyword || undefined,
      }),
  });

  const overview = overviewQuery.data ?? null;
  const sourceOptions = useMemo(() => uniqueOptions((overview?.recent_usage.map((item) => item.source_system).filter(Boolean) as string[] | undefined) ?? []), [overview]);
  const resourceTypeOptions = useMemo(() => uniqueOptions(overview?.recent_usage.map((item) => item.resource_type) ?? []), [overview]);
  const metricTypeOptions = useMemo(() => uniqueOptions(overview?.metric_rankings.map((item) => item.metric_type) ?? []), [overview]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <PlatformUsageHeader
        badge="用量账本"
        refreshing={overviewQuery.isFetching || ledgerQuery.isFetching}
        title="用量账本"
        onRefresh={() => {
          void overviewQuery.refetch();
          void ledgerQuery.refetch();
        }}
      />
      <Notice message={overviewQuery.isError || ledgerQuery.isError ? '用量账本加载失败。' : null} tone="error" />
      <PlatformUsageFilters
        eventType=""
        eventTypeOptions={[]}
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
          setResourceType('');
          setMetricType('');
          setTraceId('');
          setRequestId('');
          setKeyword('');
        }}
        onEventTypeChange={() => undefined}
        onKeywordChange={setKeyword}
        onMetricTypeChange={setMetricType}
        onRequestIdChange={setRequestId}
        onResourceTypeChange={setResourceType}
        onSourceSystemChange={setSourceSystem}
        onTraceIdChange={setTraceId}
        onWindowChange={setWindowValue}
      />
      <UsageLedgerList items={ledgerQuery.data?.items ?? []} loading={ledgerQuery.isLoading} />
    </main>
  );
}
