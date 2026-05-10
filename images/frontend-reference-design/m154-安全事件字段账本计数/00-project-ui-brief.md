# Project UI Brief

- Page: M154 安全事件字段账本计数
- Route: `/security/events`
- Feature goal: 安全事件列表对审批工作台导出事件显示轻量字段账本计数，帮助审计员在列表层快速识别导出事件是否保留字段范围；完整字段清单仍进入 `/security/events/[id]` 详情页。
- Target users: 安全管理员、租户管理员、审计员。
- APIs/services: `listSecurityCenterEvents` 获取列表，`getSecurityCenterEvent` 仍由详情页负责；后端 `SecurityCenterService.listEvents` 返回 `SecurityCenterEventListItem`。
- Entities/fields/statuses: `SecurityCenterEventListItem` 增加 `has_export_field_ledger?: boolean`、`exported_field_count?: number`、`notification_archive_filter_field_count?: number`；不在列表项返回 `exported_fields` 或 `notification_archive_filter_fields`。
- Existing components/design system: `SecurityEventsContent`、`SecurityEventRow`、`SecurityWorkspaceHeader`、`MetricCard`、`Card`、`StatusBadge`、Tailwind CSS。
- Required states: loading、empty、error、分页、筛选、Trace only、详情跳转。
- IA constraints: 列表只保留核心字段和轻量 chip，不展示完整字段数组、不展示 JSON；详情页继续展示完整“审批导出字段清单”。
