# M99 审批与归档告警 SLA 死信审计归档删除审批通知投递

## 目标

M99 将 M98 产生的 SLA 死信审计归档删除审批运营告警接入通知投递识别体系。平台在发送站内记录和 Webhook 时，会标记该告警属于 `SLA_DEAD_LETTER_ARCHIVE_DELETE`，并在前端通知投递审计中显示专属标签和目标角色。

## 后端

增强通用运营告警通知：

```text
POST /api/v1/security-center/operation-alerts/:alertId/notify
GET  /api/v1/security-center/operation-alert-notifications
POST /api/v1/security-center/operation-alert-notifications/:notificationEventId/retry
```

新增告警分类：

```text
SLA_DEAD_LETTER_ARCHIVE_DELETE
```

适用告警：

```text
sla-dead-letter-archive-delete-pending
sla-dead-letter-archive-delete-rejected-risk
```

通知目标：

```text
中风险：安全管理员、审计员
高风险：租户管理员、安全管理员、审计员
```

Webhook payload 增加：

```text
category
targets
```

平台事件 payload 增加：

```text
alert_category
targets
```

## 前端

安全中心 `/security` 的“通知投递审计”区域新增：

```text
1. M99 SLA 死信通知标识
2. SLA 死信归档删除分类标签
3. 通知目标角色展示
4. 保留失败 / 部分成功重试能力
```

## 设计资产

```text
images/frontend-reference-design/m99-sla死信审计归档删除审批通知投递/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 权限

沿用当前安全中心通知权限：

```text
security:rule:view
```

## 边界

1. 本阶段不新增数据库表。
2. 本阶段不执行数据库迁移。
3. 本阶段不启动容器、不安装中间件、不触碰外部服务。
4. 本阶段复用已有运营告警通知链路，不新增独立通知服务。

## 验收标准

- SLA 死信归档删除运营告警可以通过现有通知按钮投递。
- 后端通知事件记录 `alert_category`。
- Webhook payload 包含 `category` 和 `targets`。
- 前端通知投递审计显示 SLA 死信归档删除分类标签。
- 前端通知投递审计显示目标角色。
- Control API typecheck 通过。
- Web typecheck 通过。
