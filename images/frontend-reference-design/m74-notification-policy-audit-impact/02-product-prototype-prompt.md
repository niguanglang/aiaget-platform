# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform settings page.

Project context:
- Page/route: `/settings` notification policy category.
- Users/roles: 租户管理员、监控运营、安全管理员。
- Main task flow: 用户修改通知策略 -> 卡片内显示影响预览 -> 用户确认保存 -> 操作日志记录 -> 右侧审计摘要刷新。
- API/service contract: `previewNotificationPolicySettingChange(settingId, { value, status })`, `getNotificationPolicyAudit()`.
- Data entities and fields: preview impact, warnings, recent task summary, recent changes.

Prototype requirements:
- Keep existing three-column settings layout.
- Each changed notification setting card shows a small impact preview area.
- Right panel shows recent changes list and summary metrics.
- Preview should show impact level, changed fields, warnings and task impact.
- Empty audit state should be visible.

Avoid:
- new tables or migration concepts
- complex approval UI
- full audit log page
