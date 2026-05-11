# M155 插件生产预检闭环

## 背景

插件中心已经具备 Manifest 预检、安装、升级、回滚、Hook 执行与工作流恢复能力。本轮补齐三个生产闭环断点，避免插件在安装前预检、回滚和 Hook 恢复环节出现不可审计或不可恢复的状态。

## 范围

- Manifest 预检失败必须写入 `platform_event`，即使用户没有继续执行安装。
- 插件回滚必须明确指定目标版本，避免空请求命中任意已发布快照。
- Runtime 工作流恢复入口必须允许 `plugin_hook_execution`，与共享类型和服务层恢复能力保持一致。

## 后端契约

- `POST /plugins/manifest/validate`
  - 继续返回 `PluginManifestValidationResult`。
  - 失败时记录 `plugin.manifest.validation_failed` 平台事件。
  - 事件包含租户、部门、用户、插件 Manifest code、错误详情和完整校验摘要。

- `POST /plugins/:pluginId/rollback`
  - `version_id` 与 `version` 必须二选一。
  - 两者都为空或同时传入时直接返回 `BadRequestException`。
  - 校验发生在安装记录查询前，避免无目标回滚产生误匹配。

- `POST /runtime/workflows/retry`
  - `task_type` 允许 `plugin_hook_execution`。
  - 插件 Hook 失败工作流可通过现有恢复入口重新派发。

## 验收标准

- Manifest 预检失败后可在统一事件中心检索到 `plugin.manifest.validation_failed`。
- 插件回滚空 body 不会查询安装记录，不会回滚到任意快照。
- 插件回滚同时传 `version_id` 和 `version` 会被拒绝。
- Runtime 工作流恢复 DTO 接受 `plugin_hook_execution`。

## 非范围

- 不新增插件代码沙箱。
- 不新增中间件或容器。
- 不改变插件列表页信息架构。
