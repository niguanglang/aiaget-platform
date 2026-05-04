# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page extension.

Project context:
- Product/module: 企业 Agent 平台 / 安全中心 / 审批与归档运营
- Page/route: 审批与归档运营 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 把团队运行报告归档删除审批纳入安全运营看板，展示待审、批准、拒绝、生效和告警闭环，让安全管理员能及时发现审计归档删除风险。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn 风格组件，使用 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState` 和 motion 微动效。
- Existing page shell/layout: 复用 `/security` 安全中心页面；增强现有“审批与归档运营”卡片，不新建路由。

Interface contract that must appear in the UI:
- API/service functions: `getSecurityOverview` loads `SecurityCenterOverview.approval_operations`.
- Main fields: tool pending, notification pending, archive delete pending, agent team report archive delete pending/approved/rejected/applied, SLA dead letter archive delete stats, notification task recovery archive delete stats, operational alerts.
- New operational alerts: `agent-team-report-archive-delete-pending`, `agent-team-report-archive-delete-rejected-risk`.
- User actions: open unified approval workbench, open security operational alerts, open approval audits.
- Required states: loading, no alert, pending review, rejected risk, storage unavailable.

Design requirements:
- Production SaaS/admin style, compact and operational.
- Add a “团队运行报告归档删除审批运营” band under the summary metrics and before SLA dead letter operations.
- Show four tiles: 待审、已批准、已拒绝、闭环率.
- Add concise Chinese explanatory text and a button to view the unified approval workbench.
- Existing summary “归档删除待审” should include team report archive pending count.
- Operational alerts list should naturally include the two new alert types when triggered.
- Use subtle borders, soft shadows, clear hierarchy, no marketing hero.

Avoid:
- new global archive route
- invented batch approval actions
- decorative gradients, emoji, loud glow, oversized round blocks
