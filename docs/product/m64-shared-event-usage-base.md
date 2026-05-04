# M64 共用事件与用量底座

## 目标

把现有平台中分散的运行事件、审计事件、用量事件和成本事件统一成一套平台级底座，为后续的多 Agent 协作、插件生态、全渠道发布和复杂计费提供共同口径。

这个底座不新增基础中间件，不替换现有业务源表，只做统一契约、统一投影、统一查询和统一汇总。

## 解决的问题

当前平台已经有这些来源：

```text
operation_log
model_call_log
tool_call_log
knowledge_recall_log
conversation_run.steps
webhook_delivery
channel_delivery
api_key 使用记录
security policy 决策记录
```

问题在于这些数据的字段、粒度、命名和归属不一致，导致：

1. 监控中心、审计中心、成本中心口径不统一。
2. 多 Agent、插件、渠道、计费无法共享一套事件模型。
3. trace_id、request_id、run_id、task_id 之间缺少统一关联层。
4. 后续扩展模块会重复定义事件和用量结构。

## 设计原则

1. 以 PostgreSQL 作为统一元数据和投影落点。
2. 保留现有源表作为事实来源，不破坏既有写入链路。
3. 每条平台事件都必须能回溯到 tenant_id、request_id、trace_id。
4. 用量事件必须可聚合、可结算、可审计。
5. 监控、审计、计费共享同一套事件定义。

## 统一事件模型

建议所有平台级事件都收敛到一个统一模型：

```text
platform_event
```

### 核心字段

```text
id
tenant_id
department_id
user_id
actor_type
resource_type
resource_id
agent_id
team_id
plugin_id
channel_id
conversation_id
run_id
task_id
request_id
trace_id
parent_trace_id
event_source
event_type
status
severity
security_level
billable
summary
payload_json
occurred_at
created_at
updated_at
source_system
source_id
dedupe_key
```

### 典型事件类型

```text
agent.run.started
agent.run.finished
agent.team.handoff
tool.call.requested
tool.call.approved
tool.call.rejected
tool.call.finished
knowledge.recall.finished
model.call.finished
webhook.delivery.sent
webhook.delivery.failed
channel.delivery.sent
channel.delivery.failed
plugin.installed
plugin.enabled
plugin.disabled
billing.usage.recorded
security.policy.denied
security.policy.approved
audit.operation.logged
workflow.step.started
workflow.step.finished
```

## 统一用量模型

用量和事件不是一回事。事件负责“发生了什么”，用量负责“消耗了多少”。

建议单独收敛到：

```text
platform_usage_event
```

### 核心字段

```text
id
tenant_id
department_id
user_id
subject_type
subject_id
resource_type
resource_id
metric_type
unit
quantity
unit_price
amount
currency
billable
cost_source
trace_id
request_id
event_id
source_system
source_id
occurred_at
created_at
```

### 典型用量类型

```text
model_tokens
tool_calls
knowledge_queries
webhook_deliveries
channel_deliveries
plugin_invocations
workflow_steps
api_key_requests
storage_bytes
approval_requests
```

## 关系表

为了支撑多 Agent 协作、插件 hook、渠道回执和重试链路，建议补一个事件关系表：

```text
platform_event_relation
```

### 用途

```text
1. 父子事件关联
2. 重试链路关联
3. 接力链路关联
4. 审批链路关联
5. 结算归因关联
```

## 汇总表

为了支持看板、账单和告警，建议补一个按天或按小时聚合的汇总表：

```text
platform_usage_rollup
```

### 维度

```text
tenant_id
department_id
subject_type
subject_id
resource_type
resource_id
metric_type
period_type
period_start
period_end
```

### 指标

```text
event_count
quantity_total
amount_total
cost_total
error_count
success_count
retry_count
```

## 与现有系统联动

### Control API

- 写入基础事件投影。
- 提供统一事件查询和用量查询接口。
- 继续作为租户、权限、资源授权的入口。

### Runtime

- 产出 Agent 执行事件。
- 产出模型调用、知识检索、工具调用、子步骤事件。

