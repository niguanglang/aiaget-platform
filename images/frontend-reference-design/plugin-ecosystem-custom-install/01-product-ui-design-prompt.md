# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform plugin ecosystem page.

Project context:
- Product/module: 企业 AIAgent 平台 / 插件生态中心
- Page/route: 插件生态中心 at `/plugins`
- Target users/roles: 租户管理员、插件管理员、安全管理员、审计员
- Business goal: 让管理员从插件市场安装插件，也可以粘贴自定义 Manifest JSON 完成插件注册、安装、权限预览、菜单/Hook/工具能力联动和审计。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn-style Card/Button/Input/StatusBadge/MetricCard/EmptyState。
- Existing page shell/layout: 企业后台控制台，顶部标题和指标卡，左侧列表表格，右侧插件详情卡，弹窗/抽屉用于安装和编辑。

Interface contract that must appear in the UI:
- API/service functions: `getPluginOverview`, `listPluginMarket`, `listPluginInstallations`, `getPluginInstallation`, `installPlugin`, `updatePluginInstallation`, `enablePlugin`, `disablePlugin`, `upgradePlugin`, `updatePluginHook`, `updatePluginMenuBinding`
- Main entities and fields: 插件名称、编码、提供方、版本、安装状态、运行状态、风险等级、权限编码、菜单数量、Hook 数量、工具能力、Manifest JSON、配置 JSON、审计记录
- Status values/enums: `PENDING_REVIEW`, `INSTALLED`, `ACTIVE`, `DISABLED`, `UPGRADING`, `FAILED`, `ARCHIVED`; runtime `RUNNING`, `STOPPED`, `UPGRADING`, `BLOCKED`, `ERROR`; risk `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- User actions: 搜索、状态筛选、风险筛选、市场安装、自定义插件、Manifest 解析预览、确认安装、编辑配置、启用、停用、升级、归档、切换菜单可见性、切换 Hook
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a production enterprise SaaS/admin product, not a marketing page.
- Use a dense but organized dashboard layout with clear table/detail/form regions.
- Show the primary workflow clearly: 自定义插件按钮 -> Manifest JSON 编辑器 -> 解析预览卡片 -> 安装确认 -> 右侧详情展示权限、菜单、Hook、工具能力、审计。
- Use subtle borders, restrained shadows, glass-like white panels, clean blue/emerald/amber status accents.
- Keep all visible UI text in Chinese.
- Avoid decorative clutter, exaggerated gradients, unreadable tiny text, and fake fields not listed above.
