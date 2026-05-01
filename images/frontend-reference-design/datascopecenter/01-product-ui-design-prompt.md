# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise admin page.

Project context:
- Product/module: AIAget 企业 Agent 平台 / 系统管理
- Page/route: 数据权限中心 at `/data-scopes`
- Target users/roles: 租户管理员、安全管理员、系统管理员；只读权限 `system:data_scope:view`，保存权限 `system:data_scope:manage`
- Business goal: 按角色配置不同资源类型的数据可访问范围，形成 RBAC 后的 ABAC 数据范围治理界面
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style components, Card/Button/Input/MetricCard/StatusBadge/EmptyState, React Query, Motion, Lucide icons
- Existing page shell/layout: enterprise console shell with left navigation and topbar; content uses responsive dashboard layout, subtle border, soft shadow, backdrop-blur, restrained glass texture

Interface contract that must appear in the UI:
- API/service functions:
  - `getDataScopeOverview()`
  - `listRoles({ page, page_size, keyword, status })`
  - `getRoleDataScopes(roleId)`
  - `replaceRoleDataScopes(roleId, { scopes })`
  - `previewDataScope({ role_id, resource_type, scope_type, scope_value })`
  - `getDepartmentTree()`
  - `listUsers({ page, page_size, keyword, status, department_id })`
- Main entities and fields:
  - role list: role name, code, status, system/custom, user count, permission count
  - scope matrix: resource type, scope type, selected department count, selected user count, custom resource count, updated time
  - editor: resource type, scope type radio/segmented control, selected departments, selected users, include child departments switch, resource id textarea
  - preview: matched department count, matched user count, sample departments, sample users, policy note
- Status values/enums:
  - DataScopeType: ALL, TENANT, DEPT, DEPT_AND_CHILD, SELF, CUSTOM
  - DataScopeResourceType: AGENT, KNOWLEDGE_BASE, DOCUMENT, TOOL, MODEL, CONVERSATION, AUDIT_LOG
- User actions:
  - search and select role
  - choose resource type row
  - change data scope type
  - select custom departments and users
  - preview effective scope
  - save role data scopes
  - reset local draft
- Required states:
  - loading skeleton/quiet loading text
  - empty role state
  - API error banner
  - disabled controls without manage permission
  - validation for no role selected
  - save success feedback

Design requirements:
- Make it look like a production SaaS/admin product, not a template.
- The UI text must be Chinese.
- Use a Bento/Dashboard layout: header + metrics, then a 3-column work area.
- Left panel: role directory with search, status filter, compact role cards/table.
- Middle panel: resource scope matrix with seven rows and scope badges.
- Right panel: data scope editor and effective preview, visually connected to the selected matrix row.
- Use crisp typography, restrained color, subtle teal/blue accents, thin borders, soft shadow, glass feel.
- Include tiny operational details: last updated time, selected counts, permission-disabled state, preview result.
- Motion should be implied through hover states and smooth transitions, not flashy animation.

Avoid:
- fake API fields not listed above
- overly decorative gradient, cheap glow, emoji, huge rounded blobs
- English UI labels
- dense overloaded tables
- unrelated billing/charts that are not in the contract
