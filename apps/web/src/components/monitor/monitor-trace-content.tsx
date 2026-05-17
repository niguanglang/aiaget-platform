'use client';

import type { MonitorWindow } from '@aiaget/shared-types';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TraceDetailPanel } from '@/components/monitor/monitor-shared-panels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMonitorTrace } from '@/lib/api-client';

const windows: MonitorWindow[] = ['24h', '7d'];

function parseWindowParam(value: string | null): MonitorWindow {
  return windows.includes(value as MonitorWindow) ? (value as MonitorWindow) : '24h';
}

export function MonitorTraceContent({ traceId }: { traceId: string }) {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [windowValue, setWindowValue] = useState<MonitorWindow>(() => parseWindowParam(searchParams.get('window')));
  const traceQuery = useQuery({
    enabled: Boolean(traceId),
    queryKey: ['monitor-trace', traceId, windowValue],
    queryFn: () => getMonitorTrace(traceId, { window: windowValue }),
  });

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsKey);
    setWindowValue(parseWindowParam(nextParams.get('window')));
  }, [searchParamsKey]);

  return (
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm lg:p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">Trace 时间线</StatusBadge>
            <StatusBadge tone="planned">{windowValue}</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">Trace 链路</h1>
          <p className="mt-2 max-w-3xl break-all font-mono text-sm leading-6 text-muted-foreground">{traceId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border bg-background/80 px-3 text-sm" onChange={(event) => setWindowValue(event.target.value as MonitorWindow)} value={windowValue}>
            {windows.map((windowItem) => (
              <option key={windowItem} value={windowItem}>
                {windowItem}
              </option>
            ))}
          </select>
          <Button disabled={traceQuery.isLoading} onClick={() => void traceQuery.refetch()} type="button" variant="outline">
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

      {traceQuery.isError ? <Card className="p-5 text-sm text-destructive">Trace 链路加载失败。</Card> : <TraceDetailPanel loading={traceQuery.isLoading} trace={traceQuery.data ?? null} traceId={traceId} />}
    </main>
  );
}
