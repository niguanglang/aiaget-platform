# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 审批与归档运营告警闭环
- Page/route: M114 自愈闭环失败来源运营告警升级 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: convert notification task failure source categories into actionable operational alerts that can be acknowledged, escalated, closed, and notified.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges.
- Existing page shell/layout: Reuse current `/security` approval/archive operations card and operational alert grid.

Interface contract that must appear in the UI:
- Operational alert cards for SLA dead-letter failure source, self-healing archive failure source, and mixed source failure.
- Each alert card shows risk level, lifecycle status, category badge, metric, title, description, action link, notify button, and lifecycle buttons.
- Notification delivery audit shows category badges for notification task source alerts.
- Existing generic notification task risk alerts remain available as fallback.

Design requirements:
- Chinese UI text only.
- Dense enterprise dashboard style, clear hierarchy, compact badges.
- Subtle borders, soft shadow, glass-like background consistent with existing security center.
- No large decorative visuals, no marketing layout.

Avoid:
- new route
- modal-heavy workflow
- adding unsupported chart types
- changing existing approval/archive layout hierarchy
