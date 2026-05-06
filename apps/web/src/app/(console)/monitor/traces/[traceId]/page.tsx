import { Suspense } from 'react';

import { MonitorTraceContent } from '@/components/monitor/monitor-trace-content';

export default async function MonitorTracePage({ params }: { params: Promise<{ traceId: string }> }) {
  const { traceId } = await params;

  return (
    <Suspense fallback={<main className="px-6 py-6 text-sm text-muted-foreground">正在加载 Trace 链路...</main>}>
      <MonitorTraceContent traceId={traceId} />
    </Suspense>
  );
}
