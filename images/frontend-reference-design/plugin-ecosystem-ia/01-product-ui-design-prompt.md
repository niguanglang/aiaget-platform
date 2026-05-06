# Product UI Design Prompt

Create a high-fidelity product UI design image for a real SaaS/admin console page.

Project context:
- Product/module: AIAget 插件生态中心
- Page/route: 插件生态 IA 拆分，primary route `/plugins` with related pages `/plugins/[pluginId]`, `/plugins/[pluginId]/installations`, `/plugins/[pluginId]/security`, `/plugins/[pluginId]/bindings`
- Target users/roles: 租户管理员 and operators with `plugin:center:*` permissions
- Business goal: 让列表页只负责插件市场、安装清单查询筛选、概览和进入详情/配置/审核/绑定的入口；把深层对象编辑放到独立页面
- Existing frontend stack/design system: Next.js App Router, React 19, Tailwind CSS tokens, React Query, local Button/Card/MetricCard/StatusBadge/EmptyState/Input components, lucide-react icons
- Existing page shell/layout: console shell with sidebar/topbar already present; page content is a max-width admin workspace with Chinese labels

Interface contract that must appear in the UI:
- API/service functions: `getPluginOverview`, `listPluginMarket`, `listPluginInstallations`, `getPluginInstallation`, `installPlugin`, `updatePluginInstallation`, `enablePlugin`, `disablePlugin`, `upgradePlugin`, `uninstallPlugin`, `updatePluginHook`, `updatePluginMenuBinding`
- Main entities and fields: market item name/code/provider/latest_version/install_status/risk_level/permission_codes/menu_count/hook_count; installation item installed_version/latest_version/status/runtime_status/risk_level/menu_count/hook_count/permission_count; detail manifest_json/config_json/permission_preview/menu_bindings/hooks/versions/audit_logs/security_preview
- Status values/enums: `PENDING_REVIEW`, `INSTALLED`, `ACTIVE`, `DISABLED`, `UPGRADING`, `FAILED`, `ARCHIVED`, `RUNNING`, `STOPPED`, `BLOCKED`, `ERROR`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- User actions: search, filter by status/risk, switch market/installed, refresh, install market plugin, open custom install dialog, navigate to detail, navigate to installation config, navigate to security review, navigate to bindings, enable/disable, upgrade, uninstall where route responsibility allows
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a production Chinese SaaS/admin product for repeated operational use.
- Use a compact toolbar with search and filters; use metric cards for total/active/pending/menu/hook counts.
- Use a table for `/plugins` with columns for 插件, 版本, 状态, 风险, 能力摘要, 入口.
- Show route entry buttons as icon+text actions: 详情, 安装配置, 安全审核, 绑定配置.
- Show detail pages as focused operational panels: manifest summary, install/config form, security policy/risk checks, hook/menu binding tables.
- Keep visual style restrained, aligned, high contrast, not decorative.
- Use Chinese interface text only.

Avoid:
- Fake backend fields not listed above
- Full manifest editor or hook/menu binding editors embedded directly in the `/plugins` list page
- Marketing hero sections, large decorative cards, random charts, unreadable tiny text
