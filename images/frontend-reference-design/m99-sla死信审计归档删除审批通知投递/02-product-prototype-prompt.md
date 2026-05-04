# Product Prototype / Wireframe Image Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M99 SLA 死信审计归档删除审批通知投递 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. M98 生成 SLA 死信归档删除运营告警
  2. 用户点击通知
  3. 系统投递站内记录和 Webhook
  4. 投递审计列表展示 SLA 死信归档删除标识、目标角色和结果
  5. 失败或部分成功可重试
- API/service contract:
  - notify operation alert
  - list operation alert notifications
  - retry operation alert notification
- Actions and states:
  - notify, retry, loading, partial, failed, skipped, sent

Prototype requirements:
- Use wireframe style.
- Show alert card area and notification audit area.
- Make SLA dead-letter archive delete notification visually identifiable.

Avoid:
- separate route
- unsupported channels or settings
