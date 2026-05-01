import { Suspense } from 'react';

import { MonitorContent } from '@/components/monitor/monitor-content';

export default function MonitorPage() {
  return (
    <Suspense fallback={<main className="px-6 py-6 text-sm text-muted-foreground">正在加载监控中心...</main>}>
      <MonitorContent />
    </Suspense>
  );
}
