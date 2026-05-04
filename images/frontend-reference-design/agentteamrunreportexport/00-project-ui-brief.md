# Project UI Brief

- Page: AgentTeamRunReportExport
- Route: /agent-teams
- Feature goal: 团队运行报告导出
- Target users and permissions: Agent 管理员、租户管理员、审计员、安全管理员；导出使用 `agent:team:view`，因为报告属于运行审计查看能力，不修改业务数据。
- APIs/services: 新增 `GET /api/v1/agent-teams/runs/:runId/report/export` 返回 `text/csv`；前端新增 `exportAgentTeamRunReport(runId)` 下载 Blob。页面仍复用 `getAgentTeam`、`startAgentTeamRun`、接力和反馈接口。
- Entities/fields/statuses: 报告来源于 `AgentTeamRunSummary`、`AgentTeamStepItem`、`AgentTeamHandoffItem`、`AgentTeamFeedbackItem`。报告内容包括团队信息、运行摘要、成员步骤、子事件、RAG 引用、工具调用、模型调用、接力记录、反馈记录、Trace / Span、Token、成本、耗时和错误。
- Existing components/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn 风格；页面文件 `apps/web/src/components/agent-teams/agent-teams-content.tsx`，复用 `Button`、`StatusBadge`、`RunTraceWorkspace`、`RunSummaryPanel`、`RunReplayComparePanel`。
- Required states: 没有选择运行、报告导出中、导出失败、运行无步骤、无权限、Trace 缺失、失败运行、无子事件。
- Constraints: 页面显示中文；不新增页面路由；不新增中间件或容器；导出文件为 CSV，包含 BOM 兼容中文；只读导出，不触发外部服务。
