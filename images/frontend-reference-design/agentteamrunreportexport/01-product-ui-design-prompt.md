# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page extension.

Project context:
- Product/module: 企业 Agent 平台 / 多 Agent 协作中心
- Page/route: Agent 团队运行报告导出 at `/agent-teams`
- Target users/roles: Agent 管理员、租户管理员、审计员、安全管理员
- Business goal: 对选中的团队运行生成可审计 CSV 报告，覆盖运行摘要、成员输出、RAG 引用、工具调用、模型用量、接力和反馈。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn 风格组件；现有页面使用 `Card`、`StatusBadge`、`Button`、`EmptyState`、紧凑指标和分栏详情。
- Existing page shell/layout: 保持 `/agent-teams` 现有后台布局；新导出入口位于运行选择器右侧操作区和运行回放区，不新增页面。

Interface contract that must appear in the UI:
- API/service functions: new `exportAgentTeamRunReport(runId)` calling `GET /agent-teams/runs/:runId/report/export`; existing `getAgentTeam` provides visible run data.
- Main entities and fields: team name/code, run objective/status/trace_id/request_id/total_steps/failed_steps/total_tokens/total_cost/latency_ms, step title/status/agent_name/output_summary, child_steps, references, tool_calls, model_call, handoffs, feedback.
- Status values/enums: run status `QUEUED/RUNNING/WAITING_HUMAN/SUCCESS/FAILED/CANCELLED`; step status `PENDING/RUNNING/SUCCESS/FAILED/SKIPPED`.
- User actions: select run, export CSV report, copy Trace, open monitor trace, inspect replay/compare, save feedback.
- Required states: no selected run, export loading, export failed, no permission, missing trace, failed run, no child events.

Design requirements:
- Production SaaS/admin style, compact and operational.
- Show a restrained “审计报告” action area with export status, report coverage badges, and download button.
- Use Chinese text throughout.
- Use subtle borders, soft shadows, clear hierarchy, no hero or marketing layout.
- Show the button state: normal, exporting, disabled.
- Keep visual mapping to existing components and current route.

Avoid:
- fake report formats not supported by backend
- unrelated charts or report designer UI
- decorative gradients, emoji, loud glow, oversized rounded blocks
- new sidebar routes or modal-heavy flow
