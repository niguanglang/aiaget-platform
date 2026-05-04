# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M109 通知任务自愈归档删除审批通知投递 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. M108 生成自愈归档删除审批运营告警。
  2. 用户在运营告警卡片点击“通知”。
  3. 系统投递站内记录和 Webhook。
  4. 告警卡片展示本次投递结果、渠道、目标角色。
  5. 通知投递审计列表展示自愈归档删除分类标签、目标角色、Webhook 状态和重试按钮。
- API/service contract:
  - notify operation alert
  - list operation alert notifications
  - retry operation alert notification
- Actions and states: notify, retry, loading, partial, failed, skipped, sent, empty audit.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Keep the existing `/security` page shell.
- Show two key regions:
  1. 运营告警闭环 card list with alert status, severity, metric, action button, notify button, and notification result strip.
  2. 通知投递审计 table with columns: 状态、告警、渠道/目标、Webhook、重试、投递时间、操作.
- Make the “自愈归档删除” category visually distinct from SLA 死信 and 通知任务风险, but use the same badge system.
- Include loading, empty and retryable states.

Avoid:
- separate route
- unsupported channels, user assignment, or settings forms
- complex charts; this is an audit/action surface, not analytics
