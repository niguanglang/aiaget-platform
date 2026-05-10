# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台安全中心
- Page/route: 告警运营 at `/security/alerts`
- Target users/roles: 安全管理员、审计员、租户管理员；操作权限沿用 `security:rule:view` 和 `security:approval:view/handle`
- Business goal: 让安全运营人员在统一告警页按来源查看运营告警通知审计，特别是客户成功复盘归档删除通知，支持当前筛选导出 CSV 和创建归档。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS，现有 shadcn 风格 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`。
- Existing page shell/layout: 现有 `SecurityWorkspaceHeader`，页面包含审批工作台、运营告警、通知审计、SLA 告警区域；不要新增左侧菜单或新页面。

Interface contract that must appear in the UI:
- API/service functions: `listSecurityOperationAlertNotifications`, `exportSecurityOperationAlertNotifications`, `createSecurityOperationAlertNotificationArchive`。
- Main entities and fields: `alert_id`, `alert_category`, `alert_category_label`, `status`, `channels`, `targets`, `message`, `retry_count`, `request_id`, `trace_id`, `created_at`。
- Status values/enums: 通知状态 `SENT/PARTIAL/SKIPPED/FAILED`；来源分类包含 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE`，显示中文“客户成功复盘归档删除通知”。
- User actions: 按状态筛选、按来源筛选、关键词搜索、导出当前筛选、创建当前筛选归档、刷新。
- Required states: loading, empty, error, disabled, success, permission-denied。

Design requirements:
- Make it look like a production SaaS/admin product, not a generic marketing page.
- Keep the notification audit list compact and operational: source badge, status badge, short message, retry count, created time.
- Show a toolbar with status filter, source filter, keyword search, export button, archive button.
- Show customer success source as a clear Chinese source badge, without exposing customer opportunity details or report body.
- Use restrained borders, soft shadows, clean spacing, and dashboard density consistent with existing security pages.

Avoid:
- fake customer records, opportunity detail panels, report content previews, or unrelated charts
- decorative oversized hero sections
- putting delete approval handling inside the notification audit list
