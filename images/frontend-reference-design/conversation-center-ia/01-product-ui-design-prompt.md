# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 会话中心
- Page/route: 会话中心列表 at `/conversations`
- Target users/roles: 租户管理员、Agent 管理员、审计员、普通授权用户
- Business goal: 用户在列表页完成会话查询、状态识别、归档和进入详情；消息流、继续对话、运行轨迹、工具调用、引用来源和反馈必须进入详情页。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-style Button/Card/Input/EmptyState/MetricCard/StatusBadge, React Query, motion/react.
- Existing page shell/layout: console shell with left navigation and top bar, content max width 7xl, clean dashboard/list layout, subtle border and soft shadow.

Interface contract that must appear in the UI:
- API/service functions: `listConversations`, `deleteConversation`, `listAgents`; route links to `/conversations/create` and `/conversations/[id]`.
- Main entities and fields: `title`, `agent_name`, `user.email`, `status`, `message_count`, `feedback_count`, `last_run_status`, `last_message_preview`, `last_message_at`, `updated_at`.
- Status values/enums: `ACTIVE`, `ARCHIVED`, run status label from existing helper.
- User actions: 新建会话、搜索、按智能体筛选、按状态筛选、清空筛选、查看详情、归档确认。
- Required states: loading, empty, error, disabled, permission-denied, no-published-agent, mutation pending, archive confirmation.

Design requirements:
- Make it look like a production SaaS/admin product.
- Use only fields/actions listed above.
- Show the primary workflow clearly: filter list -> scan thread status -> open detail or archive -> create via route page.
- Use bento metrics above the table: 会话、消息、进行中、反馈.
- Keep list rows compact and scannable; do not render chat composer, full messages, run traces, feedback forms, or tool call timelines.
- Use a coherent component system: hero/status badges, metric cards, filter toolbar, table, row actions, archive confirmation, empty/error states.
- Style direction: 极简、科技、高级、产品感强；细边框、轻阴影、轻微玻璃质感、克制动效感。

Avoid:
- invented API fields not listed above
- quick chat panel or selected conversation detail on the list page
- message history cards, runtime trace cards, feedback form, tool call list inside `/conversations`
- unreadable tiny text, decorative heavy glow, overpacked tables
