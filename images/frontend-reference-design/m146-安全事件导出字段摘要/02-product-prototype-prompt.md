# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity prototype for `/security/events/[id]` export field summary.

Project context:
- Page/route: 安全事件详情 at /security/events/[id]
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 打开审批工作台导出事件 -> 查看基础信息和请求摘要 -> 在摘要卡片确认导出字段和通知归档筛选字段 -> 必要时查看原 JSON。
- API/service contract: `getSecurityCenterEvent(eventId)` returns context arrays.

Prototype requirements:
- Show existing detail layout and a conditional card named 审批导出字段清单.
- Two chip groups: 导出字段、通知归档筛选字段.
- Include no-card behavior for non-export events.
- Keep component boundaries obvious for `SecurityEventDetailContent`.

Avoid:
- No list page changes.
- No configuration controls.
- No CSV preview.
