# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the existing `/agent-teams` page extension.

Project context:
- Page/route: Agent 团队运行回放与对比 at `/agent-teams`
- Users/roles: Agent 管理员、租户管理员、审计员、安全管理员
- Main task flow: 选择协作团队 -> 选择运行记录 -> 查看运行摘要和步骤时间线 -> 查看当前运行回放 -> 对比上一轮运行 -> 进入监控中心 Trace 或处理接力/反馈。
- API/service contract: 复用 `getAgentTeam` 返回的 `runs/steps/handoffs/feedback`，前端通过 `steps.run_id` 和 `run.id` 分组；不新增 API。
- Data entities and fields: run status、objective、trace_id、total_steps、completed_steps、failed_steps、total_tokens、total_cost、latency_ms；step run_id、member_id、agent_name、step_type、status、output_summary、child_steps、references、tool_calls、model_call。
- Actions and states: run select、copy trace、open monitor、step select、handoff submit、feedback save；empty run、no previous run、failed run、missing trace、readonly permission。

Prototype requirements:
- Low- to mid-fidelity wireframe.
- Keep the existing page regions: team list, right detail panel, lower run workspace.
- Focus the new area inside run workspace:
  1. current run replay summary row
  2. selected step timeline and detail
  3. comparison panel for current run vs previous run
  4. member output delta list
  5. RAG / tool / model delta blocks
- Show clear component boundaries and Chinese labels.
- Include empty state box for “暂无上一轮可对比”。
- Keep layout realistic for a responsive admin console.

Avoid:
- decorative hero or marketing layout
- fake filters/actions unsupported by current contract
- overly deep nesting or unreadable tiny labels
