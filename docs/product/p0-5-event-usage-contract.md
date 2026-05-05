# P0-5 统一事件与用量投影契约

## 目标

把 P0 阶段所有 Runtime、Tool Gateway、External API、Temporal、Security、Billing、Plugin、Channel、Knowledge、Agent Team 的关键动作统一投影到 `platform_event`、`platform_usage_event`、`platform_event_relation` 和 `platform_usage_rollup`，让监控、审计、成本、告警和生产 Runbook 使用同一套口径。

本模块先固定契约，不新增表、不执行迁移、不启动容器。

## 已有底座

当前数据库已经有：

```text
platform_event
platform_usage_event
platform_event_relation
platform_usage_rollup
```

Control API 已有统一服务：

```text
apps/control-api/src/platform-events/platform-events.service.ts
```

前端承载入口：

```text
/monitor
/billing
/security
```

## 平台事件必填规则

所有 P0 生产关键事件必须满足：

| 字段 | 规则 |
| --- | --- |
| `tenant_id` | 必填，来自当前租户或 API Key / Runtime snapshot |
| `event_source` | 必填，使用本文约定来源 |
| `event_type` | 必填，使用点分命名，例如 `runtime.model.call.finished` |
| `resource_type` | 必填，使用大写资源域或稳定系统资源名 |
| `status` | 必填，使用 `SUCCESS` / `FAILED` / `BLOCKED` / `SKIPPED` / `PENDING` / `APPROVED` / `REJECTED` |
| `severity` | 必填或默认，使用 `INFO` / `WARN` / `ERROR` / `CRITICAL` |
| `trace_id` | 有请求链路时必填 |
| `request_id` | 有外部请求、Runtime 请求或后台任务时必填 |
| `source_system` | 必填，标识源表或源服务 |
| `source_id` | 有源记录时必填 |
| `dedupe_key` | 可重试、回调、投递、调度类事件必填 |
| `payload_json` | 存放模块特有字段，不存完整密钥、原始 API Key 或敏感正文 |

## 来源系统命名

| 来源 | `event_source` | `source_system` |
| --- | --- | --- |
| Control API 通用业务 | `control_api` | 具体源表名 |
| Runtime 单 Agent | `runtime` | `agent_runtime` |
| Runtime 多 Agent | `runtime` | `agent_team_runtime` |
| Tool Gateway | `tool_gateway` | `tool_call_log` |
| Knowledge | `knowledge` | `knowledge_task` / `knowledge_recall_log` |
| External API | `external_api` | `api_key` / `webhook_delivery` |
| Channel | `channel` | `agent_publish_channel` / `channel_delivery` |
| Plugin | `plugin` | `plugin_installation` / `plugin_hook` |
| Security | `security` | `security_policy` / `platform_event` |
| Billing | `billing` | `billing_invoice` / `billing_adjustment` / `billing_quota_policy` |
| Workflow | `workflow` | `runtime_workflow` / 业务任务表 |

## P0 事件类型最低清单

### Runtime

```text
runtime.agent.run.started
runtime.agent.run.finished
runtime.agent.run.failed
runtime.model.call.finished
runtime.model.call.failed
runtime.rag.retrieve.finished
runtime.rag.retrieve.failed
runtime.tool.call.finished
runtime.tool.call.failed
```

### Knowledge

```text
knowledge.document.uploaded
knowledge.task.queued
knowledge.task.started
knowledge.task.finished
knowledge.task.failed
knowledge.index.rebuilt
knowledge.retrieve.finished
knowledge.retrieve.failed
```

### Tool Gateway

```text
tool.call.requested
tool.call.finished
tool.call.failed
tool.call.rate_limited
tool.call.approval_required
tool.call.approved_finished
tool.call.approved_failed
```

### External API / API Key

```text
external.api.request.accepted
external.api.request.finished
external.api.request.failed
external.api.request.blocked
external.webhook.delivery.sent
external.webhook.delivery.failed
external.webhook.delivery.retried
```

### Channel

```text
channel.callback.received
channel.callback.completed
channel.callback.failed
channel.delivery.sent
channel.delivery.failed
channel.delivery.retried
channel.rollout_gate.allowed
channel.rollout_gate.blocked
channel.release_batch.started
channel.release_batch.full
channel.release_automation.promoted
channel.release_self_healing.rolled_back
```

### Plugin

```text
plugin.installed
plugin.enabled
plugin.disabled
plugin.upgraded
plugin.uninstalled
plugin.hook.executed
plugin.hook.failed
plugin.security.blocked
```

### Agent Team

