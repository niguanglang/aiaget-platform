# M78 审批审计列表与全局检索

## 目标

在 M77 统一审批审计事件表基础上，补齐独立的审批审计中心，让安全管理员和审计员可以跨来源检索工具审批、通知策略审批的完整事件台账。

本模块只新增代码和文档，不执行数据库迁移、不启动容器、不安装中间件。

## 前端页面

```text
/approval-audits
```

页面能力：

```text
1. 展示审批审计事件总量、成功、失败、警告和 Trace 覆盖指标
2. 展示来源分布和事件类型排行
3. 支持按时间窗口、审批来源、事件类型、事件状态、Trace 过滤
4. 支持按标题、备注、Trace ID、请求 ID、来源 ID、操作人检索
5. 展示事件详情、事件元数据、审批跳转和 Trace 跳转
6. 通过控制台导航入口进入，并复用 security:approval:view 权限
```

## 后端接口

复用审批模块路由：

```text
GET /api/v1/tool-approvals/audit-events/overview
GET /api/v1/tool-approvals/audit-events
GET /api/v1/tool-approvals/audit-events/:eventId
```

查询参数：

```text
window: 24h | 7d | 30d
keyword: string
source_type: TOOL_APPROVAL | NOTIFICATION_POLICY
event_type: REQUEST_CREATED | SUBMITTED | APPROVED | REJECTED | APPLIED | EXECUTION_FAILED
event_status: INFO | SUCCESS | WARNING | FAILED
trace_only: boolean
page: number
page_size: number
```

## 数据来源

```text
approval_audit_event
```

当前接入来源：

```text
TOOL_APPROVAL
NOTIFICATION_POLICY
```

## 参考设计

```text
images/frontend-reference-design/m78-approval-audit-search/
```

## 权限

```text
security:approval:view
```

该权限同时控制：

```text
1. 审批审计菜单入口
2. 审批审计概览接口
3. 审批审计列表接口
4. 审批审计详情接口
```

## 边界

1. M78 不回填历史审批数据。
2. M78 不新增数据库表，依赖 M77 的 `approval_audit_event`。
3. M78 暂不做审计导出，导出可在后续审计中心增强里统一实现。
4. 当前全局检索限定在审批审计来源，不替代 `/audit` 的操作日志与安全事件查询。

## 验收标准

- 控制台导航出现“审批审计”入口。
- 审批审计页可以加载概览、列表和详情。
- 支持多条件筛选和关键词检索。
- 事件详情可以跳转审批详情和监控 Trace。
- Control API typecheck 通过。
- Web typecheck 通过。
