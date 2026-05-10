# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for a real Enterprise AI Agent Platform console page.

Project context:
- Page/route: 续约机会分析 at `/customer-success-opportunities/analytics`
- Users/roles: 租户管理员、客户成功负责人、Agent 管理员；需要 `customer:success_opportunity:view`
- Main task flow: 进入续约机会分析 -> 查看总览指标 -> 判断阶段漏斗断点 -> 查看类型/风险分布 -> 打开 Top 机会或近期关闭机会详情。
- API/service contract: `getCustomerSuccessOpportunityAnalytics()` 返回 `CustomerSuccessOpportunityAnalytics`
- Data entities and fields: summary 指标、stage_funnel、type_breakdown、risk_breakdown、top_opportunities、upcoming_closes；机会行使用 `name/customer_name/stage/status/risk_level/estimated_amount/probability/weighted_amount/expected_close_at`
- Actions and states: 返回清单、刷新、查看详情；loading、empty、error、permission denied、disabled fetching state

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Region 1: header with badges, title, description, actions.
- Region 2: compact metric grid, 4 columns desktop / 2 columns tablet / 1 column mobile.
- Region 3: stage funnel card spanning two-thirds width; each stage row has label, count, amount, weighted amount, and proportional bar.
- Region 4: stacked side cards for type breakdown and risk breakdown.
- Region 5: two lower cards for Top opportunities and upcoming closes, each with compact rows and detail links.
- Include clear empty/error/loading/permission placeholders.
- Component boundaries should map directly to Tailwind cards and existing UI primitives.

Avoid:
- CRUD forms, edit panels, delete actions, unrelated charts, hidden navigation assumptions, invented backend fields.
