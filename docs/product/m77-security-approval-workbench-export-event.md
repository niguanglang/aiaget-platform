# M77 审批工作台导出事件检索与详情联动

## 目标

在 M76 已经把统一安全审批工作台导出行为写入平台事件后，继续把该事件纳入 `/security` 的安全事件详情中心。安全管理员和审计员可以按“审批工作台”来源筛选导出事件，查看导出数量、筛选条件、操作人、request_id 和 trace_id。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端增强

安全事件中心新增来源：

```text
APPROVAL_WORKBENCH
```

聚合平台事件：

```text
event_source = security_center
event_type   = platform.security.approval_workbench.exported
```

映射为安全事件：

```text
id                 = platform:{platform_event.id}
source             = APPROVAL_WORKBENCH
title              = 审批工作台导出
resource_type      = SECURITY_APPROVAL_WORKBENCH
resource_id        = approval-workbench
action             = export
path               = /security-center/approval-workbench/export
method             = GET
request_summary    = platform_event.payload_json
```

详情接口支持：

```text
GET /security-center/events/platform:{eventId}
```

## 前端增强

页面仍为：

```text
/security
```

安全事件详情中心新增：

```text
1. 来源筛选项“审批工作台”。
2. 事件列表来源标签“审批工作台”。
3. 详情抽屉标题“审批工作台导出事件”。
4. 导出摘要卡片：导出数量、筛选状态、审批类型、风险域。
5. 原始 payload 继续通过“请求摘要”JSON 面板展示。
```

## 参考设计

前端使用 `$frontend-reference-design` 工作流，参考设计资产位于：

```text
images/frontend-reference-design/security-approval-workbench-export-event/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
manifest.json
```

## 边界

1. 不新增独立导出审计页面。
2. 不改变 M76 导出接口和 CSV 字段。
3. 不新增平台事件表结构。
4. 不把全部平台事件纳入安全事件中心，只纳入审批工作台导出事件。

## 验收标准

1. 安全事件中心来源筛选包含“审批工作台”。
2. 审批工作台导出事件能在安全事件列表出现。
3. 详情抽屉展示导出数量和筛选条件。
4. request_id 和 trace_id 可以继续复制和跳转。
5. `/security` 新增文案均为中文。
6. Control API typecheck 通过。
7. Web typecheck 通过。
