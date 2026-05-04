# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing security center page |
| SLA overview query | `apps/web/src/lib/api-client.ts` | `GET /security-center/operation-alert-sla/overview` | TanStack Query |
| Manual escalation scan | `apps/web/src/lib/api-client.ts` | `POST /security-center/operation-alert-sla/run-escalation` | Mutation |
| Backend SLA service | New `SecurityOperationAlertSlaService` | `platform_event` + `system_setting` | No new table |
| Backend controller | `SecurityCenterController` | SLA endpoints | Secured by `security:rule:view` |
| Shared types | `packages/shared-types/src/index.ts` | `SecurityOperationAlertSlaOverview` and run result | Used by web and control API |
| SLA card | New `OperationAlertSlaCard` inside security page | SLA overview response | `MetricCard`, `StatusBadge`, `EmptyState`, `Button` |
| SLA row/list | New local row component | SLA item fields | Compact list/table for due and overdue state |
| Product docs | `docs/product/m88-approval-archive-alert-sla-escalation.md` | milestone acceptance | Link from product README |
