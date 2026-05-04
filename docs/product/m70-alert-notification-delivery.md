# M70 告警通知投递适配

## 目标

在 M69 已具备告警生命周期后，把“通知目标预览”升级为可执行的通知投递动作。第一版支持站内事件记录和外部 Webhook 投递，投递结果继续写入统一平台事件，保证监控、审计、成本中心可以复用同一条事件链路。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 数据承载

继续复用统一事件底座：

```text
投递事件：
platform.usage.alert.notification_sent

投递关系：
relation_type = ALERT_NOTIFICATION
```

投递事件通过：

```text
resource_type = platform_usage_alert
resource_id   = 原异常检测事件 ID
```

关联到告警来源事件。

## 接口

```text
POST /platform-usage/alerts/:alertId/notify
```

请求：

```json
{
  "channels": ["IN_APP", "WEBHOOK"],
  "note": "可选备注"
}
```

响应：

```json
{
  "alert_id": "告警事件 ID",
  "status": "SENT | PARTIAL | SKIPPED | FAILED",
  "channels": ["IN_APP", "WEBHOOK"],
  "targets": ["租户管理员", "成本负责人"],
  "delivery_event_id": "投递事件 ID",
  "webhook_status": 200,
  "message": "告警通知已投递。",
  "delivered_at": "2026-05-03T00:00:00.000Z"
}
```

## 渠道策略

第一版支持：

```text
IN_APP  -> 写入统一平台事件，作为站内通知记录
WEBHOOK -> 读取系统设置 external_webhook_url 后发起 HTTP POST
```

Webhook 未配置时：

```text
IN_APP + WEBHOOK -> PARTIAL
WEBHOOK only     -> SKIPPED
```

Webhook 请求超时时间为 5 秒，失败原因写入投递事件 payload。

## 系统设置联动

外部 Webhook 地址使用 M45 系统设置中心已有配置：

```text
category = INTEGRATION
key      = external_webhook_url
```

配置为空时不会报错阻断站内投递，前端会显示“站内通知已记录，外部 Webhook 未配置。”

## 前端承载

继续复用：

```text
/monitor
PlatformEventUsagePanel
UsageAlertLifecycleCard
```

新增能力：

```text
1. 告警行内增加“通知”按钮
2. 通知中按钮禁用并显示“通知中”
3. 已关闭告警不允许再次通知
4. 投递成功、部分成功、跳过、失败均使用中文提示条反馈
5. 投递后刷新告警队列、事件流、事件详情和用量概览
```

## 边界

1. 不做独立通知中心。
2. 不做重试队列和定时补偿。
3. 不做订阅人、模板、渠道偏好配置。
4. 不新增独立告警表，告警仍由统一事件推导。
5. 后续如要生产级投递运营，应新增通知投递审计中心和重试任务。

## 验收标准

- 告警队列可以手动触发通知。
- 投递结果写入 `platform_event`。
- 投递关系写入 `platform_event_relation`。
- Webhook 配置为空时不影响站内通知记录。
- 前端能显示通知操作中、成功和失败状态。
- Control API typecheck 通过。
- Web typecheck 通过。
