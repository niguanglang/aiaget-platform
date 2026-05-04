# M91 审批与归档告警 SLA 死信处置闭环

## 目标

M91 将 M90 的“失败死信展示”升级为可运营闭环：安全管理员可以对 SLA 超时通知死信执行认领、重新投递、关闭，并在安全中心看到处置状态和最近处置结果。

## 后端接口

```text
GET  /api/v1/security-center/operation-alert-sla/dead-letters/overview
POST /api/v1/security-center/operation-alert-sla/dead-letters/:notificationEventId/actions
```

处置动作：

```text
CLAIM    认领
REQUEUE  重新投递
CLOSE    关闭
```

处置状态：

```text
OPEN      待处理
CLAIMED   已认领
REQUEUED  已重新投递
CLOSED    已关闭
```

## 数据边界

本阶段不新增数据库表，仍然使用 `platform_event` 派生状态。

死信来源：

```text
platform.security.approval_operation_alert_sla.notification_sent
```

处置事件：

```text
platform.security.approval_operation_alert_sla.dead_letter_action
```

重新投递会写入新的 SLA 通知事件，并把 `retried_from_event_id` 指向原死信通知事件。

## 前端

安全中心 `/security` 的 SLA 通知可靠性区域新增：

```text
1. SLA 通知死信处置闭环卡片
2. 待处理、已认领、已重新投递、已关闭指标
3. 处置备注输入
4. 死信处置队列
5. 认领、重新投递、关闭行内操作
6. 最近处置结果
```

页面继续使用中文文案，复用已有 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`。

## 后续演进

如果死信量继续增加，可以把死信处置从事件派生升级为独立任务队列，并接入审批、负责人 SLA、通知策略回滚和 Temporal 工作流恢复。
