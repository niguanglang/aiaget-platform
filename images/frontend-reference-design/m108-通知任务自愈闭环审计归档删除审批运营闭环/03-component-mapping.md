# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security`, `SecurityPolicyContent` | Reuse existing page and query flow. |
| Approval/archive operations card | `ApprovalArchiveOperationsCard` | `SecurityCenterOverview.approval_operations` | Extend existing card, do not create a new route. |
| Existing overview metrics | `OperationMetricTile` | `tool_pending`, `notification_pending`, `archive_delete_*`, `audit_*` | Keep current card density and responsive grid. |
| M108 self-healing archive deletion section | New section inside `ApprovalArchiveOperationsCard` | `notification_task_recovery_audit_archive_delete_*` | Show pending, approved, rejected, closure/applied metrics. |
| Status badges | `StatusBadge` | Pending/rejected/applied counts | Badge text in Chinese: `M108`, `存在待审`, `拒绝复核`, `已闭环`. |
| CTA button | Existing `Button` with `Link href="/security"` | M107 approval panel lives on same route | Keep it as an in-page down-drill entry. |
| Operational alert cards | `OperationAlertCard` | `operational_alerts[]` | Backend adds M108 alert ids; existing action callbacks handle acknowledge/escalate/close. |
| Bottom summary row | Tailwind grid in `ApprovalArchiveOperationsCard` | Tool/archive/self-healing/audit counts | Add self-healing archive delete summary without changing existing actions. |
| Backend aggregation | `apps/control-api/src/security-center/security-center.service.ts` | `platform_event` M107 delete events | Add summarize/oldest helpers and build alert signals. |
| Shared contract | `packages/shared-types/src/index.ts` | `SecurityCenterOverview.approval_operations` | Add four numeric count fields. |
| Product docs | `docs/product/m108-...md`, `docs/product/README.md` | Milestone traceability | Document scope, event source, UI behavior, and boundaries. |
