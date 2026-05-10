# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell and title | `apps/web/src/components/audit/audit-content.tsx` | `/audit` route | Reuse existing dashboard layout and Chinese copy. |
| Metrics | `MetricCard` in `audit-content.tsx` | `AuditOverview.summary` | Add `billing_event_total` card without changing layout pattern. |
| Filters | native input/select + `Button` in `audit-content.tsx` | `listAuditEvents` params | Add `billing` source option and richer Chinese placeholder. |
| Source labels | `apps/web/src/components/audit/audit-status.ts` | `AuditEventSourceType` | Add `billing: 计费`. |
| Event table | existing table in `audit-content.tsx` | `AuditEventListItem` | Keep compact columns; no payload details in list. |
| Detail route action | existing `Link` to `/audit/events/${event.event_id}` | `getAuditEvent` detail page | Preserve route contract. |
| IA tests | `audit-route-ia-contract.test.ts` | source file assertions | Assert billing source/search vocabulary exists. |