```text
agent.team.run.started
agent.team.run.finished
agent.team.run.failed
agent.team.run.waiting_human
agent.team.handoff
agent.team.report.exported
agent.team.report.archived
```

### Security

```text
security.policy.denied
security.access.denied
security.approval.requested
security.approval.approved
security.approval.rejected
```

### Billing

```text
billing.subscription.updated
billing.quota_policy.updated
billing.quota.blocked
billing.invoice.recalculated
billing.invoice.locked
billing.invoice.paid
billing.adjustment.created
billing.adjustment.approved
billing.adjustment.applied
```

### Workflow

```text
workflow.dispatch.started
workflow.dispatch.failed
workflow.task.finished
workflow.task.failed
workflow.task.recovered
```

## 用量指标最低清单

| metric_type | unit | 典型来源 |
| --- | --- | --- |
| `model_tokens` | `token` | Runtime、Control API fallback、Agent Team |
| `model_cost` | `usd` | 模型调用成本 |
| `tool_calls` | `call` | Tool Gateway |
| `tool_call_attempts` | `attempt` | Tool Gateway retry / approval after-run |
| `knowledge_queries` | `query` | RAG 检索 |
| `knowledge_segments_indexed` | `segment` | 文档切片和索引 |
| `storage_bytes` | `byte` | MinIO 对象 |
| `api_key_requests` | `request` | External API |
| `webhook_deliveries` | `delivery` | Webhook 投递 |
| `channel_deliveries` | `delivery` | Channel Sender |
| `channel_callback_messages` | `message` | 企业 IM / Webhook 入站 |
| `plugin_invocations` | `call` | Plugin Hook / 插件工具 |
| `workflow_steps` | `step` | Temporal / local fallback |
| `agent_team_runs` | `run` | Agent Team |
| `agent_team_cost` | `usd` | Agent Team 汇总成本 |
| `approval_requests` | `request` | 安全审批 |

## 资源类型规范

P0 阶段使用这些稳定资源类型：

```text
AGENT
AGENT_TEAM
MODEL
PROMPT
KNOWLEDGE_BASE
DOCUMENT
TOOL
CONVERSATION
API_KEY
CHANNEL
PLUGIN
BILLING
SECURITY_POLICY
APPROVAL
WORKFLOW
STORAGE_OBJECT
```

## 关联规则

`platform_event_relation` 用于连接跨模块事件：

| relation_type | 用途 |
| --- | --- |
| `TRACE_PARENT` | 同一 Trace 下父子事件 |
| `REQUEST` | 同一 request_id 的事件 |
| `SOURCE_LINK` | 源业务记录和投影事件 |
| `USAGE_LINK` | 事件和用量记录 |
| `HANDOFF` | 多 Agent 接力 |
| `APPROVAL` | 审批请求、审批结果和最终执行 |
| `RETRY` | 重试链路 |
| `ROLLUP` | 用量汇总来源 |

## dedupe_key 规则

可重复触发的事件必须提供 `dedupe_key`：

```text
{event_source}:{event_type}:{source_system}:{source_id}:{stable_action_id}
```

示例：

```text
channel:channel.delivery.sent:channel_delivery:delivery-id:attempt-3
external_api:external.webhook.delivery.retried:webhook_delivery:delivery-id:manual-retry-1
workflow:workflow.dispatch.failed:knowledge_task:task-id:dispatch
```

## 模块接入原则

1. 新增业务模块不得直接写 Prisma `platformEvent`，应优先使用 `PlatformEventsService.recordEvent` 和 `recordUsage`。
2. 写事件失败不得阻断主业务，除非该事件本身就是业务对象，例如审批事件或账单事件。
3. 事件 payload 只放摘要、状态、ID、计数和错误摘要，不放密钥、Token、完整文件内容或完整模型输入输出。
4. 可计费动作必须同时写入 `platform_usage_event` 或明确标记为 `billable=false`。
5. 失败、拒绝、拦截类事件必须写入 `severity`，并带上中文 `summary`。

## 后续执行顺序

1. P0-6、P0-8、P0-9、P0-11 并行接入本契约。
2. P0-4 收敛 Runtime 内部 RAG / Tool / Model 的策略与事件写入。
3. P0-10 基于本契约做复杂计费和额度强执行。
4. P0-12 用本契约检查生产验收 Runbook。

## 验收标准

1. P0 子模块新增事件类型必须出现在本文清单或补充本文。
2. P0 子模块新增用量指标必须出现在本文清单或补充本文。
3. 监控中心能按 `trace_id`、`request_id`、`event_source` 查到关键事件。
4. 成本中心能按 `metric_type`、`resource_type` 查询关键用量。
5. 告警和审计不再各自定义不可复用的事件字段。
