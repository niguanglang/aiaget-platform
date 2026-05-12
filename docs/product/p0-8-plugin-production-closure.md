# P0-8 插件生态生产闭环

## 现有能力盘点

- 插件定义：`plugin`、`plugin_version`、`plugin_installation`、`plugin_hook`、`plugin_menu_binding`、`plugin_audit_log` 已在 Control API Prisma schema 中落地；Manifest 会保存到插件与安装实例。
- 安装/启用：`POST /plugins/install` 安装并同步权限、Hook、菜单和工具；`POST /plugins/:pluginId/enable|disable|upgrade|rollback` 管理运行态、升级和回滚；`DELETE /plugins/:pluginId` 软删除安装实例、生成菜单、Hook 和工具。
- 权限：控制器使用 `JwtAuthGuard`、`PermissionsGuard`、`DataScopeGuard`、`ResourceAclGuard`、`SecurityPolicyGuard`；插件资源权限码覆盖 `view/install/manage/enable/disable/upgrade/uninstall/audit`。
- 工具绑定：Manifest 的 `tools/actions/capabilities` 会生成 `plugin_tool_<plugin>_<tool>` 工具编码并写入 Tool Center 的 `tool` 表；后续执行仍复用 `ToolGatewayService` 的审批、限流、重试、安全策略和调用日志边界。
- 审计：安装、Manifest 同步、更新、启停、升级、卸载、Hook 更新、菜单绑定更新写 `plugin_audit_log`；高风险启用阻断和主要生命周期动作写 `platform_event`。
- Hook 执行边界：`POST /plugins/:pluginId/hooks/:hookId/execute` 只在控制面校验安装实例和 Hook 状态，并写入 `plugin.hook.execution.queued` 平台事件；随后由 `PluginHookWorkflowService` 派发 Runtime/Temporal 工作流，Runtime 内部回调通过已生成的 Tool Center 工具执行，控制面不执行第三方代码、不发起外部 HTTP、不运行脚本。
- 前端入口：`/plugins` 已存在插件生态中心，支持市场、安装实例、详情、启停升级、卸载确认、Hook、菜单绑定、权限预览、后端完整性预检和审计展示。
- 后端接口：`GET /plugins/overview|market|installations|:pluginId`、`POST /plugins/install`、`POST /plugins/manifest/validate`、`PATCH /plugins/:pluginId`、`POST /plugins/:pluginId/enable|disable|upgrade|rollback`、`DELETE /plugins/:pluginId`、`PATCH /plugins/:pluginId/hooks/:hookId`、`POST /plugins/:pluginId/hooks/:hookId/execute`、`PATCH /plugins/:pluginId/menu-bindings/:bindingId`。

## 本轮 P0 补齐

1. Manifest 校验契约：新增 `PluginManifestValidationResult`，返回安装包来源、sha256、签名存在性、权限、菜单、Hook、Tool Gateway 工具绑定预览、包完整性结果、错误和警告。
2. 自定义插件来源门禁：`source_type=CUSTOM` 时，安装前必须声明 `package.source_url`、64 位十六进制 `package.sha256` 和 `package.signature`；失败时 `POST /plugins/install` 不写插件记录。
3. 失败状态可查：Manifest 校验失败会写 `platform_event`，事件类型为 `plugin.manifest.validation_failed`，状态为 `FAILED`，payload 保存完整校验结果。
4. 后端契约入口：新增 `POST /plugins/manifest/validate`，允许控制台或集成方在安装前拿到同一套校验结果。
5. 权限闭环：补齐 `plugin:center:uninstall` 在插件数据范围、资源 ACL 资源定义和 seed 默认插件 ACL 中的覆盖，避免卸载动作只在控制器权限码中存在。
6. 真实完整性校验：新增 `PluginPackageIntegrityService`，通过 HTTP/HTTPS 下载插件包，限制 25 MB 和 15 秒超时，计算 `actual_sha256` 并与 Manifest 声明比对；失败会阻断安装并写入事件 payload。
7. 前端安装门禁：自定义插件安装弹窗接入 `/plugins/manifest/validate`，展示 `package_integrity`、expected/actual sha256、包大小、来源、Tool Gateway 工具绑定预览和错误/警告；Manifest 修改后旧预检结果失效，未通过后端预检不能安装。
8. 签名验证适配：`PluginPackageIntegrityService` 增加可注入 `PluginPackageSignatureVerifier`，支持 `SIGSTORE`、`PGP`、`CUSTOM` 签名类型的结果归一、事件记录和安装阻断；当 Manifest 声明签名或验签信息时，必须配置可用的 `PLUGIN_SIGNATURE_VERIFIER_URL`、`PLUGIN_SIGNATURE_PUBLIC_KEY` 或等价 verifier，否则完整性校验结果为 `FAILED` 并阻断安装。metadata-only 仅作为审计展示状态，不计为验签通过。
9. 升级/回滚闭环：`POST /plugins/:pluginId/upgrade` 会生成版本快照和审计；新增 `POST /plugins/:pluginId/rollback` 可按 `version_id` 或 `version` 恢复已发布版本快照，回滚后重新同步权限、菜单、Hook、工具，写入 `plugin.rolled_back` 平台事件和 `ROLLBACK` 审计。
10. 受控 Hook 入队：新增 `PluginHookExecutionService`，在安装实例处于可运行状态且 Hook 为 `ACTIVE` 时写入 `plugin.hook.execution.queued`、`PENDING` 平台事件；事件 payload 保存 Hook 元信息、入参 payload 和控制面事件边界标识，前端绑定页通过确认弹窗触发入队。
11. Hook Runtime 执行闭环：新增 `PluginHookWorkflowService` 和 Runtime `/runtime/workflows/plugin-hooks/start`，Hook 事件会进入 Temporal/local fallback 工作流；Runtime 回调 `/runtime/internal/plugin-hooks/run` 会加载队列事件和 Hook 配置，解析生成工具编码，通过 `ToolsService.execute(..., triggerSource: 'RUNTIME')` 进入 Tool Gateway 审批、限流、安全策略和调用日志边界。
12. Hook 恢复闭环：`workflow.plugin_hook_execution.failed` / `dispatch_failed` 已纳入 `/runtime/workflows/status` 可恢复任务和 `/runtime/workflows/retry` 重试入口；恢复时重新派发 `PluginHookWorkflowService.dispatchHookExecution`，权限沿用 `plugin:center:manage`。
13. Hook 沙箱审计快照持久化：安装、升级和回滚同步 Hook 时，会把 Manifest 级 `sandbox_policy`、`sandbox_risk_level`、`sandbox_violations` 写入 `plugin_hook.config_json`，保证 Runtime 对历史队列事件和 Hook 配置 fallback 使用同一沙箱边界。

