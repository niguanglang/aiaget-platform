# M90 审批与归档告警 SLA 通知自动重试与失败死信

## 目标

M90 补齐 M89 的通知可靠性闭环：SLA 超时通知投递失败或部分成功后，平台可以自动扫描、按退避策略重试，并把超过最大重试次数的记录展示为失败死信，便于安全管理员人工处理。

## 后端接口

```text
GET  /api/v1/security-center/operation-alert-sla/notification-retry/overview
POST /api/v1/security-center/operation-alert-sla/notification-retry/run
POST /api/v1/security-center/operation-alert-sla/notifications/:notificationEventId/retry
```

接口仍使用 `security:rule:view` 权限，与安全中心现有运营告警能力保持一致。

## 数据边界

本阶段不新增数据库表，继续使用 `platform_event` 作为投递审计与重试链路来源：

```text
platform.security.approval_operation_alert_sla.notification_sent
platform.security.approval_operation_alert_sla.notification_retry.finished
platform.security.approval_operation_alert_sla.notification_retry.manual_scan
```

通知事件 payload 增加：

```text
retry_count
retried_from_event_id
dead_lettered
dead_letter_reason
```

死信目前是派生状态：`FAILED / PARTIAL` 且 `retry_count >= max_retry_count`。

## 系统设置

新增通知策略配置项：

```text
operation_alert_sla_notification_auto_retry_enabled
operation_alert_sla_notification_retry_interval_ms
operation_alert_sla_notification_retry_batch_size
operation_alert_sla_notification_max_retry_count
operation_alert_sla_notification_retry_backoff_seconds
operation_alert_sla_notification_lookback_hours
```

这些配置会进入系统设置中心的通知策略分类，并参与通知策略变更影响评估。

## 前端

安全中心 `/security` 的「SLA 超时通知与订阅目标」下新增：

```text
1. SLA 通知自动重试与失败死信卡片
2. 待自动重试、失败投递、部分成功、死信指标
3. 重试策略面板
4. 可重试队列
5. 失败死信队列
6. 最近重试扫描结果
7. 单条通知重试与立即扫描重试操作
```

页面文案保持中文，复用现有 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`。

## 后续演进

M90 先完成控制面内的可靠性闭环。后续迁移 Temporal 时，可以把扫描与单条重试封装为 durable workflow，并将死信从派生视图升级为可认领、可关闭、可备注的持久队列。
