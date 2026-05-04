# M81 归档操作审计与删除审批化

## 目标

在 M80 审批审计归档基础上，补齐归档操作审计，并把归档删除从直接删除升级为审批后生效，避免审计材料被误删或越权删除。

本模块只新增代码和文档，不执行数据库迁移、不启动容器、不安装中间件。

## 数据策略

不新增数据库表，复用：

```text
approval_audit_event
```

新增审批审计来源：

```text
APPROVAL_AUDIT_ARCHIVE
```

新增事件类型：

```text
ARCHIVED
DOWNLOAD_URL_CREATED
DELETE_REQUESTED
DELETE_APPLIED
```

归档删除审批状态由同一 `source_id` 下的事件链推导：

```text
DELETE_REQUESTED -> PENDING
APPROVED -> APPROVED
REJECTED -> REJECTED
DELETE_APPLIED -> APPLIED
```

## 后端接口

归档删除申请：

```text
DELETE /api/v1/tool-approvals/audit-events/archives/:archiveId
```

该接口不再直接删除对象，而是创建待审批事件。

新增归档删除审批接口：

```text
GET  /api/v1/tool-approvals/audit-events/archive-approvals/overview
GET  /api/v1/tool-approvals/audit-events/archive-approvals
GET  /api/v1/tool-approvals/audit-events/archive-approvals/:approvalId
POST /api/v1/tool-approvals/audit-events/archive-approvals/:approvalId/approve
POST /api/v1/tool-approvals/audit-events/archive-approvals/:approvalId/reject
```

## 前端能力

审批审计中心：

```text
/approval-audits
```

变更：

```text
1. 归档删除按钮变成“申请删除”
2. 删除申请成功后提示审批 ID
3. 归档文件不会立即删除
```

审批中心：

```text
/approvals
```

新增：

```text
1. 第三类审批队列：归档删除
2. 归档删除审批概览
3. 归档删除审批列表
4. 归档删除审批详情
5. 审批审计时间线
6. 批准删除 / 拒绝删除
```

## 权限

创建删除申请：

```text
security:approval:view
```

处理删除审批：

```text
security:approval:handle
```

## 参考设计

```text
images/frontend-reference-design/m81-归档操作审计与删除审批化/
```

## 边界

1. M81 不新增表，审批队列由审计事件推导。
2. M81 不执行迁移。
3. M81 不启动 MinIO 或其他容器。
4. M81 暂不做归档恢复，删除审批通过后对象会从 MinIO 删除。

## 验收标准

- 生成归档时写入 `ARCHIVED` 审计事件。
- 生成下载链接时写入 `DOWNLOAD_URL_CREATED` 审计事件。
- 申请删除归档时写入 `DELETE_REQUESTED` 审计事件。
- 审批中心出现“归档删除”队列。
- 批准删除后对象从 MinIO 删除，并写入 `APPROVED` 与 `DELETE_APPLIED` 事件。
- 拒绝删除后对象保留，并写入 `REJECTED` 事件。
- Control API typecheck 通过。
- Web typecheck 通过。
