# M170 插件运行前沙箱策略审计

## 目标

M170 将 M169 的“Manifest 必须声明 sandbox”升级为 Hook 入队前的运行前审计。控制面仍不执行第三方插件代码、不启动容器、不新增沙箱 Worker；Hook 进入异步队列前只读取插件 Manifest，给出沙箱审计结论、风险等级和阻断原因。

## 入队审计规则

声明自定义代码入口的插件必须满足最低策略：

- `sandbox.status` 必须为 `DECLARED`。
- `sandbox.isolation` 必须存在。
- `sandbox.network` 必须存在，且不允许 `ALLOW`。
- `sandbox.filesystem` 必须存在。
- `sandbox.timeout_ms` 必须存在且大于 0。
- `sandbox.memory_mb` 必须存在且大于 0。

没有代码入口的 Tool Gateway 插件继续使用现有 `CONTROL_PLANE_EVENT_ONLY` 边界，不会因为缺少 sandbox 被阻断。

## 审计事件

审计通过时，`plugin.hook.execution.queued` 的 payload 增加：

- `execution_boundary: "PLUGIN_SANDBOX_POLICY_GATED"`
- `sandbox_policy`
- `sandbox_risk_level`
- `sandbox_violations: []`

插件安装、升级和回滚同步 Hook 时，也会把 Manifest 级沙箱审计快照写入 `plugin_hook.config_json`：

- `sandbox_policy`
- `sandbox_risk_level`
- `sandbox_violations`

这样 Runtime 处理历史队列事件或缺少 payload 扩展字段的 Hook 时，仍可以从 Hook 配置读取同一份沙箱边界，不会把代码型 Hook 误判为普通 Tool Gateway Hook。

审计失败时，控制面不入队、不派发 workflow，只记录：

- `eventType: "plugin.hook.execution.sandbox_blocked"`
- `status: "FAILED"`
- `execution_boundary: "PLUGIN_SANDBOX_POLICY_BLOCKED"`
- `sandbox_policy`
- `sandbox_risk_level`
- `sandbox_violations`

Runtime 工作流执行阶段会再次识别 `sandbox_policy.entry`。如果代码型 Hook 已通过入队审计，但当前环境没有真实插件沙箱执行器，Runtime 不会回退到 Tool Gateway，也不会报成“缺少工具编码”，而是记录：

- `eventType: "workflow.plugin_hook_execution.sandbox_blocked"`
- `status: "FAILED"`
- `execution_boundary: "PLUGIN_SANDBOX_EXECUTOR_NOT_CONFIGURED"`
- `sandbox_policy`
- `sandbox_risk_level`
- `sandbox_violations`
- `error_message: "Plugin sandbox executor is not configured"`

## 风险分级

- `LOW`：无需 sandbox 的 Tool Gateway 插件，或代码入口已声明完整最低策略且网络为 `DENY`。
- `MEDIUM`：通过最低策略，但存在 `ALLOWLIST`、`TEMP` 或 `REMOTE` 等需要持续关注的边界。
- `HIGH`：声明了代码入口，但最低策略字段不完整。
- `CRITICAL`：缺少 sandbox 声明，或网络策略为 `ALLOW`。

## 远程执行器边界

M170 后续增强已经补齐 `REMOTE` 外部执行器接入点，但仍不在本项目内启动或交付沙箱服务：

- `PLUGIN_SANDBOX_EXECUTOR_URL` 为空时，代码型 Hook 继续被安全阻断，并记录 `workflow.plugin_hook_execution.sandbox_blocked`。
- `PLUGIN_SANDBOX_EXECUTOR_URL` 配置后，Runtime 会把通过策略审计的代码型 Hook 投递到外部 `/execute` 执行器。
- 外部执行器请求包含 `tenant_id`、`plugin_id`、`hook_id`、`event_id`、`entry`、`payload` 和 `sandbox_policy`。
- 可选 `PLUGIN_SANDBOX_EXECUTOR_TOKEN` 以 Bearer token 方式传递。
- 执行成功或失败都会写 `workflow.plugin_hook_execution.finished/failed`，payload 标识 `execution_boundary: "PLUGIN_SANDBOX_REMOTE_EXECUTOR"`。

该能力只定义外部执行器契约，不代表 Control API 进程内执行插件包代码。

## 边界

- 不运行插件包代码。
- 不创建容器。
- 不新增插件沙箱 Worker。
- `PROCESS`、`CONTAINER`、`WASM`、`REMOTE` 仍是 Manifest 中的策略声明；当前只支持把 `REMOTE` 执行委托给外部已批准执行器。
