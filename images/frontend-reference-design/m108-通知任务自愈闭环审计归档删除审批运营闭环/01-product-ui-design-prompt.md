# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 审批与归档运营
- Page/route: M108 通知任务自愈闭环审计归档删除审批运营闭环 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 将 M107 自愈闭环审计归档删除审批纳入安全中心运营总览，展示待审、批准、拒绝、生效、闭环率和自动推导的运营告警。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn/ui-style cards/buttons/badges, lucide icons, restrained enterprise SaaS dashboard.
- Existing page shell/layout: Reuse the current `/security` page with `ApprovalArchiveOperationsCard`; keep cards compact, bordered, light shadow, backdrop-blur, responsive dashboard layout.

Interface contract that must appear in the UI:
- API/service functions: `GET /security-center/overview`, reuse M107 archive approval actions as downstream links.
- Main entities and fields: `SecurityCenterOverview.approval_operations`, `operational_alerts[]`, `notification_task_recovery_audit_archive_delete_pending`, `notification_task_recovery_audit_archive_delete_approved`, `notification_task_recovery_audit_archive_delete_rejected`, `notification_task_recovery_audit_archive_delete_applied`.
- Status values/enums: operational alert status `OPEN/ACKNOWLEDGED/ESCALATED/CLOSED`, delete approval status `PENDING/APPROVED/REJECTED/APPLIED`, risk severity `LOW/MEDIUM/HIGH`.
- User actions: view archive delete approvals, handle approvals, view operational alerts, acknowledge/escalate/close alerts through existing alert cards.
- Required states: loading, empty alerts, pending backlog, rejected risk, storage degraded, disabled action while updating.

Design requirements:
- Make it look like a production enterprise admin product, not a landing page or template.
- Use a clear bento/dashboard hierarchy: top summary card, existing approval metrics, dedicated “通知任务自愈归档删除审批运营” section, alert closure area.
- Show four metric tiles for self-healing audit archive deletion: 待审批、已批准、已拒绝、闭环率 / 已生效.
- Add compact status badges: `M108`, `存在待审/已闭环`, `拒绝复核/运行正常`.
- Keep the visual language minimal, technical and clean: subtle border, soft shadow, light background, no heavy glow, no emoji, no excessive gradients.
- UI text must be Chinese and fit compact admin cards.
- Emphasize operational clarity: counts, ratios, risk signal, and next action should be scannable within one viewport.

Avoid:
- fake API fields not listed above
- decorative charts that cannot map to existing components
- large marketing hero sections
- overuse of gradients, oversized cards, or crowded information
