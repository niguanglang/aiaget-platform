# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS console page.

Project context:
- Product/module: 企业 AIAgent 平台 / Agent 协作中心
- Page/route: Agent 协作中心 at `/agent-teams`
- Target users/roles: 租户管理员、Agent 管理员、安全管理员、审计员
- Business goal: 管理多 Agent 团队，配置成员职责和执行顺序，启动团队任务，查看运行轨迹、接力记录和人工接管状态
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style local components, lucide-react icons, React Query
- Existing page shell/layout: enterprise console with left navigation and top shell, content max width, cards/tables/forms using subtle border and muted background

Interface contract that must appear in the UI:
- API/service functions: list/create/update/delete teams, add/update/remove members, start team run, create handoff, create feedback
- Main entities and fields:
  - agent_team: 名称、编码、描述、状态、协作模式、负责人、最大轮次、超时秒数、接力策略、更新时间
  - agent_team_member: Agent、角色、职责、执行顺序、是否必需、状态
  - agent_team_run: 目标、状态、trace_id、request_id、总步骤、已完成、失败、token、成本、耗时、开始/结束时间
  - agent_team_step: 类型、标题、状态、Agent、输入摘要、输出摘要、trace_id、耗时、成本
  - agent_team_handoff: 来源 Agent、目标 Agent、原因、状态、处理人、创建时间
- Status values/enums:
  - Team: DRAFT, ACTIVE, DISABLED, ARCHIVED
  - Run: QUEUED, RUNNING, WAITING_HUMAN, SUCCESS, FAILED, CANCELLED
  - Step: PENDING, RUNNING, SUCCESS, FAILED, SKIPPED
  - Handoff: PENDING, APPROVED, REJECTED, AUTO
- User actions: 新建团队、编辑团队、归档团队、添加成员、调整成员、删除成员、启动团队任务、查看运行详情、发起接力、记录反馈
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a production SaaS/admin product, not a generic template.
- Use Bento Grid / dashboard layout: KPI cards across the top, a filterable team table on the left, a selected-team detail and member panel on the right, and a run timeline below.
- Keep all visible UI copy in simplified Chinese.
- Use subtle border, soft shadow, backdrop blur only where appropriate, clean white/neutral surfaces, restrained blue/green/amber status accents.
- Include clear hierarchy for team health, active runs, waiting human handoff, failed steps, and cost.
- Use icons in buttons: Plus, Play, Edit, Trash, UserPlus, GitBranch, MessageSquare, Activity.
- Show realistic loading/empty/error placeholders as small operational states, not marketing text.
- Keep typography compact and suitable for repeated operational use.

Avoid:
- fake API fields not listed above
- decorative charts that cannot map to the contracts
- unreadable tiny text
- dark, glowing, over-gradient, emoji-heavy, or toy-like UI
- large rounded blobs or overlapping cards
