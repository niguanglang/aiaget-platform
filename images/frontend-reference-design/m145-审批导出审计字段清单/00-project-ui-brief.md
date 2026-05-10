# Project UI Brief

- Page: m145-审批导出审计字段清单
- Route: /security/events/[id]
- Feature goal: 安全事件详情展示审批工作台CSV导出字段和通知归档筛选字段清单
- Target users/permissions: 安全管理员、审计员、租户管理员；沿用安全事件查看权限。
- APIs/services: `getSecurityCenterEvent(eventId)`，后端 `SecurityCenterService.getEvent` 和 `mapPlatformSecurityEvent`。
- Entities/fields/statuses: `SecurityCenterEventDetail.context.exported_fields`、`SecurityCenterEventDetail.context.notification_archive_filter_fields`、`request_summary.exported_fields`。
- Existing components/design system: `SecurityEventDetailContent` 已有 `JsonBlock` 展示请求摘要和上下文；本里程碑不新增页面组件。
- Required states: 详情加载中、详情不存在、详情加载失败、正常展示 JSON 上下文。
- Constraints: 只增强审计 payload 和 context 映射，不新增字段预览表、不改变安全事件列表。
