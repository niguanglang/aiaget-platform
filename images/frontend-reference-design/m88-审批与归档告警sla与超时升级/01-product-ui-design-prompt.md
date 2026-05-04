# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 安全中心 at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 让审批与归档运营告警具备 SLA 风险识别、临近超时提示、已超时升级和闭环追踪能力。
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui style components, existing `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`, TanStack Query.
- Existing page shell/layout: console dashboard layout with left navigation and dense enterprise admin panels. The page already contains security posture, policy simulation, operation alerts, notification audit, and notification auto retry cards.

Interface contract that must appear in the UI:
- API/service functions:
  - `GET /api/v1/security-center/operation-alert-sla/overview`
  - `POST /api/v1/security-center/operation-alert-sla/run-escalation`
  - existing `GET /api/v1/security-center/overview`
  - existing operation alert lifecycle actions
- Main entities and fields:
  - SLA policy: `enabled`, `due_minutes`, `warning_minutes`, `auto_escalate_enabled`, `lookback_hours`, `source`
  - SLA summary: `total_count`, `within_sla_count`, `warning_count`, `overdue_count`, `auto_escalated_count`, `closed_count`, `next_due_at`
  - SLA items: `alert_id`, `title`, `severity`, `status`, `sla_status`, `triggered_at`, `due_at`, `minutes_remaining`, `overdue_minutes`, `auto_escalated`, `last_action`, `last_note`
  - Last run result: `scanned_count`, `escalated_count`, `skipped_count`, `failed_count`, `finished_at`
- Status values/enums:
  - Alert status: `OPEN`, `ACKNOWLEDGED`, `ESCALATED`, `CLOSED`
  - SLA status: `WITHIN_SLA`, `WARNING`, `OVERDUE`, `CLOSED`
  - Task result: `SUCCESS`, `FAILED`, `SKIPPED`
- User actions:
  - 刷新 SLA
  - 立即扫描升级
  - 跳转处理审批
  - 查看审批审计
- Required states: loading, empty, error, disabled when SLA disabled, running, last result.

Design requirements:
- Make it look like a real production security operations console, not a marketing page.
- Use Bento Grid / Dashboard Layout with restrained glass cards, subtle borders, soft shadows, light backdrop blur, and clean Chinese copy.
- Add a compact SLA timeline/list region showing due time and overdue risk without overcrowding.
- Use status badges and small progress/timeline bars instead of decorative large gradients.
- Use a restrained technology/product style: white/blue/slate with small amber/red risk accents.
- Keep 3D/noise/gradient mesh extremely subtle if present and never distract from data.

Avoid:
- fake API fields not listed above
- oversized hero sections
- decorative orbs or glowing effects
- unreadable tiny text
- emoji
- unrelated charts or invented modules
