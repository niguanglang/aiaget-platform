# Project UI Brief

- Page: m146-安全事件导出字段摘要
- Route: /security/events/[id]
- Feature goal: 安全事件详情以摘要区展示审批导出字段清单和通知归档筛选字段
- Target users/permissions: 安全管理员、审计员、租户管理员；沿用安全事件详情查看权限。
- APIs/services: `getSecurityCenterEvent(eventId)`，无新增接口。
- Entities/fields/statuses: `context.exported_fields`、`context.notification_archive_filter_fields`。
- Existing components/design system: `SecurityEventDetailContent`、`Card`、`StatusBadge`、`JsonBlock`、Tailwind 标签样式。
- Required states: 字段存在时展示摘要，字段缺失时不渲染；保留详情加载、空、错误状态。
- Constraints: 不新增 CSV 预览、不改变安全事件列表、不展示审批或客户成功正文。
