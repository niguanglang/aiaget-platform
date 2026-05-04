# M115 来源型运营告警通知审计检索增强

## 目标

M115 在 M114 来源型运营告警基础上，增强运营告警通知投递审计能力。安全管理员可以按来源分类筛选通知投递记录，按关键词检索 request_id、trace_id、告警 ID、Webhook 错误，并将当前筛选结果导出 CSV 或归档到对象存储。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 数据来源

复用现有平台事件：

```text
platform_event
```

读取事件类型：

```text
platform.security.approval_operation_alert.notification_sent
```

核心 payload 字段：

```text
alert_id
alert_category
status
channels
targets
webhook_status
webhook_error
retry_count
retried_from_event_id
delivered_at
```

## 后端接口

增强列表接口：

```text
GET /security-center/operation-alert-notifications
```

查询参数：

```text
status
alert_category
keyword
```

新增导出接口：

```text
GET /security-center/operation-alert-notifications/export
```

新增归档接口：

```text
POST /security-center/operation-alert-notifications/archives
GET  /security-center/operation-alert-notifications/archives
GET  /security-center/operation-alert-notifications/archives/:archiveId/download-url
```

归档前缀：

```text
audit-archives/security-operation-alert-notifications
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

新增能力：

```text
1. 来源分类筛选
2. 关键词检索
3. 当前筛选导出 CSV
4. 当前筛选创建对象存储归档
5. 归档列表下载
```

来源分类：

```text
NOTIFICATION_TASK
SLA_DEAD_LETTER_ARCHIVE_DELETE
NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE
NOTIFICATION_TASK_MIXED_FAILURE_SOURCE
ARCHIVE_OPERATION
NOTIFICATION_POLICY
RUNTIME_APPROVAL
SECURITY_OPERATION
```

## 兼容策略

1. 旧投递事件缺少 `alert_category` 时，列表仍展示为未分类。
2. 归档文件只写对象存储，不新增数据库记录。
3. 导出和归档都复用当前筛选条件。
4. 现有重试按钮逻辑不改变。

## 参考设计

```text
images/frontend-reference-design/m115-来源型运营告警通知审计检索增强/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M115 不新增数据库表。
2. M115 不执行数据库迁移。
3. M115 不启动任何容器或中间件。
4. M115 不改变运营告警生成规则。
5. M115 不改变通知投递和重试策略。

## 验收标准

- 通知投递审计支持按状态筛选。
- 通知投递审计支持按来源分类筛选。
- 通知投递审计支持关键词检索。
- 通知投递审计支持 CSV 导出。
- 通知投递审计支持对象存储归档和下载。
- 前端 `/security` 展示筛选、导出、归档和归档列表。
- Control API typecheck 通过。
- Web typecheck 通过。
