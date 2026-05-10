# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity wireframe for the same real frontend page.

Project context:
- Page/route: 续约机会成交复盘报告 at /customer-success-opportunities/[id]/close-won-report
- Users/roles: 客户成功负责人、财务运营、租户管理员、审计员
- Main task flow: 用户从续约机会详情进入成交复盘报告，查看赢单摘要、成交金额、来源链路、调账入账、审计追踪、复盘要点和下一步动作，然后返回详情或进入调账/审计页面。
- API/service contract: GET /customer-success-opportunities/:id/close-won-report，返回 CustomerSuccessOpportunityCloseWonReport。
- Data entities and fields: summary metrics, value review cards, source chain list, billing trace rows, replay points, next actions。
- Actions and states: 返回机会详情、调账记录、审计追踪；loading、error、empty billing trace。

Prototype requirements:
- Show page regions clearly: header, summary metric row, two-column report body, billing trace table/list, action recommendation list.
- Make component boundaries obvious for existing Card/Button/StatusBadge mapping.
- Keep it read-only and separate from the existing opportunity detail mutation cards.

Avoid:
- putting create/edit/close-won forms on this report route
- showing too many raw detail fields in one dense table
