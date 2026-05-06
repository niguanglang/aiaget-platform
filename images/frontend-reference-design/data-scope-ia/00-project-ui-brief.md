# Project UI Brief

- Project/module: AIAget 控制台安全治理 - 数据权限中心。
- Page/feature goal: 将数据权限从“角色目录 + 权限矩阵 + 编辑 + 预览”单页拆成路由级列表、角色详情、角色编辑三类页面，让查看、审计和配置职责分离。
- Routes and parent layout: Next.js App Router under `apps/web/src/app/(console)` using the existing console layout. Routes are `/data-scopes`, `/data-scopes/roles/[roleId]`, and `/data-scopes/roles/[roleId]/edit`.
- Target users and permissions: 具备 `system:data_scope:view` 的安全/平台运维可查看列表、详情与只读摘要；具备 `system:data_scope:manage` 或 `tenant_admin` 角色才可进入编辑保存。`tenant_admin` 角色本身的数据权限由种子数据维护，编辑页保持禁改。
- API/service functions: `getDataScopeOverview`, `listRoleDataScopes`, `listRoles`, `getRoleDataScopes`, `getDepartmentTree`, `listUsers`, `replaceRoleDataScopes`, `previewDataScope`.
- Data entities and fields: `DataScopeOverview` metrics include role counts, scope counts, scope type counts, resource definitions. `RoleDataScopeItem` includes role identity, resource type/name, scope type/label, scope value, status, department/user/resource counts, updated time. `RoleDataScopeDetail` provides role and scopes. Preview returns hit department/user counts, sample departments/users, and note.
- Statuses/enums: resource types include Agent, Agent Team, Channel, Plugin, Knowledge Base, Document, Tool, Model, Conversation, Audit Log. Scope types are `ALL`, `TENANT`, `DEPT`, `DEPT_AND_CHILD`, `SELF`, `CUSTOM`; status is `ACTIVE`, `DISABLED`, or `DELETED`.
- Available components and UI library: React 19, Next.js 16, Tailwind CSS, existing shadcn-style `Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, `cn`, lucide icons, TanStack Query, motion/react.
- Required states and actions: list loading/empty/error, overview metrics, role keyword/status filters, scope resource/status/type filters, row links to details and edit, detail loading/empty/error and read-only matrix/summary, edit draft validation, save success/error, preview loading/result, permission-disabled controls, tenant-admin role disabled editing.
- Constraints: Chinese UI, no dynamic role detail/edit routes in menu seed, no edit/preview state in list component, no shared api-client edits unless unavoidable, no real reference images required for this batch.
