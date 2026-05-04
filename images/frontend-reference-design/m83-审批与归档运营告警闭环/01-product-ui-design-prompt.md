# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent Platform security center enhancement.

Project context:
- Product/module: 企业 AI Agent 平台，安全中心
- Page/route: `m83-审批与归档运营告警闭环` at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: turn approval backlog, archive storage risk, approval audit failures and low trace coverage into visible, actionable operational alerts.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-like Card/Button/StatusBadge/EmptyState, lucide-react icons, TanStack Query, Motion.
- Existing page shell/layout: security center dashboard with security posture, module cards, M82 approval/archive operations Bento card, risk signals and security event list.

Interface contract that must appear in the UI:
- API/service function: `getSecurityCenterOverview()`
- Backend endpoint: `GET /api/v1/security-center/overview`
- Type: `SecurityCenterOverview.approval_operations.operational_alerts`
- Alert fields: id, title, description, severity, href, metric, action_label.
- Alert severity values: LOW, MEDIUM, HIGH.
- Alert sources:
  - 审批积压
  - 运行时工具审批
  - 高影响策略审批
  - 归档删除审批
  - 审批审计失败/告警
  - Trace 覆盖不足
  - 归档存储异常
  - 归档为空
- User actions: click `处理` button to `/approvals`, `/approval-audits`, `/audit`, `/security`.
- Required states: loading, empty alert, warning alert, high risk alert, archive storage degraded.

Design requirements:
- Chinese UI labels only.
- Production enterprise SaaS console style, dense but readable.
- Use Bento/dashboard layout with subtle borders, soft shadow, backdrop blur.
- The `运营告警闭环` region should live inside or directly under `审批与归档运营`.
- Critical alert items should be scannable with severity badge, metric, description and a compact action button.
- Empty state should say the approval/archive operation is currently stable.

Avoid:
- new unrelated routes
- fake charts
- emoji
- overdone gradients
- fields not listed in the contract
