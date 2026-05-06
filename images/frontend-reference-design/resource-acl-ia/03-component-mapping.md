# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/resource-acls/**/page.tsx` | Next.js console layout | Add create/edit/check route files beside the existing list route. |
| Shared visual background/status labels | `ResourceAclBackground`, `resource-acl-status.ts` | Resource ACL enums from `@aiaget/shared-types` | Reuse labels, tone helpers, date formatting. |
| Shared IA helpers | `resource-acl-shared.tsx` | `ResourceAclItem`, option summaries | Hold draft type, validation, JSON parsing, summary blocks, option lists, permission gate helpers. |
| List page header/metrics | `resource-acl-content.tsx` | `getResourceAclOverview`, `listResourceAcls` | Keep list-only overview, filters, table, row actions. |
| List filters | `resource-acl-content.tsx` | `listResourceAcls` query params | Resource type, subject type, effect, status filters; no draft, selectedAcl, or check mutation. |
| Rule table | `resource-acl-content.tsx` | `ResourceAclItem[]`, `updateResourceAcl`, `deleteResourceAcl` | Inline enable/disable via `updateResourceAcl`; edit/check are route navigation links. |
| Create form | `resource-acl-create-content.tsx` | `listResourceAclOptions`, `createResourceAcl` | Resource and subject can be selected; validates resource, subject, permission, JSON conditions. |
| Edit form | `resource-acl-edit-content.tsx` | `getResourceAcl`, `updateResourceAcl` | Resource/subject are immutable summary blocks; supports permission/effect/status/conditions only. |
| Simulation form | `resource-acl-check-content.tsx` | `listResourceAclOptions`, `checkResourceAcl` | Dedicated check route with result panel; no create/update calls. |
| API client detail | `apps/web/src/lib/api-client.ts` | `GET /resource-acls/:id` | Minimal `getResourceAcl` function if backend detail is missing. |
| Backend detail | `apps/control-api/src/resource-acls/**` | `ResourceAclsService.get`, controller `@Get(':id')` | Add only detail endpoint for edit route. |
| Menu IA contract | `apps/control-api/src/menus/resource-acl-menu-ia-contract.test.ts` | `apps/control-api/prisma/seed.ts` | Assert only `/resource-acls` is seeded as menu path; create/edit/check routes stay out of dynamic menu seed. |
