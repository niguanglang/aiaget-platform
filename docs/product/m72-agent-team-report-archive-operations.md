# M72 团队运行报告归档删除审批运营闭环

## 目标

在 M70 团队运行报告归档和 M71 统一审批工作台基础上，把团队运行报告归档删除审批纳入安全中心 `/security` 的审批与归档运营看板、风险信号和运营告警闭环。

本里程碑只做运营可视化与告警闭环，不新增中间件、不新增数据库表、不启动新的容器，也不扩展自动通知任务投递。

## 范围

1. 安全中心总览新增团队运行报告归档删除统计：待审、已批准、已拒绝、已生效。
2. 后端基于 `approval_audit_event.source_type = AGENT_TEAM_RUN_REPORT_ARCHIVE` 聚合删除审批事件。
3. 风险信号新增团队运行报告归档删除待审批和拒绝偏多提示。
4. 运营告警新增团队运行报告归档删除待审批和拒绝偏多闭环项。
5. 前端 `/security` 的“审批与归档运营”新增团队运行报告归档删除审批运营区。
6. 通知投递审计分类识别 `AGENT_TEAM_REPORT_ARCHIVE_DELETE`，便于手动通知后的投递记录筛选和查看。

## 后端设计

### 数据来源

读取审批审计事件：

```text
source_type: AGENT_TEAM_RUN_REPORT_ARCHIVE
event_type:
  DELETE_REQUESTED
  APPROVED
  REJECTED
  DELETE_APPLIED
```

按 `source_id` 聚合最新状态：

```text
DELETE_REQUESTED -> 待审
APPROVED -> 已批准
REJECTED -> 已拒绝
DELETE_APPLIED -> 已生效
```

### 新增总览字段

```text
agent_team_report_archive_delete_pending
agent_team_report_archive_delete_approved
agent_team_report_archive_delete_rejected
agent_team_report_archive_delete_applied
```

### 新增风险信号

```text
agent-team-report-archive-delete-pending-risk
agent-team-report-archive-delete-rejected-risk
```

### 新增运营告警

```text
agent-team-report-archive-delete-pending
agent-team-report-archive-delete-rejected-risk
```

告警分类：

```text
AGENT_TEAM_REPORT_ARCHIVE_DELETE
```

通知目标复用归档删除类策略：

```text
HIGH: 租户管理员、安全管理员、审计员
其他: 安全管理员、审计员
```

## 前端设计

页面：`/security`

组件：`ApprovalArchiveOperationsCard`

新增展示：

1. “归档删除待审”汇总纳入团队报告归档删除待审数量。
2. 新增“团队运行报告归档删除审批运营”区块。
3. 新增四个运营指标：团队报告删除待审、团队报告已批准、团队报告已拒绝、团队报告闭环率。
4. 总体状态在拒绝偏多时显示“团队归档风险”。
5. 底部运营摘要新增团队报告归档删除待审、拒绝、生效数据。
6. 通知投递审计筛选项新增“团队报告归档删除”。

## 参考设计

参考设计工作区：

```text
images/frontend-reference-design/security-agent-team-report-archive-operations/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 验收标准

1. `GET /api/v1/security-center/overview` 返回团队运行报告归档删除审批统计。
2. 存在待审删除申请时，安全中心风险信号和运营告警能显示对应团队报告项。
3. 拒绝数量不低于已生效数量时，显示拒绝偏多风险。
4. `/security` 页面显示团队运行报告归档删除审批运营区，所有文案为中文。
5. 通知投递审计支持 `AGENT_TEAM_REPORT_ARCHIVE_DELETE` 分类标签与筛选。
6. 类型检查通过，且不需要数据库迁移或新增中间件。
