'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import { EventDetailPanel } from '@/components/monitor/monitor-shared-panels';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getMonitorEvent } from '@/lib/api-client';

export function MonitorEventDetailContent({ eventId }: { eventId: string }) {
  const eventQuery = useQuery({
    queryKey: ['monitor-event', eventId],
    queryFn: () => getMonitorEvent(eventId),
  });

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge tone="ready">事件详情</StatusBadge>
            <StatusBadge tone="planned">独立路由</StatusBadge>
          </div>
          <h1 className="text-2xl font-semibold">监控事件详情</h1>
          <p className="mt-2 max-w-3xl break-all text-sm leading-6 text-muted-foreground">{eventId}</p>
        </div>
        <Button asChild type="button" variant="outline">
          <Link href="/monitor">
            <ArrowLeft className="size-4" />
            返回监控
          </Link>
        </Button>
      </section>

      {eventQuery.isError ? (
        <Card className="p-5 text-sm text-destructive">事件详情加载失败。</Card>
      ) : (
        <EventDetailPanel event={eventQuery.data ?? null} loading={eventQuery.isLoading} />
      )}
    </main>
  );
}
