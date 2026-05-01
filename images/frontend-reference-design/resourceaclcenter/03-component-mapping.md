# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/resource-acls/page.tsx` + console layout | Route `/resource-acls` | New route under existing console shell |
| Background atmosphere | `ResourceAclBackground` | Static visual only | Reuse R3F particle style from data scope background, no blocking UI |
| Header and metrics | `ResourceAclContent`, `MetricCard`, `StatusBadge` | `ResourceAclOverview` | Four cards: 总授权、启用、允许、拒绝 |
| Filters | Inline Tailwind controls | `ListResourceAclsDto` / `listResourceAcls` | Resource type, subject type, effect, status |
| Resource/subject selector | Inline cards/selects | `ResourceAclOptionResult` | Uses actual resource and subject options from backend |
| ACL rule list | `Card`, table-like rows, `StatusBadge` | `ResourceAclItem[]` | Chinese labels; row actions edit/delete |
| Editor panel | `Card`, `Button`, `textarea`, native selects | `CreateResourceAclInput`, `UpdateResourceAclInput` | JSON conditions validation before submit |
| Simulation panel | `Card`, `StatusBadge` | `ResourceAclCheckInput`, `ResourceAclCheckResult` | DENY priority and no-match feedback |
| Empty/error/loading states | `EmptyState`, inline error blocks | React Query and mutation errors | Keep actions disabled when user lacks write permission |
| Navigation icon | `navigation.ts`, `menu-navigation.ts` | Seeded `resource_acls` menu | `KeyRound` icon |
