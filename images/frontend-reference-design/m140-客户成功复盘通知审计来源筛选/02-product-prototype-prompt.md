# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 告警运营 at `/security/alerts`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 用户进入告警运营页，切换通知审计区域来源为“客户成功复盘归档删除通知”，输入关键字或选择状态，查看紧凑通知审计列表，然后导出当前筛选或创建对象存储归档。
- API/service contract: `listSecurityOperationAlertNotifications({ status, alert_category, keyword })`；`exportSecurityOperationAlertNotifications({ status, alert_category, keyword })`；`createSecurityOperationAlertNotificationArchive({ status, alert_category, keyword })`。
- Data entities and fields: `alert_category_label`, `status`, `alert_id`, `message`, `retry_count`, `request_id`, `trace_id`, `created_at`。
- Actions and states: 状态筛选、来源筛选、关键词搜索、导出、创建归档、加载、空、错误、成功反馈、禁用态。

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Keep the page route boundary clear: approval workbench and operation alert cards remain on the page, but the wireframe focus is the notification audit panel.
- Notification audit panel regions: title/description, filter toolbar, result count hint, export/archive action buttons, compact list rows, empty/error/loading placeholders.
- Source filter options must include “客户成功复盘归档删除通知”.
- Do not include customer success opportunity detail, report text, or approval review form in this panel.
