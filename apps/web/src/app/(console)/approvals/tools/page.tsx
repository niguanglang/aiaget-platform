import { Suspense } from 'react';

import { ToolApprovalsContent } from '@/components/approvals/tool-approvals-content';

export default function ToolApprovalsPage() {
  return (
    <Suspense fallback={<main className="px-6 py-6 text-sm text-muted-foreground">正在加载高危工具审批...</main>}>
      <ToolApprovalsContent />
    </Suspense>
  );
}
