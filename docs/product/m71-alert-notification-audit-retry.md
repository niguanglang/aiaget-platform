# M71 告警通知重试与投递审计中心

## 目标

在 M70 已支持手动投递告警通知后，补齐投递记录查询、失败筛选和人工重试能力，让告警通知从“一次性触发”升级为可运营、可审计的闭环。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 数据承载

继续复用统一平台事件：

```text
投递事件：
platform.usage.alert.notification_sent

告警到投递关系：
ALERT_NOTIFICATION

投递重试关系：
ALERT_NOTIFICATION_RETRY
```

重试不会覆盖原投递记录，而是追加新的投递事件，并用 `ALERT_NOTIFICATION_RETRY` 关联原投递事件和新投递事件。

## 接口

### 投递审计列表

```text
GET /platform-usage/alert-notifications?window=24h|7d|30d&status=SENT|PARTIAL|SKIPPED|FAILED&alert_id=...
```

返回：

```json
{
  "generated_at": "2026-05-03T00:00:00.000Z",
  "window": "24h",
  "summary": {
    "total_count": 10,
    "sent_count": 7,
    "partial_count": 2,
    "skipped_count": 0,
    "failed_count": 1,
    "retryable_count": 3,
    "retried_count": 1,
    "latest_failed_at": "2026-05-03T00:00:00.000Z"
  },
  "items": []
}
```

### 投递重试

```text
POST /platform-usage/alert-notifications/:notificationEventId/retry
```

仅允许重试：

```text
FAILED
PARTIAL
```

重试时沿用原投递记录中的渠道；如果原渠道为空，则默认使用：

```text
IN_APP
WEBHOOK
```

## 前端承载

继续复用：

```text
/monitor
PlatformEventUsagePanel
```

新增能力：

```text
1. “通知投递审计”卡片
2. 投递总数、失败、部分成功、已重试摘要
3. 按投递状态筛选
4. 展示通知事件 ID、告警 ID、渠道、目标、Webhook 状态、错误原因、重试次数
5. FAILED / PARTIAL 记录支持重试
6. 支持跳转查看投递事件详情
```

## 边界

1. 仍不做独立通知中心。
2. 不做自动重试队列。
3. 不做通知模板、订阅人、渠道偏好管理。
4. 不做批量重试。
5. 后续如果进入生产运营，应增加后台任务、重试退避、死信队列和通知 SLA。

## 修正

M71 同时修正 M70 的一个事件推导边界：

```text
platform.usage.alert.notification_sent
```

只作为投递审计事件，不再参与告警生命周期状态推导，避免通知事件把已关闭告警误判为待处理。

## 验收标准

- 可以查询告警通知投递审计列表。
- 可以按投递状态筛选。
- 失败或部分成功的投递可以人工重试。
- 重试会追加新的投递事件并建立重试关系。
- 前端展示中文状态、错误原因和重试结果。
- Control API typecheck 通过。
- Web typecheck 通过。
