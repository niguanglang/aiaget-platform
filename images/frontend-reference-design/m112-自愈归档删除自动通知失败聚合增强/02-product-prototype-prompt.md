# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M112 自愈归档删除自动通知失败聚合增强 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. 自动通知任务写入分类覆盖数量。
  2. 安全中心 overview 聚合最近 24 小时任务失败。
  3. 失败聚合区显示总失败、失败率、连续失败、SLA 失败来源、自愈失败来源。
  4. 自愈建议 evidence 中提示主要失败来源。
  5. 用户进入任务历史或投递审计排障。
- API/service contract: `GET /security-center/overview`.
- Actions and states: loading, empty suggestions, acknowledge, ignore, resolve, view task history.

Prototype requirements:
- Use wireframe style.
- Keep existing `/security` page shell.
- Show notification task failure section with six compact metric tiles.
- Show recovery suggestion cards with evidence line naming SLA/self-healing failure source.
- Make loading and no-risk states explicit.

Avoid:
- separate analytics dashboard
- unbacked drill-down fields
- unrelated charts or new filters
