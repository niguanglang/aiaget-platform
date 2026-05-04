# M76 统一安全审批工作台导出与审计联动

## 目标

在 M117 和 M75 的统一审批工作台基础上，补齐筛选结果导出能力。安全管理员可以在 `/security` 按审批类型、状态、风险域和关键词筛选后，一键导出当前范围 CSV；平台同时写入导出审计事件，便于审计员追踪谁导出了哪些审批数据。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端接口

新增接口：

```text
GET /security-center/approval-workbench/export
```

权限：

```text
security:approval:view
```

查询参数复用统一审批工作台列表：

```text
keyword
type
status
risk_domain
```

导出规则：

```text
1. 使用与列表相同的筛选逻辑。
2. 不使用分页参数。
3. 单次最多导出 5000 条。
4. 返回 `text/csv; charset=utf-8`。
```

## CSV 字段

导出列：

```text
审批ID
来源ID
审批类型
来源模块
标题
状态
风险域
风险等级
审批对象ID
审批对象
审批原因
申请人
申请人邮箱
审批人
审批人邮箱
申请时间
审批时间
请求ID
Trace ID
```

## 审计事件

每次导出写入平台事件：

```text
event_source = security_center
event_type   = platform.security.approval_workbench.exported
resource_type = SECURITY_APPROVAL_WORKBENCH
resource_id   = approval-workbench
status        = SUCCESS
```

payload：

```json
{
  "exported_count": 12,
  "filter": {
    "keyword": "trace-001",
    "type": "AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE",
    "status": "PENDING",
    "risk_domain": "AUDIT_ARCHIVE"
  }
}
```

事件保留 `request_id` 和 `trace_id`，可在审计中心或监控中心追踪。

## 前端页面

页面仍为：

```text
/security
```

统一审批工作台新增：

```text
1. “导出当前筛选”按钮。
2. 导出中禁用态。
3. 导出成功中文提示。
4. 导出失败中文提示。
5. 当前筛选命中数量说明。
```

## 参考设计

前端使用 `$frontend-reference-design` 工作流，参考设计资产位于：

```text
images/frontend-reference-design/security-approval-workbench-export-audit/
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

1. 不新增归档下载中心。
2. 不创建对象存储归档文件。
3. 不新增审批类型。
4. 不改变审批处理流程。
5. 不导出详情 metadata 和 timeline，避免 CSV 过宽；详情仍通过工作台接口查看。

## 验收标准

1. `/security` 统一审批工作台展示“导出当前筛选”。
2. 无 `security:approval:view` 权限时不可导出。
3. 当前筛选无结果时导出按钮禁用。
4. 导出接口返回 CSV。
5. 导出行为写入平台事件。
6. 导出成功和失败都有中文反馈。
7. Control API typecheck 通过。
8. Web typecheck 通过。
