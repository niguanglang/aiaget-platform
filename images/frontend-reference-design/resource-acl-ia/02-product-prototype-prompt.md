# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend pages.

Project context:
- Page/routes: `/resource-acls`, `/resource-acls/create`, `/resource-acls/[id]/edit`, `/resource-acls/check`.
- Users/roles: 租户管理员 and security operators; `view` can list/check, `manage` can create/edit/delete/enable-disable.
- Main task flow: operator reviews resource ACL overview -> filters rules -> creates a new resource/subject rule on a dedicated route -> edits only mutable rule fields on edit route -> runs an independent simulation check route.
- API/service contract: `getResourceAclOverview`, `listResourceAcls`, `listResourceAclOptions`, `createResourceAcl`, `getResourceAcl`, `updateResourceAcl`, `deleteResourceAcl`, `checkResourceAcl`.
- Data entities and fields: `ResourceAclItem`, resource summary, subject summary, permission code, effect, status, conditions JSON, checked count, decision, reason, matched ACL.
- Actions and states: filters, row edit/delete/enable-disable/check navigation, form validation, loading, empty, error, disabled permission state, success message, check result/no-match state.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture: four route-level pages, not one page with side panels.
- List page regions: page header with create/check actions, metric strip, filter bar, resource ACL table, empty/error states.
- Create page regions: breadcrumb/back action, resource selector, subject selector, permission/effect/status/conditions form, save/cancel feedback.
- Edit page regions: immutable resource and subject summary, supported editable fields only, save feedback and destructive action separated.
- Check page regions: resource/subject selector, permission selector/input, run button, result panel with decision badge and matched rule.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
