# Product Prototype / Wireframe Image Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 渠道中心 at `/channels`
- Users/roles: 租户管理员、渠道运营、发布运维、只读审计用户
- Main task flow: 进入渠道中心 -> 查看总览指标 -> 在模块导航切换 provider/account/template/route-rule/job/delivery/reply -> 按关键词和状态筛选 -> 选择一条记录 -> 在详情面板核对配置、关联渠道、最近投递或回复 -> 回到发布渠道执行现有发布/灰度/投递策略操作
- API/service contract: existing publish/sender/release APIs plus new list endpoints `/channels/providers`、`/channels/accounts`、`/channels/templates`、`/channels/route-rules`、`/channels/publish-jobs`、`/channels/deliveries`、`/channels/replies`
- Data entities and fields: only show fields available in current shared types or provisional fields documented in the brief; include raw metadata fallback area in detail panel
- Actions and states: module tab switch, refresh, keyword filter, status/provider/type filter, row selection, detail panel, loading/empty/error/permission states

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Page regions: header toolbar, metric grid, module navigation, existing publish channel workbench, new operations bento/workbench, existing sender/release sections.
- Module navigation labels: 总览、发布渠道、渠道提供方、账号、模板、路由规则、发布任务、投递记录、回复记录.
- Operations workbench: left compact list with status badges and primary fields; right detail card with key-value rows, metadata JSON, related counters.
- Show empty/error/loading states per module because backend tasks may land independently.
- Make component boundaries obvious for mapping to `Card`, `MetricCard`, `StatusBadge`, `SelectFilter`, `Input`, tables/lists and existing detail rows.

Avoid:
- polished decorative rendering
- unrealistic sidebar rewrites
- create/edit actions for new entities without confirmed DTOs
