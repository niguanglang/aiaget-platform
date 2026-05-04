# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the Enterprise Agent Platform `/agent-teams` run trace workspace.

Project context:
- Product/module: 企业 Agent 平台 / 多 Agent 协作中心
- Page/route: Agent 协作团队 at `/agent-teams`
- Target users/roles: Agent 管理员、租户管理员、审计员、安全管理员
- Business goal: 在团队运行步骤详情中展示成员 Agent 的内部执行子事件，让运营人员可以看到 RAG 检索、工具调用、模型调用、Token 和 Trace 关系。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui style components, lucide icons, existing Card/StatusBadge/Button/EmptyState/Metric blocks.
- Existing page shell/layout: enterprise console shell, team list and selected team detail, run trace workspace with run selector, summary metrics, left step timeline, right step detail panel.

Interface contract that must appear in the UI:
- API/service functions: `getAgentTeam`, `listAgentTeams`, `startAgentTeamRun`.
- Main entities and fields: `AgentTeamStepItem` with `child_steps`, `references`, `tool_calls`, `model_call`; child step fields `type/title/status/summary/trace_id/span_id/request_model/tool_name/retrieval_mode/latency_ms/tokens/cost/item_count`; reference fields `title/snippet/score/source_type`; tool call fields `tool_name/tool_code/status/latency_ms/response_status/output_preview/error_message`; model call fields `request_model/status/prompt_tokens/completion_tokens/total_tokens/latency_ms/response_preview/error_message`.
- Status values/enums: team step status `PENDING/RUNNING/SUCCESS/FAILED/SKIPPED`; child step status `done/failed/skipped`; tool call status `SUCCESS/FAILED/APPROVAL_REQUIRED/REJECTED`; model status `SUCCESS/FAILED`.
- User actions: select run, select team step, inspect child events, copy Trace, jump to monitor, inspect RAG references, inspect tool outputs and model usage.
- Required states: no run, no step, no child event, no RAG reference, no tool call, no model call, failed child event, trace missing.

Design requirements:
- Use a real Chinese enterprise operations console style, dense but readable.
- Primary layout: left timeline, right detail with tab-like sections or stacked panels for 子事件、知识引用、工具调用、模型调用.
- Keep visual hierarchy clear: top metrics, selected step header, child event timeline, side badges for status and tokens.
- Use subtle borders, soft shadows, and restrained background layering; no flashy glow.
- Preserve existing page style and avoid creating a new page or marketing hero.
- All visible text must be Chinese.

Avoid:
- invented routes or API actions
- unrelated charts or decorative visuals
- unreadable tiny text, oversized cards, excessive gradients, emoji, or overlapping content
