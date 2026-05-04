# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台 / Agent 协作中心
- Page/route: Agent 协作中心 at `/agent-teams`
- Target users/roles: 租户管理员、Agent 管理员、团队运行人员、审计/监控人员
- Business goal: 让用户在一个真实控制台页面中配置多 Agent 团队，并清晰查看团队任务运行轨迹、成员步骤、模型 Token、成本、Trace、接力记录和反馈。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, React Query, Tailwind CSS, shadcn-style local components, Lucide icons, Chinese UI copy.
- Existing page shell/layout: enterprise console shell with left navigation and topbar; page content constrained to max width; responsive dashboard layout; rounded 8px cards, subtle borders, soft shadows, glassy background.

Interface contract that must appear in the UI:
- API/service functions: `getAgentTeamOverview`, `listAgentTeams`, `getAgentTeam`, `listAgents`, `listUsers`, `startAgentTeamRun`, `createAgentTeamHandoff`, `createAgentTeamFeedback`.
- Main entities and fields:
  - Team: name, code, status, mode, max rounds, timeout seconds, handoff policy, owner, member count.
  - Run: objective, status, request_id, trace_id, total_steps, completed_steps, failed_steps, total_tokens, total_cost, latency_ms, error_message, started_at, ended_at.
  - Step: step_type, title, status, input_summary, output_summary, trace_id, span_id, parent_span_id, duration_ms, prompt_tokens, completion_tokens, total_tokens, cost_total, error_message, agent name/code.
  - Handoff: from agent, to agent, reason, status, decision note, decided by, decided at.
  - Feedback: rating, comment, author, created_at.
- Status values/enums:
  - Team status: DRAFT, ACTIVE, DISABLED, ARCHIVED.
  - Team mode: SEQUENTIAL, PARALLEL, SUPERVISOR.
  - Run status: QUEUED, RUNNING, WAITING_HUMAN, SUCCESS, FAILED, CANCELLED.
  - Step type: PLAN, AGENT_RUN, HANDOFF, VERIFY, SUMMARY.
  - Step status: PENDING, RUNNING, SUCCESS, FAILED, SKIPPED.
- User actions: search/filter teams, select team, start run, select a run, inspect steps, copy or open trace, create handoff, record feedback, add/edit members if authorized.
- Required states: loading, empty, error, validation, disabled, success, permission-denied where relevant.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic dashboard template.
- Use a Bento/Dashboard layout: left team list, right team detail, lower run trace workspace.
- The run trace workspace should be the visual focus: a run selector, summary metric strip, step timeline, execution detail panel, handoff/feedback side panel, and trace/usage mini cards.
- Use subtle border, soft shadow, backdrop blur, light noise texture feeling, clean white/neutral surfaces, restrained blue/green status accents.
- Use Motion-like subtle reveal/stagger interactions visually, but do not overdo animations.
- Use icon buttons for trace copy/open, refresh, edit, run, member actions.
- Keep typography compact and operational, with Chinese labels that fit cards and buttons.
- Show realistic data density without crowding.
- Include clear empty states for no run/no steps and disabled actions for missing permissions.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to project components
- unreadable tiny text, random charts, placeholder lorem ipsum
- emoji, cheap glow, excessive gradients, oversized rounded blobs, information overload
