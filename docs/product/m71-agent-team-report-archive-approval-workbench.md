# M71 团队运行报告归档删除接入统一审批工作台

## 目标

M71 在 M70 团队运行报告归档删除审批基础上，把 `AGENT_TEAM_RUN_REPORT_ARCHIVE` 审批事件纳入 `/security` 安全细分审批统一工作台。安全管理员可以在统一队列中筛选、查看和处理“团队运行报告归档删除”审批，不必回到 Agent 协作中心逐项处理。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 已实现

### 统一审批类型

新增工作台审批类型：

```text
AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE
```

中文显示：

```text
团队运行报告归档删除
```

风险域和风险等级：

```text
risk_domain = AUDIT_ARCHIVE
risk_level  = CRITICAL
```

### 后端聚合

`SecurityApprovalWorkbenchService` 新增读取来源：

```text
approval_audit_event.source_type = AGENT_TEAM_RUN_REPORT_ARCHIVE
event_type in DELETE_REQUESTED, APPROVED, REJECTED, DELETE_APPLIED
```

映射到统一工作台字段：

```text
source_module = 团队运行报告归档
title         = 团队运行报告归档删除
target_label  = archive_file_name
metadata      = archive_id / archive_key / archive_file_name / archive_size_bytes / team_id / team_name / run_id / run_objective
timeline      = 删除申请、审批通过、审批拒绝、删除生效事件
```

### 审批转发

统一工作台处理审批时转发到：

```text
AgentTeamsService.approveRunReportArchiveDeleteApproval
AgentTeamsService.rejectRunReportArchiveDeleteApproval
```

审批通过后继续由 M70 的服务删除 MinIO 对象，并写入 `DELETE_APPLIED` 事件。

### 前端页面

页面仍为：

```text
/security
```

增强点：

```text
1. 审批类型筛选增加“团队运行报告归档删除”。
2. 工作台说明文案补充团队运行报告来源。
3. 详情 metadata 中文标签补充团队 ID、团队名称、运行 ID、运行目标。
4. 现有队列表格、详情面板、时间线、审批备注和通过/拒绝按钮复用原交互。
```

## 技术加固

统一审批工作台的归档事件分组优先使用事件 `source_id`，再回退到 `archive_id`。这样审批通过和删除生效事件即使只携带 `archive_key`，也能和删除申请归并到同一条审批时间线。

## 参考设计

前端使用 `$frontend-reference-design` 工作流，参考设计资产位于：

```text
images/frontend-reference-design/security-approval-workbench-agent-team-archive/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
manifest.json
```

## 验收标准

```text
1. `/security` 统一审批工作台的类型筛选包含“团队运行报告归档删除”。
2. M70 创建的删除申请能出现在统一审批工作台。
3. 列表和详情能显示归档文件、对象路径、团队和运行上下文。
4. 审批时间线能展示删除申请、批准、拒绝或删除生效事件。
5. 在统一工作台通过审批后，归档对象被删除并进入 APPLIED 状态。
6. 在统一工作台拒绝审批后，归档保留并进入 REJECTED 状态。
7. Control API 和 Web typecheck 通过。
```

## 下一步

安全中心细分审批后续可以继续把“团队运行报告归档删除”纳入运营告警和通知链路，例如待审批超时、拒绝积压、删除失败自动告警和通知重试。
