'use client';

import type { MonitorWindow } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import { ObservabilityOverviewCard, TraceSignalCards } from '@/components/monitor/monitor-shared-panels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMonitorObservabilityOverview } from '@/lib/api-client';

const windows: MonitorWindow[] = ['24h', '7d'];

function parseWindowParam(value: string | null): MonitorWindow {
  return windows.includes(value as MonitorWindow) ? (value as MonitorWindow) : '24h';
}

export function MonitorObservabilityContent() {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [windowValue, setWindowValue] = useState<MonitorWindow>(() => parseWindowParam(searchParams.get('window')));
  const observabilityQuery = useQuery({
    queryKey: ['monitor-observability', windowValue],
    queryFn: () => getMonitorObservabilityOverview({ window: windowValue }),
  });

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsKey);
    setWindowValue(parseWindowParam(nextParams.get('window')));
  }, [searchParamsKey]);

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">可观测性</StatusBadge>
            <StatusBadge tone="planned">{windowValue}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">可观测性质量</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">查看 Trace 覆盖率、孤儿事件、慢链路、错误链路和错误模块。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as MonitorWindow)} value={windowValue}>
            {windows.map((windowItem) => (
              <option key={windowItem} value={windowItem}>
                {windowItem}
              </option>
            ))}
          </select>
          <Button disabled={observabilityQuery.isLoading} onClick={() => void observabilityQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="size-4" />
            刷新
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/monitor">
              <ArrowLeft className="size-4" />
              返回监控
            </Link>
          </Button>
        </div>
      </section>

      {observabilityQuery.isError ? (
        <Card className="p-5 text-sm text-destructive">可观测性数据加载失败。</Card>
      ) : (
        <>
          <ObservabilityOverviewCard loading={observabilityQuery.isLoading} overview={observabilityQuery.data ?? null} />
          <TraceSignalCards loading={observabilityQuery.isLoading} overview={observabilityQuery.data ?? null} />
        </>
      )}
    </main>
  );
}
