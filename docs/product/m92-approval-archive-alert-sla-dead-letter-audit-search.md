# M92 审批与归档告警 SLA 死信处置审计搜索

## 目标

M92 将 M91 的死信处置动作沉淀为可查询的审计时间线。安全管理员和审计员可以按关键词、处置动作、处置状态检索 SLA 通知死信的认领、重新投递、关闭记录，并通过请求 ID 与 Trace ID 反查链路。

## 后端接口

```text
GET /api/v1/security-center/operation-alert-sla/dead-letter-audits
```

查询参数：

```text
page
page_size
keyword
action
disposition_status
```

返回：

```text
PaginatedResult<SecurityOperationAlertSlaDeadLetterAuditItem>
```

审计项包含：

```text
event_id
notification_event_id
alert_id
title
action
disposition_status
note
delivery_event_id
handled_by
request_id
trace_id
occurred_at
```

## 数据边界

本阶段不新增表，不跑迁移，继续从统一事件表派生审计视图。

审计事件来源：

```text
platform.security.approval_operation_alert_sla.dead_letter_action
```

关键词搜索覆盖：

```text
标题
备注
通知事件 ID
告警 ID
投递事件 ID
请求 ID
Trace ID
处置人
```

## 前端

安全中心 `/security` 的 SLA 通知可靠性区域新增：

```text
1. SLA 死信处置审计时间线
2. 关键词搜索
3. 动作筛选：认领、重新投递、关闭
4. 状态筛选：待处理、已认领、已重投、已关闭
5. 筛选重置
6. 上一页 / 下一页分页
7. 请求 ID、Trace ID、投递事件 ID 展示
```

页面继续使用中文文案，复用已有 `Card`、`Button`、`Input`、`StatusBadge`、`EmptyState` 和 `formatDateTime`。

## 设计资产

```text
images/frontend-reference-design/m92-sla处置审计时间线与搜索/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 后续演进

后续可以继续把审计时间线与审计中心、导出中心、告警复盘报告联动，并支持按 Trace ID 直接跳转到全链路观测详情。
