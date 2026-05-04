# M89 审批与归档告警订阅人与 SLA 超时通知

## 目标

在 M88 SLA 与超时升级基础上，补齐 SLA 超时告警的订阅目标和通知投递闭环。安全管理员可以在安全中心查看当前订阅策略、待通知超时项、投递结果和最近投递审计。

本模块不新增数据库表、不执行数据库迁移、不启动容器、不安装中间件。

## 后端接口

新增 SLA 超时通知概览：

```text
GET /api/v1/security-center/operation-alert-sla/notifications/overview
```

新增手动通知超时项：

```text
POST /api/v1/security-center/operation-alert-sla/notify-overdue
```

## 订阅策略

优先读取租户系统设置：

```text
operation_alert_sla_subscription_policy
```

配置结构：

```json
{
  "enabled": true,
  "channels": ["IN_APP", "WEBHOOK"],
  "default_targets": ["安全管理员"],
  "high_risk_targets": ["租户管理员", "安全管理员", "审计员"],
  "archive_targets": ["安全管理员", "审计员"]
}
```

没有租户设置时使用环境变量兜底：

```text
SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_ENABLED
SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_CHANNELS
SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_DEFAULT_TARGETS
SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_HIGH_RISK_TARGETS
SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_ARCHIVE_TARGETS
```

Webhook 仍复用已有系统设置：

```text
external_webhook_url
```

## 投递逻辑

手动或后台任务扫描：

```text
1. 读取当前 SLA 明细
2. 只处理 OVERDUE 且未关闭的告警
3. 已存在 SLA 通知事件的告警不会重复通知
4. 按告警类型选择订阅目标
5. 写入 platform_event 作为站内通知和投递审计
6. 如果配置 Webhook，则同步投递外部 Webhook
```

事件类型：

```text
platform.security.approval_operation_alert_sla.notification_sent
platform.security.approval_operation_alert_sla.notification_finished
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 告警 SLA 与超时升级 -> SLA 超时通知与订阅目标
```

展示：

```text
1. 待通知超时数量
2. 已投递数量
3. 部分成功数量
4. 投递失败数量
5. 当前订阅目标
6. Webhook 配置状态
7. 最近投递审计
8. 最近通知结果
```

操作：

```text
刷新通知
通知超时项
```

## 参考设计

```text
images/frontend-reference-design/m89-审批与归档告警订阅人与sla超时通知/
```

## 边界

1. M89 不新增独立页面。
2. M89 不新增数据库表。
3. M89 不执行数据库迁移。
4. M89 不启动任何容器或中间件。
5. M89 第一版订阅策略使用系统设置 JSON，不做独立订阅人表。

## 后续演进

后续可以继续做：

```text
1. 独立告警订阅人表
2. 值班人排班与轮值策略
3. 通知升级链路
4. SLA 通知自动重试与死信
5. Temporal durable notification workflow
```

## 验收标准

- 可以查看 SLA 超时通知概览。
- 可以查看订阅策略、渠道和目标。
- 可以手动通知当前超时项。
- 通知投递写入 `platform_event`。
- `/security` 展示 SLA 超时通知与订阅目标区域。
- Control API typecheck 通过。
- Web typecheck 通过。