### Tool Gateway

- 产出工具审批、限流、调用、失败、重试事件。

### Temporal

- 产出工作流任务、重试、补偿、人工介入事件。

### External API

- 产出 API Key 调用、Webhook 投递、回执、SDK 使用事件。

### Security Center

- 产出安全策略决策、拒绝、人工审批和高危行为记录。

### Billing

- 读取统一用量事件做成本、额度和账单汇总。

## 建议接口

这个底座本身不一定新增一级页面，但建议有统一查询接口支撑现有中心：

```text
GET /api/v1/platform-events
GET /api/v1/platform-events/:eventId
GET /api/v1/platform-events/:eventId/relations
GET /api/v1/platform-usage/overview
GET /api/v1/platform-usage/trends
GET /api/v1/platform-usage/ledger
```

### 现阶段落地状态

- `monitor`、`audit`、`billing`、`security` 继续作为承载入口，不新增独立一级导航。
- `platform_event`、`platform_usage_event`、`platform_event_relation`、`platform_usage_rollup` 作为统一底座表。
- `platform-events` / `platform-usage` 接口由 Control API 统一暴露。
- 前端可先通过现有监控与成本页面承载统一底座，再逐步把审计与安全联动到同一套事件源。

## 页面承载

这个模块不单独做成新的一级菜单，主要复用现有页面承载：

```text
监控中心：事件时间线、链路详情、错误事件
审计中心：操作事件、拒绝事件、审批事件
成本中心：用量台账、成本汇总、超额风险
安全中心：安全事件、策略命中、审批记录
```

## 验收点

1. 任意一个 trace_id 能串起同一次请求的主要事件。
2. 任意一个 request_id 能定位对应的业务事件和用量事件。
3. Monitor、Audit、Billing 三个视角看到的是同一套底层数据。
4. 多 Agent、插件、渠道、计费后续模块都能复用这套事件字段。
5. 不新增基础中间件，不破坏现有源表。

## 下一步

1. 先把统一事件契约和统一用量契约定死。
2. 再把 Control API、Runtime、Tool Gateway、External API 的事件接入统一投影。
3. 最后再让多 Agent、插件、渠道和计费模块按这套契约扩展。

## 当前落地状态

M63-1F 已先落地最小可用底座：

```text
platform_event
platform_usage_event
```

已接入来源：

```text
Agent Team Run
Agent Team Handoff
```

已写入事件：

```text
agent.team.run.finished
agent.team.run.failed
agent.team.run.waiting_human
agent.team.handoff
```

已写入用量：

```text
agent_team_runs
workflow_steps
model_tokens
agent_team_cost
```

未落地部分仍按后续 M64 拆分：

```text
Control API / Runtime / Tool Gateway / External API 全来源投影
```

## M64 收口增强

本轮完成统一底座查询与页面承载闭环：

```text
platform_event
platform_usage_event
platform_event_relation
platform_usage_rollup
```

已由 Control API 暴露统一查询：

```text
GET /platform-events
GET /platform-events/:eventId
GET /platform-events/:eventId/relations
GET /platform-usage/overview
GET /platform-usage/trends
GET /platform-usage/ledger
```

前端承载：

```text
/monitor  统一平台事件与用量底座完整视图
/billing  成本中心内嵌紧凑视图
```

已支持：

```text
1. 按窗口、来源系统、事件类型、资源类型、指标类型筛选
2. 按 Trace ID / Request ID / 关键字筛选
3. 选择平台事件后查看事件详情
4. 事件详情展示 Payload JSON、关联用量和事件关系
5. 用量账本按选中事件、Trace、Request 联动过滤
6. 用量趋势按指标类型和资源类型过滤
7. 监控中心不再把 platform_event.id 误传给旧 monitor event 详情接口
```

后续仍需逐步补齐的是“全来源投影质量”，也就是让 Control API、Runtime、Tool Gateway、External API、Temporal、Security、Billing 的关键动作都稳定写入同一套事件和用量模型。
