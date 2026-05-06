import { Suspense } from 'react';

import { MonitorObservabilityContent } from '@/components/monitor/monitor-observability-content';

export default function MonitorObservabilityPage() {
  return (
    <Suspense fallback={<main className="px-6 py-6 text-sm text-muted-foreground">正在加载可观测性质量...</main>}>
      <MonitorObservabilityContent />
    </Suspense>
  );
}
