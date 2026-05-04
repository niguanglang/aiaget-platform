# M79 审批审计导出与审计中心联动

## 目标

在 M78 审批审计列表基础上，补齐导出能力，并把审批审计来源纳入统一审计中心，形成“审计发现风险 -> 跳转审批审计 -> 检索详情 -> 导出留痕”的闭环。

本模块只新增代码和文档，不执行数据库迁移、不启动容器、不安装中间件。

## 后端能力

新增 CSV 导出接口：

```text
GET /api/v1/tool-approvals/audit-events/export
```

支持和列表一致的筛选参数：

```text
window
keyword
source_type
event_type
event_status
trace_only
```

统一审计中心新增来源：

```text
approval_audit
```

审计中心会把 `approval_audit_event` 映射为统一审计事件，用于概览、筛选、失败样本和详情查看。

## 前端能力

审计中心：

```text
/audit
```

新增：

```text
1. 审批审计风险入口卡片
2. 审批事件、失败事件、Trace 覆盖指标
3. 最近审批风险样本
4. 跳转审批审计中心
5. 来源筛选支持“审批审计”
```

审批审计中心：

```text
/approval-audits
```

新增：

```text
1. 导出 CSV 按钮
2. 根据当前筛选条件导出
3. 空数据或加载中禁用导出
4. 导出成功和失败提示
5. 支持从审计中心携带 window 和 eventId 参数跳转
```

## 参考设计

```text
images/frontend-reference-design/m79-审计中心联动与导出/
```

## 权限

审计中心：

```text
security:audit:view
```

审批审计导出：

```text
security:approval:view
```

## 边界

1. M79 不新增数据库表。
2. M79 不做异步导出任务，CSV 由当前请求同步生成。
3. M79 导出上限由服务端加载限制控制，适合运营审计留痕，不作为大规模离线数仓导出。
4. M79 暂不接对象存储归档，后续可以把导出文件写入 MinIO 并生成审计下载记录。

## 验收标准

- `/audit` 可以看到审批审计来源和联动入口。
- `/audit` 来源筛选包含“审批审计”。
- `/approval-audits` 可以按当前筛选条件导出 CSV。
- 导出按钮在加载或无数据时禁用。
- 导出接口复用租户隔离和 `security:approval:view` 权限。
- Control API typecheck 通过。
- Web typecheck 通过。
