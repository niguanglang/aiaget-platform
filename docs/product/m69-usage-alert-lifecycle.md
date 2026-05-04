# M69 告警生命周期与通知策略

## 目标

在 M68 已经可以基于 Rollup 生成用量异常检测事件后，把异常事件升级成可运营的告警队列，支持确认、升级和关闭，并把所有生命周期动作继续写入统一平台事件。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 数据承载

第一版不新增 `alert` 表，复用统一事件底座：

```text
告警来源事件：
platform.usage.anomaly.detected

生命周期事件：
platform.usage.alert.acknowledged
platform.usage.alert.escalated
platform.usage.alert.closed
```

生命周期事件通过 `resource_type = platform_usage_alert` 和 `resource_id = 原异常检测事件 ID` 关联到告警来源。

同时写入 `platform_event_relation`：

```text
relation_type = ALERT_LIFECYCLE
```

## 接口

### 告警列表

```text
GET /platform-usage/alerts?window=24h|7d|30d
```

返回按事件推导后的告警状态：

```text
OPEN
ACKNOWLEDGED
ESCALATED
CLOSED
```

### 告警操作

```text
POST /platform-usage/alerts/:alertId/actions
```

请求：

```json
{
  "action": "ACKNOWLEDGE | ESCALATE | CLOSE",
  "note": "可选备注"
}
```

动作不会覆盖原事件，只追加生命周期事件，保证审计链路完整。

## 通知策略

M69 先实现通知目标预览，不实际投递：

```text
CRITICAL -> 租户管理员、安全管理员、成本负责人
ERROR    -> 租户管理员、成本负责人
WARN     -> 成本负责人
CLOSED   -> 无需通知
```

后续可把这些目标接到渠道投递、Webhook、站内消息或企业 IM。

## 前端承载

继续复用：

```text
/monitor
PlatformEventUsagePanel
```

新增能力：

```text
1. “告警生命周期”卡片展示告警队列
2. 展示总数、待处理、已升级、已关闭统计
3. 每条告警支持查看事件、确认、升级、关闭
4. 操作后刷新告警队列、事件流和概览
5. compact 视图不展示告警生命周期卡片
```

## 边界

1. 第一版是事件推导型告警，不支持独立 SLA、订阅和通知投递。
2. 不新增负责人分配表，`assignee_id` 由确认/升级动作的用户推导。
3. 不支持批量操作和备注编辑。
4. 后续如要长期运营，应升级为独立告警表，并接入通知投递与处理时限。

## 验收标准

- 异常检测事件可以进入告警队列。
- 告警支持确认、升级、关闭。
- 所有生命周期动作写入统一事件流。
- 前端可操作并刷新状态。
- Control API typecheck 通过。
- Web typecheck 通过。
