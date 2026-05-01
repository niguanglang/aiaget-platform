# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `apps/web/src/app/(console)/layout.tsx`, `ConsoleShell` | existing route shell | reuse |
| Page route | `apps/web/src/app/(console)/data-scopes/page.tsx` | `/data-scopes` | new route |
| Background atmosphere | `DataScopeBackground` | visual only | R3F particle field, non-interactive |
| Metrics | `MetricCard` | `DataScopeOverview` | role/scope/custom/all counters |
| Role directory | `Card`, `Button`, search input | `listRoles`, `RoleListItem` | reuse role list contract |
| Scope matrix | `Card`, table rows, `StatusBadge` | `getRoleDataScopes`, `RoleDataScopeItem` | seven resource rows |
| Scope editor | local component in `data-scope-content.tsx` | `ReplaceRoleDataScopeInput` | scope type + custom config |
| Department selector | inline checkbox tree/list | `getDepartmentTree`, `DepartmentTreeItem` | keep compact, no new UI lib |
| User selector | checkbox list | `listUsers`, `UserListItem` | searchable paginated users |
| Preview panel | `Card`, `StatusBadge` | `previewDataScope`, `DataScopePreviewResult` | department/user sample |
| Feedback states | `EmptyState`, inline banners | React Query loading/error + mutation errors | Chinese text |
