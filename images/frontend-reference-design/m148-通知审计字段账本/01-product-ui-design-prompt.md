# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform security operations page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 告警运营
- Page/route: 告警运营 at `/security/alerts`
- Target users/roles: 租户管理员、安全管理员、审计员
- Business goal: 在运营告警通知审计中轻量提示审批工作台导出字段账本，帮助审计员知道 CSV 可复核“导出字段清单”和“通知归档筛选字段”，同时不把完整字段详情塞进列表。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS，shadcn/ui 风格 Card/Button/StatusBadge/MetricCard/EmptyState。
- Existing page shell/layout: 安全中心工作台页面，玻璃质感背景，卡片式 Dashboard Layout，中文文案。

Interface contract that must appear:
- APIs/services: `listSecurityOperationAlertNotifications`, `exportSecurityOperationAlertNotifications`, `createSecurityOperationAlertNotificationArchive`
- Main entity: `SecurityOperationAlertNotificationItem`
- Fields: 通知事件ID、告警ID、来源分类、状态、消息、重试次数、创建时间、`exported_fields`、`notification_archive_filter_fields`
- Status values: 已发送、部分成功、已跳过、失败
- Actions: 状态筛选、来源筛选、关键词搜索、导出通知审计、创建审计归档
- Required states: 加载、空态、错误、导出中、归档中、成功提示、失败提示、按钮 disabled

Design requirements:
- 通知审计列表保持轻量：每行展示状态、来源、告警短 ID、消息、重试次数、时间，以及一个“字段账本”小标签。
- 在通知审计卡片顶部增加一个克制的信息提示：CSV 已包含导出字段清单和通知归档筛选字段。
- 不展开完整字段数组，不使用大段 JSON，不把安全事件详情内容塞进通知审计列表。
- 风格保持极简、科技、产品感强：细边框、轻阴影、backdrop blur、留白充足。
- 所有可见文字使用中文。

Avoid:
- 信息过载表格
- 在列表中展示完整字段清单
- 夸张渐变、廉价发光、大圆堆叠
