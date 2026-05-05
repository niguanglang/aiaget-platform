# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 插件生态中心
- Page/route: 插件生态中心 at `/plugins`
- Target users/roles: 租户管理员、插件管理员、安全审计员；权限包括 `plugin:center:view`、`plugin:center:install`、`plugin:center:manage`、`plugin:center:enable`、`plugin:center:disable`、`plugin:center:upgrade`、`plugin:center:uninstall`、`plugin:center:audit`
- Business goal: 管理插件市场和租户安装实例，并让插件安装、启停、升级、卸载清理、安全审核准入、菜单 Hook 控制和审计记录形成生产运营闭环
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn-style local components, lucide icons, motion micro-interactions, restrained React Three Fiber background
- Existing page shell/layout: console route with left navigation/top shell; page content uses max-width dashboard layout, metric cards, table, right detail panel, dialogs and side panel

Interface contract that must appear in the UI:
- API/service functions: `getPluginOverview`, `listPluginMarket`, `listPluginInstallations`, `getPluginInstallation`, `installPlugin`, `updatePluginInstallation`, `enablePlugin`, `disablePlugin`, `upgradePlugin`, `uninstallPlugin`, `updatePluginHook`, `updatePluginMenuBinding`
- Main entities and fields: plugin name/code/provider/description/source, installed/latest version, install/runtime status, risk level, permission count, menu count, hook count, manifest JSON, config JSON, security preview summary, review_required, review_status, can_enable, block_reason, audit logs, uninstall cleanup counts
- Status values/enums: `PENDING_REVIEW`, `INSTALLED`, `ACTIVE`, `DISABLED`, `UPGRADING`, `FAILED`, `ARCHIVED`; runtime `RUNNING`, `STOPPED`, `UPGRADING`, `BLOCKED`, `ERROR`; risk `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- User actions: search/filter, switch market/installed tabs, install market plugin, custom Manifest install, edit plugin config, enable/disable, upgrade, uninstall, toggle menu visibility/enabled, toggle Hook, view audit records, refresh
- Required states: loading, empty, error, validation, disabled, success, permission-denied, security blocked enable, no audit permission

Design requirements:
- Build a polished Chinese enterprise admin product screen, not a marketing page.
- Use a Bento/dashboard composition: top status header, four KPI cards, main plugin table, right detail/action panel.
- The security review area must clearly show review required/not required, review status, enable gate result, and block reason when present.
- The uninstall dialog must show generated cleanup impact: menus, Hook, tools, audit retained.
- Keep information dense but readable; use subtle borders, soft shadows, light glass panels, restrained background mesh and small 3D particle ambience that does not compete with tables.
- Buttons should use icons for refresh, details, config, power, upgrade, uninstall and close actions.
- All visible text should be Chinese and fit inside controls on desktop and mobile widths.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to existing components
- unreadable tiny text, random unrelated charts, placeholder lorem ipsum
- oversized hero section, excessive purple gradients, cheap glow, large rounded blobs, emoji
