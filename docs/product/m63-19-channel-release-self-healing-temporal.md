# M63-19 渠道自愈 Temporal 工作流

## 目标

把 M63-18 渠道发布回滚与失败自愈接入 Runtime workflow / Temporal fallback 边界。

本模块不创建、不启动 Temporal 容器；默认仍可本地执行。真实 Temporal 启用后，Runtime Worker 会执行 workflow activity，并回调 Control API 内部接口完成自愈评估和回滚。

## 模式

Control API 使用：

```text
CHANNEL_RELEASE_SELF_HEALING_WORKFLOW_MODE=local
```

支持：

```text
local           直接在 Control API 本地执行
temporal_first  优先请求 Runtime workflow，失败后本地兜底
temporal        强制 Runtime/Temporal，派发失败则记录失败
```

Runtime 继续使用 M42 的 Temporal 环境变量：

```text
RUNTIME_TEMPORAL_ENABLED=false
RUNTIME_TEMPORAL_ADDRESS=localhost:7233
RUNTIME_TEMPORAL_NAMESPACE=default
RUNTIME_TEMPORAL_TASK_QUEUE=aiaget-knowledge-tasks
```

## 新增接口

Runtime workflow start：

```text
POST /runtime/workflows/channel-release-self-healing/start
```

Control API 内部执行适配器：

```text
POST /api/v1/runtime/internal/channel-release-self-healing/run
```

控制台仍使用：

```text
GET  /channels/:channelId/release-self-healing
PUT  /channels/:channelId/release-self-healing
POST /channels/:channelId/release-self-healing/run
```

## 执行流

### local

```text
用户点击执行一次
-> Control API ChannelReleaseSelfHealingWorkflowService
-> ChannelsService.runReleaseSelfHealing
-> 写入运行结果和平台事件
```

### temporal_first

```text
用户点击执行一次
-> Control API 请求 Runtime workflow start endpoint
-> Runtime:
   - RUNTIME_TEMPORAL_ENABLED=false：本地 fallback 回调 Control API
   - RUNTIME_TEMPORAL_ENABLED=true：启动 Temporal workflow
-> Worker Activity 回调 Control API 内部 run endpoint
-> Control API 重新读取渠道、策略、发布控制和最近自动推进结果并执行自愈
```

### temporal

```text
用户点击执行一次
-> Control API 请求 Runtime workflow start endpoint
-> Runtime 返回 TEMPORAL 才算成功
-> 派发失败会写入 channel.release_self_healing.workflow_dispatch_failed
```

## 前端

M63-19 不新增独立页面，而是在 M63-18 的“渠道发布回滚与失败自愈”面板中补充：

- 工作流模式
- 执行后端
- 工作流 ID
- 最近运行的 workflow backend

## 边界

- Runtime 不复制自愈、回滚和权限逻辑。
- Workflow payload 只传 `channel_id`。
- Activity 回调 Control API，由 Control API 从 PostgreSQL 重新读取最新渠道配置。
- 不新增数据库表或字段。
- 不创建中间件容器。

## 验收标准

- `local` 模式下仍能直接执行一次自愈。
- `temporal_first` 模式下 Runtime 未启用 Temporal 时返回 `LOCAL_FALLBACK`，并能回调 Control API 执行。
- `temporal` 模式下 Runtime 返回 `LOCAL_FALLBACK` 会被视为派发失败并记录事件。
- 前端能显示 workflow 模式、执行后端、workflow ID。
- Python Runtime 编译通过，Control API 和 Web 类型检查通过。
