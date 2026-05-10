# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the enterprise AI Agent platform security operations page.

Page/route:
- 告警运营 `/security/alerts`

Main task flow:
- 审计员进入告警运营。
- 在“通知审计”卡片中按状态、来源和关键词筛选通知审计。
- 看到顶部提示“通知审计字段账本”，知道导出 CSV 会包含“导出字段清单”和“通知归档筛选字段”。
- 在列表行中只看到轻量“字段账本”标签和字段数量，不展开完整字段。
- 点击“导出通知审计”下载 CSV 或点击“创建审计归档”留存对象存储归档。

API/service contract:
- `listSecurityOperationAlertNotifications`
- `exportSecurityOperationAlertNotifications`
- `createSecurityOperationAlertNotificationArchive`

Data entities and fields:
- `SecurityOperationAlertNotificationItem`
- `alert_category_label`, `status`, `message`, `retry_count`, `created_at`, `exported_fields`, `notification_archive_filter_fields`

Prototype requirements:
- 显示页面区域：筛选工具条、导出/归档按钮、字段账本提示条、通知审计列表、加载/空态/错误占位。
- 列表字段控制在核心概览范围内。
- 字段账本只用标签和数量表达，不展示完整数组。
- 明确按钮 disabled、导出中、归档中和成功/失败提示位置。
