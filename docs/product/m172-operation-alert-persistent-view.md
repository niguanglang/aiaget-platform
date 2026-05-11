# M172 运营告警持久化视图增强

## 目标

安全中心运营告警、通知投递、SLA 死信和自愈处置仍以 `platform_event` 为事实来源。本次增强不新增 Prisma 表、不做数据库迁移，只在现有 API/类型返回中补齐复盘字段，方便运营人员把列表项稳定关联回事件源、请求链路和最近处置动作。

## 暴露字段

以下列表项会优先返回 `platform_event` 已持久化字段；当前对象没有对应值时返回 `null`，不伪造来源。

| 场景 | 字段 | 说明 |
| --- | --- | --- |
| 告警通知列表 | `source_system`、`source_id`、`dedupe_key`、`request_id`、`trace_id`、`replay_key` | 复盘通知来源、幂等键和请求链路；`replay_key` 来自事件 payload。 |
| SLA 自动重试/死信列表 | `source_system`、`source_id`、`dedupe_key`、`request_id`、`trace_id`、`replay_key` | 复盘 SLA 通知投递、重试和死信来源。 |
| SLA 死信列表 | `latest_action`、`latest_action_event_id`、`latest_action_at` | 展示最近一次认领、重投或关闭处置；没有处置时返回 `null`。 |
| 自愈审计列表 | `source_system`、`source_id`、`dedupe_key`、`request_id`、`trace_id`、`replay_key` | 复盘自愈动作来源、幂等键和请求链路。 |

## 前端落地

`/security/alerts` 已接入持久化视图：

- 通知审计列表展示“事件来源”“来源 ID”“去重键”“请求”“Trace”“重放键”。
- SLA 告警区展示 `SLA 自动重试`、`SLA 死信通知`、`死信未关闭` 指标。
- `SLA 自动重试` 卡片消费 `getSecurityOperationAlertSlaNotificationRetryOverview().retryable_items`，展示重试次数和来源追踪字段。
- `SLA 死信通知` 卡片消费 `getSecurityOperationAlertSlaNotificationRetryOverview().dead_letter_items`，展示策略识别出的死信通知。
- `SLA 死信处置` 卡片消费 `getSecurityOperationAlertSlaDeadLetterOverview().items`，展示“最近处置”“处置事件”“处置时间”。
- 自愈恢复审计在 `/security/recovery` 展示同组持久化字段。

页面只做运营审计和追溯入口，不在告警页承载完整死信处理表单或归档治理。

## 约束

- 不新增表，不迁移数据库。
- 不启动容器。
- 字段只来自现有 `platform_event` 列或 payload。
- 缺失字段返回 `null`。
