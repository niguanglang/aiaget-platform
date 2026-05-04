# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the `/agent-teams` run trace workspace focused on team step sub-events.

Project context:
- Users/roles: Agent 管理员、租户管理员、审计员、安全管理员。
- Main task flow: 选择协作团队 -> 选择运行记录 -> 点击 AGENT_RUN 步骤 -> 查看成员内部 prompt/tool/knowledge/model/response 子步骤 -> 查看知识引用、工具调用和模型调用摘要 -> 复制 Trace 或跳转监控中心。
- API/service contract: `getAgentTeam` returns `AgentTeamDetail.steps`; each `AgentTeamStepItem` includes `child_steps`, `references`, `tool_calls`, `model_call`.
- Data entities and fields: team step, child run step, RAG reference, tool call, model call.
- Actions and states: select run, select step, copy trace, monitor jump; empty child events, no references, no tools, failed model call, permission read-only.

Prototype requirements:
- Low- to mid-fidelity wireframe style with Chinese section labels.
- Show regions: run selector, summary metrics, left step timeline, right step header, child event timeline, RAG references list, tool call list, model call card, trace/span footer.
- Make component boundaries obvious for mapping to existing Card, StatusBadge, EmptyState, RunMetric and PayloadBlock components.
- Keep layout realistic for current route; do not add a new navigation item.
- Include compact empty state placeholders for “暂无子事件 / 暂无引用 / 暂无工具调用 / 暂无模型调用”。

Avoid polished decorative rendering, invented fields, unrelated charts, and marketing-style composition.
