# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 插件中心页面 | `apps/web/src/components/plugins/plugin-content.tsx` | `/plugins` route | 保持市场列表和安装入口不变。 |
| 自定义插件安装弹窗 | `CustomPluginInstallDialog` in `plugin-shared.tsx` | `CreatePluginInstallationInput` | 继续使用 Manifest JSON 编辑与安装确认。 |
| 后端预检面板 | `PluginManifestValidationPanel` | `PluginManifestValidationResult` | 新增沙箱策略预检展示。 |
| 沙箱策略预检 | `PluginSandboxPolicySummary` | `sandbox_required`、`sandbox_policy` | 只展示策略声明，不执行插件代码。 |
| 包完整性 | `PackageIntegritySummary` | `package_integrity` | 保持 sha256/签名结果展示。 |
| Tool Gateway 绑定 | `ToolGatewayBindingPreview` | `tool_bindings` | 保持生成工具预览。 |
| 后端静态门禁 | `validatePluginManifestInput` in `plugin-policy.ts` | Manifest runtime/sandbox fields | 缺少 sandbox 时在包下载前失败。 |
| 共享类型 | `packages/shared-types/src/index.ts` | `PluginSandboxPolicyPreview` | 前后端共用沙箱策略返回结构。 |
