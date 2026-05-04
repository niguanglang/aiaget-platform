# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent Platform security center enhancement.

Project context:
- Product/module: 企业 AI Agent 平台，安全中心
- Page/route: `m85-审批与归档告警生命周期` at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: allow approval/archive operational alerts to be acknowledged, escalated, and closed directly from the security center.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-like Card/Button/StatusBadge/EmptyState, lucide-react icons, TanStack Query, Motion.
- Existing page shell/layout: security center with `审批与归档运营` card, `运营告警闭环` alert cards, notification controls from M84.

Interface contract:
- `SecurityCenterOverview.approval_operations.operational_alerts`
- `SecurityCenterOperationalAlert.status`
- `SecurityCenterOperationalAlert.last_action`
- `SecurityCenterOperationalAlert.last_note`
- `POST /api/v1/security-center/operation-alerts/:alertId/actions`
- Actions: `ACKNOWLEDGE`, `ESCALATE`, `CLOSE`
- Statuses: `OPEN`, `ACKNOWLEDGED`, `ESCALATED`, `CLOSED`

Design requirements:
- Chinese UI labels only.
- Add lifecycle status badge and compact action buttons on each alert card.
- Keep primary处理 link and notification secondary; lifecycle actions should be visible but not noisy.
- Show disabled state for closed alerts.
- Show latest action note/time as compact metadata.
- Enterprise SaaS style with subtle borders and clean hierarchy.

Avoid:
- new full page
- modal-heavy workflow
- fake assignee fields
- emoji
- overdone gradients
