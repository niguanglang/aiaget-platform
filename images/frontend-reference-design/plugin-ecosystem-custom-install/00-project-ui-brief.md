# Project UI Brief

- Page: Plugin Ecosystem Custom Install
- Route: /plugins
- Feature goal: 自定义插件 Manifest 安装与生态联动
- Target users/permissions: 租户管理员、插件管理员、安全管理员；查看 `plugin:center:view`，安装 `plugin:center:install`，配置 `plugin:center:manage`，启停 `plugin:center:enable|disable`，升级 `plugin:center:upgrade`，审计 `plugin:center:audit`。
- APIs/services: `getPluginOverview`、`listPluginMarket`、`listPluginInstallations`、`getPluginInstallation`、`installPlugin`、`updatePluginInstallation`、`enablePlugin`、`disablePlugin`、`upgradePlugin`、`updatePluginHook`、`updatePluginMenuBinding`。
- Entities/fields/statuses: `PluginMarketItem`、`PluginInstallationDetail`、`PluginHookItem`、`PluginMenuBindingItem`、`PluginVersionItem`；状态 `PENDING_REVIEW/INSTALLED/ACTIVE/DISABLED/UPGRADING/FAILED/ARCHIVED`，运行态 `RUNNING/STOPPED/UPGRADING/BLOCKED/ERROR`，风险 `LOW/MEDIUM/HIGH/CRITICAL`。
- Existing components/design system: Next.js app route `/plugins`，`PluginContent` 页面；使用 Tailwind、`Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`、`motion`，背景 `PluginCenterBackground`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied。
- Primary workflow: 管理员打开插件中心 -> 选择市场插件或打开自定义插件 -> 粘贴 Manifest JSON -> 前端解析预览权限/菜单/Hook/工具/风险 -> 调用 `installPlugin` -> 后端生成安装实例、版本快照、Hook、菜单绑定、工具能力摘要和审计事件 -> 详情页查看启停、升级、菜单注入、Hook、权限预览和审计。
- Constraints: 不执行第三方任意代码；Manifest 只作为控制面声明；高风险插件在安装向导中提示安全复核；所有页面文案使用中文。
