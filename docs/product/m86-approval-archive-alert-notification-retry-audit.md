# M86 审批与归档告警通知重试与投递审计

## 目标

在 M84 告警通知投递和 M85 告警生命周期基础上，补齐审批与归档告警通知的投递审计与失败重试能力，让安全管理员可以查询最近投递记录，并对失败或部分成功的投递直接重试。

本模块不新增数据库表、不执行数据库迁移、不启动容器、不安装中间件。

## 后端接口

新增投递审计列表：

```text
GET /api/v1/security-center/operation-alert-notifications?status=SENT|PARTIAL|SKIPPED|FAILED
```

新增投递重试：

```text
POST /api/v1/security-center/operation-alert-notifications/:notificationEventId/retry
```

## 数据来源

复用统一平台事件：

```text
platform_event
```

筛选条件：

```text
event_source = security_center
event_type   = platform.security.approval_operation_alert.notification_sent
```

投递事件载荷：

```text
alert_id
status
channels
targets
webhook_status
webhook_error
retry_count
retried_from_event_id
delivered_at
```

## 重试策略

允许重试：

```text
PARTIAL
FAILED
```

不允许重试：

```text
SENT
SKIPPED
```

重试会创建新的投递事件，并记录：

```text
retry_count = 上一次 retry_count + 1
retried_from_event_id = 原投递事件 ID
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知投递审计
```

能力：

```text
1. 查看最近审批与归档告警通知投递记录
2. 按状态筛选
3. 展示状态、告警、渠道、Webhook 状态、重试次数、投递时间
4. 失败或部分成功记录支持重试
5. 重试成功后刷新投递审计列表
```

## 参考设计

```text
images/frontend-reference-design/m86-审批与归档告警通知重试与投递审计/
```

## 边界

1. M86 不新增独立通知中心页面。
2. M86 不新增表。
3. M86 不做后台自动重试任务。
4. M86 不执行数据库迁移。
5. M86 不启动任何容器或中间件。

## 后续演进

后续可以继续做：

```text
1. 审批与归档告警通知自动重试任务
2. 告警订阅人配置
3. 告警 SLA 和超时升级
4. 投递失败原因统计
5. 与监控中心统一通知投递审计合并
```

## 验收标准

- 可以查询审批与归档告警通知投递记录。
- 可以按状态筛选投递记录。
- 失败和部分成功投递可以重试。
- 重试会写入新的 `platform_event`。
- `/security` 展示通知投递审计区域。
- Control API typecheck 通过。
- Web typecheck 通过。
