# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 租户管理员、安全管理员、审计员
- Main task flow: 查看 SLA 通知概览 -> 定位团队报告归档删除来源 -> 扫描重试 -> 处理死信 -> 筛选审计 -> 导出或归档审计
- API/service contract: SLA notification overview, notification retry overview, dead letter overview, dead letter action, dead letter audit list/export/archive
- Data entities and fields: `alert_category`, `title`, `status`, `channels`, `retry_count`, `webhook_status`, `disposition_status`, `action`, `request_id`, `trace_id`, `occurred_at`
- Actions and states: 刷新、通知、扫描重试、单条重试、认领、重新投递、关闭、筛选、导出、归档；加载、空、失败、成功、禁用

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show the existing `/security` page as a dashboard section, not a landing page.
- Regions:
  - SLA 通知概览卡片：指标、最近通知列表、来源分类标签
  - 自动重试与死信卡片：策略、可重试队列、死信队列
  - 死信处置卡片：备注输入、处置队列、操作按钮
  - 死信处置审计卡片：搜索、来源筛选、动作筛选、状态筛选、列表、分页、导出/归档按钮
- Make component boundaries obvious so a frontend engineer can map each region to existing React components.

Avoid:
- Invented backend fields.
- Marketing hero sections.
- Decorative-only content and unreadable labels.
