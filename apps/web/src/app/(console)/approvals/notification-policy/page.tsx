import { Suspense } from 'react';

import { NotificationPolicyApprovalsContent } from '@/components/approvals/notification-policy-approvals-content';

export default function NotificationPolicyApprovalsPage() {
  return (
    <Suspense fallback={<main className="px-6 py-6 text-sm text-muted-foreground">正在加载通知策略审批...</main>}>
      <NotificationPolicyApprovalsContent />
    </Suspense>
  );
}
