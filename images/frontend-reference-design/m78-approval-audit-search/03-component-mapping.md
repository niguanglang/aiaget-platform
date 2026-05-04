# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page route | `apps/web/src/app/(console)/approval-audits/page.tsx` | route `/approval-audits` | New console page |
| Page content | `apps/web/src/components/approval-audits/approval-audit-content.tsx` | API client functions | New focused component |
| Metrics | `MetricCard` | `ApprovalAuditOverview.summary` | 5 metric cards |
| Filters | Tailwind form controls + `Button` | list query params | window/source/event/status/keyword/trace_only |
| Event table | native table + `motion.tr` | `ApprovalAuditEventItem[]` | Similar audit center table |
| Detail panel | `Card`, `StatusBadge`, JSON preview | `ApprovalAuditEventItem` | Shows metadata and jump link |
| Navigation | `moduleSpecs`, `navigation.ts` | permission `security:approval:view` | Add module key `approval_audits` |
