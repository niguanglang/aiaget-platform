# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: M99 SLA 死信审计归档删除审批通知投递 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: make SLA dead-letter audit archive delete approval alerts clearly notifiable and auditable
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges

Interface contract that must appear in the UI:
- Alert ids:
  - SLA 死信归档删除等待审批
  - SLA 死信归档删除拒绝偏多
- Notification actions:
  - 通知
  - 重试
  - 查看归档删除审批
- Delivery fields:
  - status, channels, targets, webhook status, webhook error, delivered_at
- Required states:
  - 正在通知、已投递、部分成功、已跳过、失败、可重试

Design requirements:
- Keep the existing security center page.
- Highlight SLA dead-letter archive delete notifications in the delivery audit list.
- Show target roles: 安全管理员、审计员、租户管理员 when severity is high.
- Use Chinese UI text only.
- Keep a dense enterprise dashboard style.

Avoid:
- unrelated notification channels
- invented settings pages
- decorative hero sections, emoji, excessive gradients
