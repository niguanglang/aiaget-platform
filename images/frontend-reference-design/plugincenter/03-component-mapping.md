# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面路由 | `apps/web/src/app/(console)/plugins/page.tsx` | 无直接 API | 控制台路由 `/plugins`，渲染 `PluginContent`。 |
| 页面主体 | `apps/web/src/components/plugins/plugin-content.tsx` | `PluginOverview`、`PluginMarketItem`、`PluginInstallationItem`、`PluginInstallationDetail` | 负责查询、筛选、权限判断、变更操作和右侧详情。 |
| 背景氛围 | `PluginCenterBackground` | 无 | 使用 React Three Fiber 粒子/线框元素，透明度低，不承载业务信息。 |
| 指标卡 | `MetricCard` | `GET /plugins/overview` | 插件总数、启用、待审核、菜单注入。 |
| 市场/已安装分段 | 原生 button + Tailwind | `listPluginMarket`、`listPluginInstallations` | 切换 `market` / `installed` 两种表格数据。 |
| 搜索与筛选 | `Input` 风格原生输入、select、`Button` | 前端本地过滤 | 关键字、安装状态、风险等级；保持无后端分页依赖。 |
| 插件表格 | `MarketRow`、`InstallationRow` | `PluginMarketItem`、`PluginInstallationItem` | 表格列对应真实类型字段，操作按钮按权限禁用。 |
| 状态与风险徽标 | `StatusBadge` + `plugin-status.ts` | `PluginInstallationStatus`、`PluginRuntimeStatus`、`PluginRiskLevel`、`PluginHookStatus` | 统一中文标签和 tone 映射。 |
| 详情面板 | `PluginDetailPanel` | `GET /plugins/:pluginId` | 展示版本、安全预览、菜单注入、Hook、权限、审计。 |
| 菜单注入控制 | `Button` icon-only | `PATCH /plugins/:pluginId/menu-bindings/:bindingId` | 控制 visible/enabled，后端记录审计和平台事件。 |
| Hook 控制 | `Button` | `PATCH /plugins/:pluginId/hooks/:hookId` | ACTIVE/DISABLED 切换，后端记录审计和平台事件。 |
| 编辑抽屉 | `EditPluginPanel` | `PATCH /plugins/:pluginId`、`UpdatePluginInstallationInput` | 修改名称、描述、状态、运行状态、风险、版本、配置 JSON。 |
| 空/错/无权限 | `EmptyState`、`Message` | 查询错误、权限数组 | 无 `plugin:center:view` 显示无权限；详情失败通常来自资源授权/数据范围或插件不存在。 |
| 后端权限链路 | `plugins.controller.ts` | `JwtAuthGuard`、`PermissionsGuard`、`DataScopeGuard`、`ResourceAclGuard`、`SecurityPolicyGuard` | 页面权限、动作权限、数据范围、资源级授权、安全策略闭环。 |
| 后端数据范围 | `plugins.service.ts` | `DataScopeQueryService.buildWhere('PLUGIN')` | 概览、市场、安装列表按当前用户插件数据范围过滤。 |
| 数据库表 | `schema.prisma` / `20260502113000_m63_plugin_ecosystem` | `plugin`、`plugin_version`、`plugin_installation`、`plugin_hook`、`plugin_menu_binding`、`plugin_audit_log` | 每张表和字段均有 PostgreSQL 注释。 |
