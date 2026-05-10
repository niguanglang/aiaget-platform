# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Approval export helper line | `apps/web/src/components/security/security-alerts-content.tsx` | `approvalTotal` and current filters | Extend Chinese helper copy only. |
| Export success notice | `approvalNotice` in `SecurityAlertsContent` | `exportMutation.onSuccess` | Mention CSV includes notification filter columns. |
| Export action | Existing `Button` with `exportMutation.mutate()` | `exportSecurityApprovalWorkbenchItems` | No new action or modal. |
| IA contract | `apps/web/src/components/security/security-route-ia-contract.test.ts` | Source assertions | Locks copy without expanding page responsibilities. |
| Product docs | `docs/product/m144-approval-export-filter-context-frontend-notice.md` | Milestone acceptance | Documents frontend notice scope. |
