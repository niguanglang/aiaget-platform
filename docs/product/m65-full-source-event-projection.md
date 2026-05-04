# M65 全来源事件投影补齐

## 目标

在 M64 统一事件与用量底座已经具备查询、详情、关系和账本承载后，补齐关键业务来源的写入投影，让 Runtime、Tool Gateway、Security 和 Billing 的核心动作稳定进入 `platform_event` / `platform_usage_event`。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 已补齐来源

### Tool Gateway

新增投影：

```text
tool.call.finished
tool.call.failed
tool.call.rate_limited
tool.call.approval_required
tool.call.approved_finished
tool.call.approved_failed
```

同步写入用量：

```text
tool_calls
tool_call_attempts
```

覆盖：

```text
成功调用
失败调用
限流拒绝
高危审批占位
审批后执行
```

### Runtime Internal

新增投影：

```text
runtime.knowledge.retrieve.finished
runtime.tool.call.finished
runtime.tool.call.failed
workflow.knowledge_task.finished
workflow.knowledge_task.failed
workflow.agent_team_run.finished
workflow.agent_team_run.failed
workflow.channel_release_automation.finished
workflow.channel_release_automation.failed
workflow.channel_release_self_healing.finished
workflow.channel_release_self_healing.failed
```

同步写入用量：

```text
knowledge_queries
```

覆盖：

```text
Runtime 知识检索适配
Runtime 工具调用适配
知识库后台任务回调
多 Agent 团队运行回调
渠道自动推进工作流回调
渠道自愈工作流回调
```

### Security

新增投影：

```text
security.policy.denied
security.access.denied
```

覆盖：

```text
SecurityPolicyGuard 拒绝
DataScope / Resource ACL 等安全拒绝事件
```

安全事件继续保留原有 `operation_log` 写入，同时追加 `platform_event` 投影。

### Billing

新增投影：

```text
billing.subscription.updated
billing.quota_policy.updated
```

覆盖：

```text
租户订阅变更
额度策略变更
```

## 查询承载

这些新增事件全部复用 M64 已完成的统一查询：

```text
GET /platform-events
GET /platform-events/:eventId
GET /platform-usage/overview
GET /platform-usage/ledger
```

前端仍通过：

```text
/monitor
/billing
```

承载，不新增一级菜单。

## 验收标准

- Tool Gateway 调用会产生平台事件和用量事件。
- Runtime 内部检索、工具适配和 workflow 回调会产生平台事件。
- 安全拒绝会同时写入 `operation_log` 和 `platform_event`。
- 计费订阅、额度策略变更会写入 `platform_event`。
- Control API typecheck 通过。
