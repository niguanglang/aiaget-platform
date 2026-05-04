# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M111 自愈归档删除自动通知任务执行历史分类增强 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. 自动通知任务扫描 SLA 死信和自愈归档删除审批告警。
  2. 任务结果写入分类覆盖数量。
  3. 用户打开通知任务中心，查看任务执行历史。
  4. 历史摘要和每行记录显示 SLA 死信覆盖 / 自愈归档覆盖。
  5. 用户通过 request_id 或 trace_id 跳转审计/链路。
- API/service contract: list task runs, task overview.
- Actions and states: filter, search, refresh, empty, loading, failed with error.

Prototype requirements:
- Use wireframe style.
- Keep existing `/security` task center region.
- Show:
  1. History summary metrics including total, success, failed, manual, auto notify, SLA coverage, recovery coverage.
  2. Filters row.
  3. Table with category coverage labels per row.
  4. Latest execution result block with category coverage.
- Make the category coverage fields visually compact and scannable.

Avoid:
- separate analytics dashboard
- unsupported time range filters
- unrelated notification channels
