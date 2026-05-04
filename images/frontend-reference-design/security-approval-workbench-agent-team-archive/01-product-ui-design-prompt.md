# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page extension.

Project context:
- Product/module: 企业 Agent 平台 / 安全中心 / 统一审批工作台
- Page/route: 安全细分审批工作台 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 把团队运行报告归档删除审批纳入统一安全审批工作台，让安全管理员不用进入 Agent 协作中心也能统一处理归档删除风险。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn 风格组件，使用 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState` 和 motion 微动效。
- Existing page shell/layout: 复用 `/security` 安全中心页面；只增强“安全细分审批工作台”卡片，不新建独立路由。

Interface contract that must appear in the UI:
- API/service functions: getSecurityApprovalWorkbenchOverview, listSecurityApprovalWorkbenchItems, getSecurityApprovalWorkbenchItem, reviewSecurityApprovalWorkbenchItem.
- Main entities and fields: approval id, type, source module, target label, description, status, risk domain, risk level, requester, reviewer, requested/reviewed time, request_id, trace_id, metadata, timeline.
- New type/status: `AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE` displayed as “团队运行报告归档删除”； status `PENDING/APPROVED/REJECTED/APPLIED`.
- New metadata fields: archive file name, archive key, archive size, team name, run objective, run id.
- User actions: search, filter by type/status/risk domain, select approval, view detail and timeline, approve, reject, open audit/trace links.
- Required states: loading, empty, error, disabled, success, permission-denied, pending approval, completed approval.

Design requirements:
- Production SaaS/admin style, compact and operational.
- The approval type selector should include “团队运行报告归档删除”.
- The approval queue row should clearly distinguish this new type with a restrained badge and audit-archive risk domain.
- The detail panel should show archive object path, file size, team/run context, request and trace IDs, and a timeline.
- Use Chinese labels and enterprise audit wording.
- Use subtle borders, soft shadows, clear spacing, no marketing hero.

Avoid:
- unrelated global archive center route
- invented approval actions beyond approve/reject
- decorative gradients, emoji, loud glow, oversized round blocks
