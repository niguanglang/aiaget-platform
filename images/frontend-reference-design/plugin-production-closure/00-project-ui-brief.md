# Project UI Brief

- Page: Plugin Production Closure
- Route: `/plugins`，实际页面文件为 `apps/web/src/app/(console)/plugins/page.tsx`，渲染 `PluginContent`。
- Feature goal: 在现有插件生态中心内补齐插件卸载、生成物清理、安全启用准入和中文操作反馈，确保插件市场、安装实例、菜单 Hook、版本与审计形成生产闭环。
- Target users and permissions: 租户管理员、插件管理员、安全审计员。页面由 `plugin:center:view` 控制可见性，安装、配置、启用、停用、升级、卸载、审计分别使用 `plugin:center:install/manage/enable/disable/upgrade/uninstall/audit`。
- APIs/services: `getPluginOverview`、`listPluginMarket`、`listPluginInstallations`、`getPluginInstallation`、`installPlugin`、`updatePluginInstallation`、`enablePlugin`、`disablePlugin`、`upgradePlugin`、`uninstallPlugin`、`updatePluginHook`、`updatePluginMenuBinding`。后端对应 `/plugins/overview`、`/plugins/market`、`/plugins/installations`、`/plugins/:pluginId`、`/plugins/install`、`/plugins/:pluginId/enable|disable|upgrade`、`DELETE /plugins/:pluginId`、Hook 和菜单绑定 PATCH 接口。
- Entities/fields/statuses: `PluginMarketItem`、`PluginInstallationItem`、`PluginInstallationDetail`、`PluginSecurityPreview`、`PluginUninstallResult`；状态包括 `PENDING_REVIEW`、`INSTALLED`、`ACTIVE`、`DISABLED`、`UPGRADING`、`FAILED`、`ARCHIVED`，运行态包括 `RUNNING`、`STOPPED`、`UPGRADING`、`BLOCKED`、`ERROR`，风险等级包括 `LOW`、`MEDIUM`、`HIGH`、`CRITICAL`。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、`motion/react`、lucide 图标、现有 `Button`、`Card`、`EmptyState`、`Input`、`MetricCard`、`StatusBadge`，并复用 `PluginCenterBackground` 的克制 3D 粒子背景。
- Required states: loading, empty, error, validation, disabled, success, permission-denied。重点状态为安全审查阻断启用、无审计权限隐藏审计、无安装实例空态、JSON Manifest 校验失败、卸载清理结果反馈。
- Constraints: 页面文字必须中文；不新增中间件、容器或运行第三方插件代码；视觉保持企业 SaaS 后台密度和清晰层级，避免过度渐变、夸张发光和信息过满。
