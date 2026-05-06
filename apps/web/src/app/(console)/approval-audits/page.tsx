import { Suspense } from 'react';

import { ApprovalAuditContent } from '@/components/approval-audits/approval-audit-content';

export default function ApprovalAuditsPage() {
  return (
    <Suspense fallback={<main className="px-6 py-6 text-sm text-muted-foreground">正在加载审批审计...</main>}>
      <ApprovalAuditContent />
    </Suspense>
  );
}
