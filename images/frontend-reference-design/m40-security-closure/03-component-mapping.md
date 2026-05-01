# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `SecurityPolicyContent` | `/security` route | Reuse existing security page content. |
| Background | `SecurityPolicyBackground` | visual only | Keep as restrained ambient element. |
| Posture score | `SecurityCenterOverviewPanel` | `SecurityCenterOverview.posture` | Extend existing panel, no route change. |
| Guard chain strip | Existing strip inside `SecurityCenterOverviewPanel` | `posture.guard_chain` | Chinese labels and compact horizontal layout. |
| Closure metrics | `MetricCard`, `StatusBadge`, `Card` | `SecurityCenterOverview.metrics` | Add list filter, ACL condition, policy denial metrics. |
| Recent denial events | New panel inside security overview | `SecurityCenterOverview.recent.security_denials` | Derived from operation logs and policy evaluations. |
| Governance modules | Existing module cards | `SecurityCenterModuleSummary[]` | Keep current card grid. |
| Policy table | Existing policy table region | `listSecurityPolicies` | No schema change required. |
| Simulator | Existing simulator panel | `simulateSecurityPolicy` | Keep current workflow. |
| Evaluation log | Existing evaluation log table | `listSecurityPolicyEvaluations` | Shows Guard writes and simulator writes. |

## Validation

- `pnpm --filter @aiaget/shared-types typecheck`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
