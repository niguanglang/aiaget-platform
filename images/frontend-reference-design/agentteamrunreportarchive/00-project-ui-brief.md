# Project UI Brief

- Page: AgentTeamRunReportArchive
- Route: /agent-teams
- Feature goal: 团队运行报告归档
- Target users and permissions: Agent 管理员、租户管理员、审计员、安全管理员；创建/下载归档使用 `agent:team:view`，删除归档发起审批使用 `agent:team:view`，审批通过/拒绝使用 `security:approval:handle`。
- APIs/services: 新增 `POST /agent-teams/runs/:runId/report/archives`、`GET /agent-teams/report/archives`、`GET /agent-teams/report/archives/:archiveId/download-url`、`DELETE /agent-teams/report/archives/:archiveId`、`GET /agent-teams/report/archive-approvals`、`POST /agent-teams/report/archive-approvals/:approvalId/approve|reject`。前端新增对应 API Client。
- Entities/fields/statuses: 归档文件复用 Storage 对象字段 `id/key/file_name/folder/size_bytes/etag/last_modified/download_expires_in`，并补充 `run_id/team_id/team_name/run_objective/created_by`；删除审批状态 `PENDING/APPROVED/REJECTED/APPLIED`。
- Existing components/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn 风格；页面文件 `apps/web/src/components/agent-teams/agent-teams-content.tsx`，复用 `Card`、`StatusBadge`、`Button`、`EmptyState`、运行工作区和报告导出面板。
- Required states: 没有归档、创建中、下载中、删除审批已提交、审批中、审批失败、对象存储不可用、无审批权限、归档已删除。
- Constraints: 页面显示中文；不新增路由；不新增中间件或容器；归档写入现有 MinIO；删除归档必须先进入审批，不直接删除。
