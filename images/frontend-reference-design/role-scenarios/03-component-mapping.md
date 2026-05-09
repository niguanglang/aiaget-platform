# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
# Component Mapping Plan

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/role-scenarios/page.tsx` | Next.js console layout | Route only renders content component |
| Background texture | `RoleScenarioBackground` | visual only | Subtle grid/mesh, no information content |
| Header/action | `role-scenarios-content.tsx` + `Button` + `Link` | `hasPermission(..., 'scenario:package:manage')` | Create button disabled without manage permission |
| Metrics | `MetricCard` | current page list result | Derived from list items and total |
| Filter toolbar | native `select`, `Input`, `Button` | `ListRoleScenariosDto` query params | keyword/type/status/priority/owner |
| Main table | `role-scenarios-content.tsx` | `RoleScenarioListItem` | Compact columns only; no full detail fields |
| Row actions | `Link`, `Button`, delete mutation | `getRoleScenario`, `updateRoleScenario`, `deleteRoleScenario` | 查看/编辑/归档 |
| Detail page | `role-scenario-detail-content.tsx` | `RoleScenarioDetail` | Full fields live here |
| Create/edit form | `RoleScenarioFormPanel` | `CreateRoleScenarioInput`, `UpdateRoleScenarioInput` | Independent routes; multi-section form |
| Asset selectors | `RoleScenarioFormPanel` | `listUsers`, `listAgents`, `listSkills`, `listKnowledgeBases`, `listTools`, `listPromptTemplates` | Optional cross-asset bindings |
| Feedback states | `EmptyState`, inline error text, loading copy | React Query loading/error | Chinese visible text |