## 外部验签服务契约

生产环境中，凡插件包存在签名且安装策略要求验签，必须配置在线企业验签服务或本地公钥验签；未配置、不可达或超时时，安装前校验必须失败并阻断安装。

在线企业验签服务配置如下，配置 URL 后优先走在线 verifier：

```text
PLUGIN_SIGNATURE_VERIFIER_URL=https://verifier.example.com/plugin-signatures
PLUGIN_SIGNATURE_VERIFIER_TOKEN=replace-this-verifier-token
PLUGIN_SIGNATURE_VERIFIER_TIMEOUT_MS=10000
```

Control API 在插件包 sha256 校验通过后向验签服务发起 `POST`，请求体只包含包来源、最终下载地址、实际 sha256、签名、签名类型和可选验证地址，不上传插件包原始字节：

```json
{
  "source_url": "https://plugins.example.com/ticket-suite.tgz",
  "final_url": "https://plugins.example.com/ticket-suite.tgz",
  "actual_sha256": "64位十六进制sha256",
  "signature": "sigstore bundle 或 pgp/custom 签名",
  "signature_type": "SIGSTORE",
  "verification_url": "https://rekor.example.com/log/entry"
}
```

验签服务返回结果会归一化为 `PluginPackageSignatureResult`。当签名存在且需要验签时，未配置 verifier、verifier 不可达或超时、HTTP 非 2xx、无效 JSON、无效状态、`status=FAILED`，或未返回 `PASSED + verified=true` 都会阻断安装，并写入 Manifest 校验事件 payload：

```json
{
  "status": "PASSED",
  "verified": true,
  "signature_type": "SIGSTORE",
  "signature_present": true,
  "verification_url": "https://rekor.example.com/log/entry",
  "subject": "ticket-suite",
  "issuer": "enterprise-sigstore",
  "error_code": null,
  "error_message": null
}
```

不接入在线服务时，可以配置本地公钥 verifier。该路径使用插件包下载后的原始字节和 Manifest 中的 base64 detached signature 做验签，不新增中间件：

```text
PLUGIN_SIGNATURE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----"
PLUGIN_SIGNATURE_LOCAL_ALGORITHM=RSA-SHA256
```

本地 verifier 当前适合 `CUSTOM` 签名和企业自有签名体系；后续如果要支持 Sigstore bundle / PGP keyring 的完整信任链校验，可在同一 `PluginPackageSignatureVerifier` 接口下继续扩展。

## P0 边界

- 本轮不引入真实 Sigstore/PGP SDK、不新增对象存储表、不启动容器或中间件。
- 当前 P0 校验已经覆盖控制面静态门禁、真实包下载、sha256 计算、企业外部在线 verifier 强制验签门禁、本地公钥 detached signature verifier、安装前 Tool Gateway 绑定预览、控制面版本回滚、Runtime/Temporal 回滚派发、受控 Hook 入队、Hook 沙箱审计快照持久化、Hook Runtime 执行、Hook 失败恢复和代码型 Hook 的 Runtime 沙箱执行器未配置阻断事件；完整 Sigstore/PGP 信任链 verifier、真正插件代码沙箱属于后续增强。
- Hook 不执行第三方任意代码；当前执行目标限定为 Manifest 同步生成的 Tool Center 工具，并复用 Tool Gateway 的审批、限流、安全策略和审计边界。代码型 Hook 即使已声明 sandbox，也必须等待真实沙箱执行器接入；未接入时 Runtime 记录 `workflow.plugin_hook_execution.sandbox_blocked`。

## 下一批文件边界

- 内置签名验证实现：`apps/control-api/src/plugins/` 已支持本地公钥 detached signature verifier；后续可在现有 `PluginPackageSignatureVerifier` 接口下继续增加 Sigstore/PGP SDK 信任链适配。
- 插件代码沙箱：如果后续允许插件包内自定义代码运行，需要独立沙箱进程、资源限制、网络白名单和签名策略；不得在 Control API 进程内执行。
- Hook 执行增强：当前 Hook 已通过 Runtime/Temporal 触发生成工具调用；后续可扩展为插件沙箱 Worker，但仍必须复用安全中心审批、Tool Gateway 风险策略和统一事件用量契约。
