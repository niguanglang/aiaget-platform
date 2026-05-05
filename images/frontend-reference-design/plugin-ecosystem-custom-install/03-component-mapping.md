# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面头部与指标 | `apps/web/src/components/plugins/plugin-content.tsx` + `MetricCard` | `getPluginOverview`, `PluginOverview` | 复用现有插件中心头部 |
| 市场/已安装列表 | `PluginContent`, `MarketRow`, `InstallationRow` | `listPluginMarket`, `listPluginInstallations` | 增加“自定义插件”入口，不改原表格契约 |
| 自定义 Manifest 弹窗 | 新增同文件内 `CustomPluginDialog` | `installPlugin`, `CreatePluginInstallationInput` | JSON 编辑、解析预览、校验和提交 |
| 解析预览卡片 | 新增同文件 helper | Manifest 字段 `code/name/provider/version/permissions/menus/hooks/tools/config/risk_level` | 只做控制面声明预览，不执行代码 |
| 插件详情 | `PluginDetailPanel`, `VersionComparePanel`, `SecurityReviewPanel` | `getPluginInstallation`, `PluginInstallationDetail` | 保留启停、升级、菜单、Hook、权限、审计 |
| 反馈状态 | `Message`, `EmptyState`, `StatusBadge` | mutation/query error/loading | 中文错误和成功提示 |
