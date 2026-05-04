# M84 审批与归档告警通知投递

## 目标

在 M83 审批与归档运营告警闭环基础上，为每条运营告警增加通知投递能力，支持站内事件记录和外部 Webhook 投递，让安全管理员可以把审批积压、归档异常、审计失败等风险快速同步给相关责任人。

本模块不新增数据库表、不执行数据库迁移、不启动容器、不安装中间件。

## 后端接口

新增接口：

```text
POST /api/v1/security-center/operation-alerts/:alertId/notify
```

请求：

```json
{
  "channels": ["IN_APP", "WEBHOOK"],
  "note": "安全中心审批与归档运营告警手动通知"
}
```

响应：

```text
alert_id
status
channels
targets
delivery_event_id
webhook_status
message
delivered_at
```

状态：

```text
SENT
PARTIAL
SKIPPED
FAILED
```

## 事件记录

通知投递写入统一平台事件：

```text
platform.security.approval_operation_alert.notification_sent
```

事件存储：

```text
platform_event
```

事件载荷包含：

```text
alert_id
title
severity
metric
href
status
channels
targets
note
webhook_status
webhook_error
delivered_at
```

## Webhook 策略

复用现有系统设置：

```text
external_webhook_url
```

行为：

```text
1. 只选择 IN_APP 时，写入站内事件。
2. 选择 WEBHOOK 且已配置地址时，向 Webhook POST 告警内容。
3. 选择 WEBHOOK 但未配置地址时，返回 PARTIAL 或 SKIPPED。
4. Webhook 失败时，仍保留站内事件和失败原因。
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 运营告警闭环
```

新增交互：

```text
1. 每条运营告警增加“通知”按钮。
2. 点击后调用通知接口。
3. 按钮展示“正在通知”状态。
4. 投递后展示状态、渠道、Webhook 状态和投递时间。
5. 投递失败时通过页面错误提示展示原因。
```

## 参考设计

```text
images/frontend-reference-design/m84-审批与归档告警通知投递/
```

## 边界

1. M84 不新增独立通知中心页面。
2. M84 不做自动重试，后续可复用告警通知重试任务。
3. M84 不做通知订阅人配置，目标由告警严重等级推导。
4. M84 不执行数据库迁移。
5. M84 不启动任何容器或中间件。

## 后续演进

后续可以继续做：

```text
1. 审批与归档告警通知重试
2. 审批与归档告警生命周期：确认、升级、关闭
3. 告警订阅人配置
4. 通知投递审计列表
5. 与监控中心告警统一队列合并
```

## 验收标准

- 安全中心提供运营告警通知接口。
- 通知写入 `platform_event`。
- Webhook 配置存在时可以发起外部投递。
- `/security` 告警卡片展示“通知”按钮。
- 投递后展示中文结果状态。
- Control API typecheck 通过。
- Web typecheck 通过。
