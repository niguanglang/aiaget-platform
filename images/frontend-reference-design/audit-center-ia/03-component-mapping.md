# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console route shell | `apps/web/src/app/(console)/audit/page.tsx` | Next App Router | Keeps `/audit` as list route. |
| Event detail route shell | `apps/web/src/app/(console)/audit/events/[id]/page.tsx` | Next App Router params/searchParams | New route-level detail page, not a menu seed item. |
| List UI controller | `apps/web/src/components/audit/audit-content.tsx` | `getAuditOverview`, `listAuditEvents`, `getApprovalAuditOverview` | Remove inline `AuditDetailPanel`, `activeEventId`, and `getAuditEvent`. |
| Detail UI controller | `apps/web/src/components/audit/audit-event-detail-content.tsx` | `getAuditEvent(eventId)` | Owns single event query and detail presentation. |
| Audit background | `AuditCenterBackground` | visual only | Reuse for both routes. |
| Status/source labels | `audit-status.ts` | `AuditEventStatus`, `AuditEventSourceType`, `AuditWindow` | Reuse labels, tones, dates, percents. |
| Summary metrics | `MetricCard` | `AuditOverview.summary` | Login/operation/security/config/success rate. |
| Ranking/failure panels | local card helpers in audit module | `AuditOverview.user_rankings`, `module_rankings`, `failures` | Failure entries link to detail or filtered list where possible. |
| Filter toolbar | native input/select, `Button`, lucide `Search` | `listAuditEvents` query params | Initialize from `keyword` and `window` URL query. |
| Event table | table markup, `StatusBadge`, `Link` | `AuditEventListItem[]` | Row action links to `/audit/events/${event_id}` carrying current `window`/`keyword`. |
| Detail header/base info | `Card`, `StatusBadge`, `Button`, `Link` | `AuditEventDetail` | Chinese labels and route back link. |
| Request context | detail rows/card grid | `ip`, `user_agent`, `path`, `method`, `status_code`, `error_message` | Handle missing values as `-`. |
| Trace/subject/timeline | local sections in detail component | `request_id`, `user_email`, `module`, `action`, `occurred_at`, `request_summary` | Use supported fields only; infer timeline/related entries from available detail fields. |
| JSON details | local `JsonCard` | `request_summary` | Preserve JSON formatting and overflow handling. |
| IA contract tests | audit route/menu contract test files | file source assertions | Enforce split routes and menu seed constraints. |
