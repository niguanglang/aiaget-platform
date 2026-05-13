'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { MonitorCenterBackground } from '@/components/monitor/monitor-center-background';
import {
  PlatformEventDetailPanel,
  PlatformUsageHeader,
} from '@/components/platform-event-usage/platform-usage-shared';
import { Button } from '@/components/ui/button';
import { getPlatformEvent } from '@/lib/api-client';

export function PlatformEventDetailContent({ eventId }: { eventId: string }) {
  const detailQuery = useQuery({
    queryKey: ['platform-event-detail-page', eventId],
    queryFn: () => getPlatformEvent(eventId),
  });

  return (
    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:px-6">
      <MonitorCenterBackground />
      <PlatformUsageHeader
        badge="事件详情"
        refreshing={detailQuery.isFetching}
        title="平台事件详情"
        onRefresh={() => void detailQuery.refetch()}
      >
        <Button asChild type="button" variant="outline">
          <Link href="/monitor/platform-usage">返回底座总览</Link>
        </Button>
      </PlatformUsageHeader>
      <PlatformEventDetailPanel detail={detailQuery.data ?? null} loading={detailQuery.isLoading} />
    </main>
  );
}
