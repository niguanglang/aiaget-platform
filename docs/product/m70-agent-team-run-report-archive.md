# M70 多 Agent 团队运行报告归档

## 目标

M70 在 M69 即时 CSV 导出基础上，把单次多 Agent 团队运行报告写入对象存储，并补齐归档列表、短期下载链接、删除申请和安全审批闭环。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。对象存储复用现有 MinIO `StorageService`，删除审批复用 `approval_audit_event` 事件表。

## 已实现

### Control API

新增接口：

```text
POST   /api/v1/agent-teams/runs/:runId/report/archives
GET    /api/v1/agent-teams/report/archives
GET    /api/v1/agent-teams/report/archives/:archiveId/download-url
DELETE /api/v1/agent-teams/report/archives/:archiveId
GET    /api/v1/agent-teams/report/archive-approvals
POST   /api/v1/agent-teams/report/archive-approvals/:approvalId/approve
POST   /api/v1/agent-teams/report/archive-approvals/:approvalId/reject
```

权限：

```text
agent:team:view              创建、列表、下载、申请删除
security:approval:handle     通过或拒绝删除审批
```

归档对象路径：

```text
agent-team-run-reports/{teamId}/{timestamp}-{runId}.csv
```

删除审批 source type：

```text
AGENT_TEAM_RUN_REPORT_ARCHIVE
```

审批事件链：

```text
DELETE_REQUESTED -> PENDING
APPROVED -> APPROVED
REJECTED -> REJECTED
DELETE_APPLIED -> APPLIED
```

### 前端页面

页面仍为：

```text
/agent-teams
```

运行工作区新增“报告归档”区域：

```text
1. 生成归档
2. 当前运行归档数量、团队归档数量、待删除审批、下载有效期
3. 归档文件列表：文件名、范围、大小、更新时间、对象路径
4. 短期下载链接打开
5. 申请删除，不直接删除
6. 删除审批列表
7. 有权限账号可通过并删除或拒绝删除
```

页面文案全部使用中文，并复用现有 `Card`、`Button`、`StatusBadge`、`EmptyState`、紧凑表格和运行工作区样式。

### API Client 与类型

新增共享类型：

```text
AgentTeamRunReportArchiveItem
AgentTeamRunReportArchiveListResult
CreateAgentTeamRunReportArchiveResult
AgentTeamRunReportArchiveApprovalStatus
AgentTeamRunReportArchiveApprovalItem
```

新增前端 API Client：

```text
createAgentTeamRunReportArchive
listAgentTeamRunReportArchives
getAgentTeamRunReportArchiveDownloadUrl
deleteAgentTeamRunReportArchive
listAgentTeamRunReportArchiveApprovals
approveAgentTeamRunReportArchiveApproval
rejectAgentTeamRunReportArchiveApproval
```

## 联动关系

- M69 报告导出：归档内容复用同一 CSV 构建逻辑。
- MinIO 存储中心：归档对象进入租户隔离对象路径，并通过短期 URL 下载。
- 安全审批：删除归档必须先写入审批事件，审批通过后才调用对象存储删除。
- 审计链路：归档生成、下载链接生成、删除申请、审批、拒绝和删除生效都会写审批审计事件。
- 多 Agent 协作中心：归档入口在运行轨迹中，按当前运行优先展示，缺少当前运行归档时展示同团队归档。

## 边界

1. 不新增全局归档中心路由。
2. 不新增表结构，删除审批状态从事件链推导。
3. 不在对象存储 metadata 写入中文业务文本，中文信息保存在审计事件 metadata 中。
4. 不做归档恢复；审批通过后对象从 MinIO 删除。
5. 列表默认读取最近 200 个团队报告归档对象。

## 参考设计

前端使用 `$frontend-reference-design` 工作流，参考设计资产位于：

```text
images/frontend-reference-design/agentteamrunreportarchive/
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
1. 有 agent:team:view 权限的用户可以为团队运行生成 CSV 归档。
2. 归档文件写入现有 MinIO 租户路径。
3. 页面可以列出归档、显示大小和更新时间。
4. 下载按钮生成 5 分钟短期 URL 并打开。
5. 删除按钮只提交审批申请，不直接删除对象。
6. 重复删除同一归档时复用已有待审批记录。
7. 有 security:approval:handle 权限的用户可以通过并删除或拒绝删除。
8. 审批通过后对象存储文件被删除，并记录 DELETE_APPLIED。
9. Control API 和 Web typecheck 通过。
```

## 下一步

安全中心细分审批继续建议把团队运行报告归档删除审批纳入统一审批工作台，让安全管理员可以在 `/security` 聚合处理该类审批，而不是只在 `/agent-teams` 内处理。
