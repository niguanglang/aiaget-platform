# 插件生态中心 IA Brief

## Project UI Brief

- 页面目标：把插件生态中心从单页混合操作拆为一级列表、插件详情、安装配置、安全审核、绑定配置五类页面边界。
- 路由与布局：沿用 Next App Router 控制台布局，入口为 `/plugins`，详情与配置页为 `/plugins/[pluginId]`、`/plugins/[pluginId]/installations`、`/plugins/[pluginId]/security`、`/plugins/[pluginId]/bindings`。
- 目标用户与权限：租户管理员和拥有 `plugin:center:view/manage/install/enable/disable/upgrade/uninstall/audit` 的控制台用户。无查看权限时显示中文无权限状态。
- API 契约：复用 `getPluginOverview`、`listPluginMarket`、`listPluginInstallations`、`getPluginInstallation`、`installPlugin`、`updatePluginInstallation`、`enablePlugin`、`disablePlugin`、`upgradePlugin`、`uninstallPlugin`、`updatePluginHook`、`queuePluginHookExecution`、`updatePluginMenuBinding`。
- 数据实体：`PluginMarketItem`、`PluginInstallationItem`、`PluginInstallationDetail`、`PluginMenuBindingItem`、`PluginHookItem`、`PluginVersionItem`、`PluginAuditLogItem`、`PluginSecurityPreview`、`PluginOverview`。
- 主要字段：插件名称、编码、提供方、描述、来源、安装版本、最新版本、安装状态、运行状态、风险等级、菜单数量、Hook 数量、权限数量、安装时间、Manifest、配置 JSON、安全预览、版本快照、审计记录。
- 页面职责：`/plugins` 只承担查询、筛选、概览、市场安装入口和跳转入口；Manifest 展示、安装配置、安全审核、Hook 与菜单绑定编辑分别进入独立路由。安装配置页额外承载“版本对比”，在回滚前展示当前版本与历史版本的 Manifest 差异。
- 可用组件：`PluginCenterBackground`、`Button`、`Card`、`EmptyState`、`Input`、`MetricCard`、`StatusBadge`、lucide-react 图标、React Query mutation/query 模式。
- 高影响动作：安装使用安装向导；启用、停用、升级、回滚、卸载插件必须二次确认；Hook 启停、Hook 受控入队、菜单绑定显隐、菜单绑定启停必须二次确认，并说明影响范围。Hook 受控入队只写平台事件，不直接执行第三方代码。
- 必备状态：加载、空列表、接口错误、无权限、操作中 disabled、成功提示、错误提示、表单 JSON 校验错误、只读权限禁用、确认弹窗 pending。
- 视觉约束：中文后台管理界面，信息密度适中，使用表格、指标卡、工具栏、状态徽标和分区面板；不做营销页，不新增后端接口，不把动态详情/config 路由写入菜单 seed。
