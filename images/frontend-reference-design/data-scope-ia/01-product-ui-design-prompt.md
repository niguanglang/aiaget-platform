# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page set.

Project context:
- Product/module: AIAget 控制台安全治理 - 数据权限中心
- Page/routes: `/data-scopes`, `/data-scopes/roles/[roleId]`, `/data-scopes/roles/[roleId]/edit`
- Target users/roles: 安全运维、平台管理员、租户管理员；view users can inspect, manage users can edit, `tenant_admin` role scopes are read-only
- Business goal: separate role data-scope discovery, read-only audit, and configuration workflows into clear route-level pages
- Existing frontend stack/design system: Next.js App Router, React, TanStack Query, Tailwind CSS, shadcn-style cards/buttons/status badges, lucide icons, restrained admin console styling
- Existing page shell/layout: current console layout, max-width content area, compact operational SaaS density, Chinese UI

Interface contract that must appear in the UI:
- API/service functions: `getDataScopeOverview`, `listRoleDataScopes`, `listRoles`, `getRoleDataScopes`, `getDepartmentTree`, `listUsers`, `replaceRoleDataScopes`, `previewDataScope`
- Main entities and fields: overview metrics, role name/code/status/user count/permission count/system flag, resource type/name, scope type/label/status, department/user/resource counts, updated time, preview hit counts and note
- Status values/enums: scope types `ALL`, `TENANT`, `DEPT`, `DEPT_AND_CHILD`, `SELF`, `CUSTOM`; statuses `ACTIVE`, `DISABLED`, `DELETED`; resource types Agent, Agent Team, Channel, Plugin, Knowledge Base, Document, Tool, Model, Conversation, Audit Log
- User actions: filter role directory, filter scope records, open detail, open edit, reset draft, save scopes, run preview
- Required states: loading, empty, error, disabled, success, permission-denied, tenant-admin read-only notice

Design requirements:
- Show `/data-scopes` as an overview and role/scope list page only, with metric cards, filters, compact tables/cards, and route links for details/editing.
- Show role detail as read-only: role summary, resource matrix, scope value summary, and static preview/impact summary derived from current scopes.
- Show role edit as the only form route: resource matrix selector, scope type segmented choices, custom department/user/resource selectors, preview panel, save/reset controls, and tenant-admin disabled state.
- Use realistic Chinese labels and production admin density; keep it quiet, scannable, and aligned to existing Tailwind/shadcn conventions.

Avoid:
- route menu entries for `/data-scopes/roles/[roleId]` or edit
- invented API fields, unrelated charts, marketing hero sections, decorative cards, unreadable tiny text
- putting edit or preview controls on the list page
