# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: M98 SLA 死信审计归档删除审批运营闭环 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: surface SLA dead-letter audit archive deletion approval backlog and rejection risk in the main approval/archive operations dashboard
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges
- Existing page shell/layout: security operations dashboard with metrics, operational alerts, audit/archive sections

Interface contract that must appear in the UI:
- API/service function: `getSecurityCenterOverview`
- Main data fields:
  - SLA 死信归档删除待审
  - SLA 死信归档删除已批准
  - SLA 死信归档删除已拒绝
  - SLA 死信归档删除已生效
- Operational alert examples:
  - SLA 死信归档删除等待审批
  - SLA 死信归档删除拒绝率偏高
- User actions:
  - 查看归档删除审批、处理运营告警、通知、确认、升级、关闭

Design requirements:
- Extend the existing approval/archive operations dashboard.
- Add a compact metric row/card for SLA dead-letter archive delete approval health.
- Keep operational alerts prominent but not noisy.
- Use Chinese UI text only.
- Use restrained enterprise SaaS styling, subtle borders and clean spacing.

Avoid:
- unrelated charts
- invented route or modal
- direct destructive delete action
- excessive gradients, emoji, glow
