# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 告警运营
- Page/route: 告警运营 at `/security/alerts`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 在统一安全审批工作台里纳入“客户成功成交复盘报告归档删除审批”，让待审、批准、拒绝、生效和运营告警在同一页面可观察、可处理、可通知。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件；使用 `Card`、`MetricCard`、`StatusBadge`、`Button`、`SecurityConfirmDialog`、`EmptyState`、`LoadingRows`。
- Existing page shell/layout: 顶部工作台标题和刷新按钮；上方指标卡；中部审批工作台列表 + 详情面板；下方运营告警、通知审计和 SLA 告警。

Interface contract that must appear in the UI:
- API/service functions: `getSecurityCenterOverview`, `getSecurityApprovalWorkbenchOverview`, `listSecurityApprovalWorkbenchItems`, `getSecurityApprovalWorkbenchItem`, `reviewSecurityApprovalWorkbenchItem`, `notifySecurityOperationAlert`, `updateSecurityOperationAlert`.
- Main fields: `customer_success_close_won_report_archive_delete_pending`, `customer_success_close_won_report_archive_delete_approved`, `customer_success_close_won_report_archive_delete_rejected`, `customer_success_close_won_report_archive_delete_applied`, approval `type`, `status`, `risk_domain`, `target_label`, `requester`, `reviewer`, `requested_at`, `reviewed_at`, `request_id`, `trace_id`.
- Status values: `PENDING`, `APPROVED`, `REJECTED`, `APPLIED`; risk domain `AUDIT_ARCHIVE`; alert status `OPEN`, `ACKNOWLEDGED`, `ESCALATED`, `CLOSED`.
- User actions: filter approval type to “客户成功复盘归档删除”, inspect detail, approve/reject with note, notify operation alert, acknowledge/escalate/close alert, export filtered approvals.
- Required states: loading rows, empty approval state, error banner, disabled actions without permission, success notice after review/export/notify.

Design requirements:
- Use a restrained enterprise dashboard style with compact cards, tables, detail panels, subtle borders and soft shadows.
- Include a dedicated metric strip for customer success report archive deletion: “客户成功复盘删除待审 / 已批准 / 已拒绝 / 闭环率”.
- Keep Chinese UI text; no emoji.
- The page must feel like an operations console, not a marketing dashboard.
- Keep the customer success module as a source filter and detail metadata only; do not show the full opportunity list or report content.

Avoid:
- decorative hero sections, large gradients, fake CRM fields, unrelated charts, or putting report details into the approval list.
