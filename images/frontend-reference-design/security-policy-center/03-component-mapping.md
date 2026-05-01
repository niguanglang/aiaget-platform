# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page route | `apps/web/src/app/(console)/security/page.tsx` | `security_policy.read` | New console page, Chinese UI |
| Navigation | `apps/web/src/config/modules.ts`, `navigation.ts` | module spec `security` | Add shield icon and route |
| Page shell | New `SecurityPolicyContent` component | `getSecurityPolicyOverview`, `listSecurityPolicies` | Reuse dense console layout |
| Metrics | `MetricCard` | `SecurityPolicyOverview` | Active, deny, resources, evaluations |
| Filters | `Input`, native select styled with Tailwind | list query DTO | keyword/status/effect/resource_type |
| Policy table | `Card`, `StatusBadge`, `Button` | `SecurityPolicyListItem` | No extra table component exists |
| Create/edit form | Inline modal panel using existing Card/Button/Input | create/update DTO + Zod | Conditions edited as JSON textarea |
| Simulation panel | `Card`, `Input`, `Button`, `StatusBadge` | `simulateSecurityPolicy` | Subject/resource/action/context JSON |
| Evaluation logs | `Card`, `StatusBadge`, `Button` | `SecurityPolicyEvaluationItem` | Recent 20 logs |
| Empty/error/loading | `EmptyState`, disabled buttons, text banners | React Query state | Match existing page patterns |
