# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a Chinese SaaS admin console page.

Project context:
- Product/module: AIAget 控制台
- Page/route: 系统设置 at `/system/settings`, with legacy `/settings` still supported
- Target users/roles: 租户管理员、系统配置维护人员、安全治理人员
- Business goal: 将设置中心简化为系统参数总览、系统参数编辑和配置入口，不再混放用户、角色、API Key 管理列表
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind, shadcn-style `Card`/`Button`/`MetricCard`/`StatusBadge`
- Existing page shell/layout: 控制台侧边栏和顶部栏由 `(console)` layout 提供，页面内容为 `max-w-7xl` 的工作台布局

Interface contract that must appear in the UI:
- API/service functions: `getSystemSettingsOverview`, `listSystemSettings`, `updateSystemSetting`, `resetSystemSetting`, `previewNotificationPolicySettingChange`, `getNotificationPolicyAudit`, `listNotificationPolicySnapshots`, `rollbackNotificationPolicySnapshot`
- Main entities and fields: 系统参数总数、启用参数、敏感参数、偏离默认、分类统计、参数名称、参数 key、分类、类型、默认值、当前值、状态、更新人、更新时间
- Status values/enums: `ACTIVE` 启用, `DISABLED` 停用, `DELETED` 已删除; categories `GENERAL`, `SECURITY`, `RUNTIME`, `OBSERVABILITY`, `NOTIFICATION`, `RETENTION`, `INTEGRATION`
- User actions: 按分类筛选、按状态筛选、编辑参数值、切换启停状态、保存、恢复默认、预览通知策略影响、查看通知策略审计和版本快照、打开配置入口
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Use Chinese UI text.
- The first viewport should signal this is “系统设置”, not a user management page.
- Top area: compact title, permission badge, four metric cards for system parameter overview.
- Main IA: a configuration entry section with cards linking to `/tenants`, `/users`, `/roles`, `/api-keys`, `/security/policies`, `/storage`.
- Parameter work area: left category filter, central editable parameter cards, right governance panel.
- Keep the page quiet, dense, operational, and consistent with shadcn/Tailwind admin UI.
- Do not show embedded user tables, role lists, tenant edit forms, or API Key creation forms on this page.
- Emphasize hierarchy, spacing, alignment, and direct operational clarity.

Avoid:
- fake API fields not listed above
- decorative landing-page hero sections
- nested cards inside cards
- random charts or marketing copy
- unreadable tiny text
- actions that imply user/role/API Key CRUD inside this page
