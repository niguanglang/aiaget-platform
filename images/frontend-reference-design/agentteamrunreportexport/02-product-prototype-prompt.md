# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the existing `/agent-teams` page extension.

Project context:
- Page/route: Agent 团队运行报告导出 at `/agent-teams`
- Users/roles: Agent 管理员、租户管理员、审计员、安全管理员
- Main task flow: 选择团队 -> 选择运行记录 -> 查看运行摘要/回放/对比 -> 点击“导出报告” -> 下载 CSV 审计报告 -> 可继续进入监控中心查看 Trace。
- API/service contract: `GET /agent-teams/runs/:runId/report/export` returns CSV Blob; existing `getAgentTeam` drives visible state.
- Data entities and fields: team, run, steps, child_steps, references, tool_calls, model_call, handoffs, feedback.
- Actions and states: export report, export loading, export failed, disabled when no run, disabled/no permission, copy trace, monitor link.

Prototype requirements:
- Low- to mid-fidelity wireframe style.
- Keep existing run workspace: run selector at top, summary, replay compare, step timeline/detail.
- Add a clearly labeled report export action beside Trace actions or below run summary.
- Show report coverage labels: 运行摘要、成员步骤、RAG、工具、模型、接力、反馈。
- Include error/status area for export failure.
- Use Chinese section labels and button text.

Avoid:
- new route or separate report builder page
- unsupported PDF/template designer features
- excessive decorative styling
