import { Suspense } from 'react';

import { AuditContent } from '@/components/audit/audit-content';

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">正在加载审计中心...</div>}>
      <AuditContent />
    </Suspense>
  );
}
