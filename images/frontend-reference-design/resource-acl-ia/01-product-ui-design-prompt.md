# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend pages.

Project context:
- Product/module: AIAget 控制台安全治理 - Resource ACL 资源授权。
- Page/routes: resource ACL list at `/resource-acls`, create at `/resource-acls/create`, edit at `/resource-acls/[id]/edit`, simulation at `/resource-acls/check`.
- Target users/roles: 租户管理员、安全运维、平台运维；view permission can browse and simulate, manage permission can create/edit/delete/enable-disable.
- Business goal: Let operators manage object-level access rules for concrete resources and subjects without mixing list, form, and simulation workflows on one screen.
- Existing frontend stack/design system: Next.js App Router, React, Tailwind CSS, shadcn-style cards/buttons/badges, lucide icons, TanStack Query.
- Existing page shell/layout: Existing console shell; content area max width, quiet operational SaaS styling, dense but readable admin layout.

Interface contract that must appear in the UI:
- API/service functions: `getResourceAclOverview`, `listResourceAcls`, `listResourceAclOptions`, `createResourceAcl`, `getResourceAcl`, `updateResourceAcl`, `deleteResourceAcl`, `checkResourceAcl`.
- Main entities and fields: resource type/id/name/code/status, subject type/id/name/code, permission code, effect, status, conditions JSON, condition count, updated time, check decision/reason/matched rule.
- Status values/enums: effect `ALLOW`/`DENY`, status `ACTIVE`/`DISABLED`, decision `ALLOW`/`DENY`/`NO_MATCH`.
- User actions: filter by resource/subject/effect/status, create rule, edit supported fields only, delete rule, enable/disable rule inline, navigate to check with selected rule context, run simulation check.
- Required states: loading, empty, error, validation, disabled, success, permission-denied.

Design requirements:
- Show the primary workflow clearly: list rules first, then dedicated create/edit/check pages.
- On the list page, show overview metrics, compact filters, rules table, and row actions. Do not show create/edit forms or a simulation result panel inside the list surface.
- On create, make resource and subject selection clear with searchable option lists and permission/effect/status/conditions fields.
- On edit, show resource and subject as immutable summary blocks and only allow permission, effect, status, and conditions edits.
- On check, show a simulation form and result area with matched rule details.
- Use Chinese labels and professional admin copy.
- Keep cards at modest radius and avoid marketing hero composition.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to project components
- unreadable tiny text, random charts, placeholder lorem ipsum
- route-level menu entries for create/edit/check
