# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Extend existing security center rather than creating a new route. |
| Background | `SecurityPolicyBackground` | visual only | Reuse existing background. |
| Metrics | `MetricCard`, `StatusBadge` | `SecurityCenterOverview.metrics` | Keep existing M40 cards, add event detail signal if needed. |
| Risk cards | `SecurityCenterOverviewPanel`, `SecurityDenialCard` | `SecurityCenterOverview.recent.security_denials` | Add action to inspect full event list. |
| Event toolbar | Existing `Input`, `Button`, native `select` | `ListSecurityCenterEventsDto` | keyword/source/window/trace filters. |
| Event table | New local `SecurityEventCenterCard` | `SecurityCenterEventListItem` | Dense table with view detail button. |
| Detail drawer | New local `SecurityEventDetailDrawer` | `SecurityCenterEventDetail` | Show summary, subject/resource/context JSON. |
| JSON panels | Existing `stringifyJson` from tool JSON helper | JSON fields | Read-only monospaced blocks. |
| API client | `apps/web/src/lib/api-client.ts` | `listSecurityCenterEvents`, `getSecurityCenterEvent` | Add typed client functions. |
| Shared types | `packages/shared-types/src/index.ts` | New event list/detail interfaces | Keep source enum aligned with backend. |
| Backend | `apps/control-api/src/security-center/*` | `operation_log`, `security_policy_evaluation` | Add list/detail methods and DTO. |
| Validation | `pnpm --filter @aiaget/control-api typecheck`, `pnpm --filter @aiaget/web typecheck` | TypeScript | No service/container start. |
