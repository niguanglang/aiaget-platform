# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform settings page.

Project context:
- Page/route: `/settings` notification policy category.
- Users/roles: 租户管理员、监控运营、安全管理员。
- Main task flow: 用户保存通知策略 -> 后端生成快照 -> 右侧版本快照刷新 -> 用户查看某个版本 -> 点击回滚 -> 确认回滚 -> 快照与审计同步刷新。
- API/service contract: `listNotificationPolicySnapshots()`, `rollbackNotificationPolicySnapshot(snapshotId)`, `getNotificationPolicyAudit()`.
- Data entities and fields: snapshot version, action, setting name/key, previous value, next value, status change, approval reserved status, actor, created time, rollback count.
- Actions and states: refresh, rollback, confirmation dialog, loading, empty, error, permission disabled.

Prototype requirements:
- Keep existing three-column settings layout.
- Right panel has two stacked sections: “通知策略审计” and “版本快照”.
- Each snapshot row/card includes version, action, setting, value diff, actor/time, approval reserved status and rollback button.
- Confirmation dialog states clearly that rollback will overwrite the current notification policy setting and create a new rollback snapshot.
- Empty snapshot state should be visible.
- Make component boundaries obvious for frontend implementation.

Avoid:
- separate version center page
- full audit table
- fake approval processing steps
- unrelated settings or charts
