# M85 审批与归档告警生命周期

## 目标

在 M83 运营告警闭环和 M84 告警通知投递基础上，为审批与归档运营告警增加生命周期动作：确认、升级、关闭。生命周期动作写入统一平台事件，安全中心总览实时推导当前状态。

本模块不新增数据库表、不执行数据库迁移、不启动容器、不安装中间件。

## 后端接口

新增接口：

```text
POST /api/v1/security-center/operation-alerts/:alertId/actions
```

请求：

```json
{
  "action": "ACKNOWLEDGE",
  "note": "安全中心手动确认"
}
```

动作：

```text
ACKNOWLEDGE
ESCALATE
CLOSE
```

响应：

```text
alert_id
status
last_action
last_note
updated_at
```

## 状态推导

告警状态不新增表，复用统一平台事件：

```text
resource_type = security_operation_alert
resource_id   = alertId
event_source  = security_center
```

事件类型：

```text
platform.security.approval_operation_alert.acknowledged
platform.security.approval_operation_alert.escalated
platform.security.approval_operation_alert.closed
```

状态映射：

```text
无生命周期事件 -> OPEN
acknowledged -> ACKNOWLEDGED
escalated -> ESCALATED
closed -> CLOSED
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
1. 每条告警展示生命周期状态。
2. 每条告警支持确认、升级、关闭。
3. 操作后展示最近动作、备注和时间。
4. 已关闭告警禁用生命周期按钮。
5. 操作成功后刷新安全中心总览。
```

## 参考设计

```text
images/frontend-reference-design/m85-审批与归档告警生命周期/
```

## 边界

1. M85 不新增独立告警表。
2. M85 不新增告警详情页。
3. M85 不做处理人分派。
4. M85 不执行数据库迁移。
5. M85 不启动任何容器或中间件。

## 后续演进

后续可以继续做：

```text
1. 审批与归档告警通知重试
2. 告警处理人和订阅人配置
3. 告警 SLA 和超时升级
4. 告警投递审计列表
5. 与监控中心统一告警队列合并
```

## 验收标准

- 安全中心提供告警生命周期动作接口。
- 生命周期动作写入 `platform_event`。
- 安全中心总览可推导告警状态。
- `/security` 告警卡片展示确认、升级、关闭按钮。
- 已关闭告警禁用生命周期按钮。
- Control API typecheck 通过。
- Web typecheck 通过。
