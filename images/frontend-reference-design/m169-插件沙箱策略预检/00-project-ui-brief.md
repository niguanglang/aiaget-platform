# Project UI Brief

- Page: M169 插件沙箱策略预检
- Route: `/plugins`
- Feature goal: 自定义插件安装前展示沙箱策略门禁；如果 Manifest 声明代码入口，必须声明沙箱策略后才能继续包完整性预检和安装。
- Target users: 插件管理员、安全管理员、租户管理员。
- Permissions: 自定义插件安装需要 `plugin:center:install`；安全策略和高风险启用仍由插件安全页/后端策略控制。
- APIs/services: `POST /api/v1/plugins/manifest/validate` 返回 `PluginManifestValidationResult`；安装使用 `POST /api/v1/plugins/install`。
- Entities/fields/statuses: `sandbox_required`、`PluginSandboxPolicyPreview.status`、`isolation`、`network`、`filesystem`、`timeout_ms`、`memory_mb`、`entry`、`reason`；状态包含 `NOT_REQUIRED`、`MISSING`、`DECLARED`。
- Existing components/design system: `CustomPluginInstallDialog`、`PluginManifestValidationPanel`、`ManifestSummary`、`StatusBadge`、`Button`、shadcn/Tailwind 卡片。
- Required states: 未预检、预检中、通过、失败、结果失效、无需沙箱、缺少沙箱策略、已声明沙箱策略、安装禁用。
- Constraints: 不执行插件代码，不启动容器；仅做安装前策略预检和中文可视化。
