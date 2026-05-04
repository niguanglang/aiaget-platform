# M116 来源型运营告警通知归档删除审批化

## 目标

M116 在 M115 的来源型运营告警通知审计归档基础上，把归档删除从直接对象操作升级为审批后生效。安全管理员可以对通知审计归档提交删除申请，审批通过后才删除对象存储文件；拒绝则保留归档，并将申请、审批、拒绝和删除生效事件写入平台事件审计。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 数据来源

归档对象仍来自对象存储前缀：

```text
audit-archives/security-operation-alert-notifications
```

删除审批事件复用：

```text
platform_event
```

新增事件类型：

```text
platform.security.approval_operation_alert_notification.archive.delete_requested
platform.security.approval_operation_alert_notification.archive.delete_approved
platform.security.approval_operation_alert_notification.archive.delete_rejected
platform.security.approval_operation_alert_notification.archive.delete_applied
```

## 后端接口

归档删除申请：

```text
DELETE /security-center/operation-alert-notifications/archives/:archiveId
```

归档删除审批：

```text
GET  /security-center/operation-alert-notifications/archive-approvals/overview
GET  /security-center/operation-alert-notifications/archive-approvals
GET  /security-center/operation-alert-notifications/archive-approvals/:approvalId
POST /security-center/operation-alert-notifications/archive-approvals/:approvalId/approve
POST /security-center/operation-alert-notifications/archive-approvals/:approvalId/reject
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知投递审计 -> 通知归档
```

新增能力：

```text
1. 通知审计归档申请删除
2. 删除审批概览：待审批、已批准、已拒绝、已生效
3. 删除审批队列筛选
4. 删除审批详情
5. 审批事件时间线
6. 审批通过后删除对象存储归档
```

## 审批状态

```text
PENDING   待审批
APPROVED  已批准
REJECTED  已拒绝
APPLIED   已生效
```

状态从同一 `source_id` 下的事件链推导：

```text
DELETE_REQUESTED -> PENDING
APPROVED -> APPROVED
REJECTED -> REJECTED
DELETE_APPLIED -> APPLIED
```

## 兼容策略

1. 已存在归档不需要迁移，申请删除时按归档 key 生成稳定审批 source_id。
2. 同一归档存在待审批申请时，重复删除请求返回已有审批 ID。
3. 审批通过后立即调用对象存储删除，并记录删除生效事件。
4. 审批拒绝不删除对象。

## 参考设计

```text
images/frontend-reference-design/m116-来源型运营告警通知归档删除审批化/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M116 不新增数据库表。
2. M116 不执行数据库迁移。
3. M116 不启动任何容器或中间件。
4. M116 不改变通知审计归档生成逻辑。
5. M116 不改变通知投递和重试策略。
6. M116 暂不做归档恢复，审批通过后对象会从对象存储删除。

## 验收标准

- 通知审计归档列表支持申请删除。
- 重复申请删除同一归档不会生成多个待审批。
- 删除审批概览能展示待审批、已批准、已拒绝、已生效数量。
- 删除审批详情能展示申请、审批、拒绝或生效时间线。
- 审批通过后对象存储归档被删除。
- 审批拒绝后归档保留。
- 前端 `/security` 展示归档删除审批入口和审批状态。
- Control API typecheck 通过。
- Web typecheck 通过。
