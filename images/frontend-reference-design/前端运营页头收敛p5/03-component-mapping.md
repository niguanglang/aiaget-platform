# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | Existing route content components under `apps/web/src/components/*/*-content.tsx` | Existing Next.js app routes | Preserve routes and data flow. |
| Header | Existing `motion.section` or plain flex header | Current permissions via `useAuth` | Remove concept badges and paragraph copy; keep title and primary action. |
| Metrics | `MetricCard` | Existing list totals and status counts | Keep compact operational metrics. |
| Filters | Existing input/select controls | Existing list query params | Keep search and filters close to table. |
| Table | Existing table markup | Existing list item types | Keep core identifying fields, state, owner, updated time and row actions. |
| Empty/error/loading | `EmptyState`, inline loading/error text | Existing query state | Empty state title only or short neutral text. |
