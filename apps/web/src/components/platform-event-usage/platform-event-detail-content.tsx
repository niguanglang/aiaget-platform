'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

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
    <main className="mx-auto grid max-w-[1680px] gap-6 rounded-xl border border-slate-200/80 bg-white/[0.9] p-4 shadow-sm lg:p-6">
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
