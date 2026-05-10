# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the renewal opportunity detail page enhancement.

Project context:
- Page/route: 续约机会详情 at `/customer-success-opportunities/:id`
- Users/roles: 客户成功负责人、租户管理员、财务运营、审计员
- Main task flow: 打开机会详情 -> 查看成交入账卡片 -> 若已入账，查看调账摘要 -> 跳转调账记录或审计页；若未入账，填写金额/说明并确认成交入账。
- API/service contract: `getCustomerSuccessOpportunity` returns `billing_adjustments`; `closeWonCustomerSuccessOpportunity` creates adjustment and updates opportunity.
- Data entities and fields: 调账单号、类型、状态、签名金额、账单号、原因、生效时间、来源类型、来源 ID。

Prototype requirements:
- Low- to mid-fidelity wireframe focused on information architecture.
- Preserve current detail layout: header, metrics, summary/resource cards, follow-up action card, close-won billing card.
- In the close-won billing card, add distinct states:
  - no adjustment: show create form and warning
  - has adjustment: show compact adjustment summary and route buttons
  - permission denied: show read-only notice
- Make component boundaries clear for implementation.

Avoid:
- Moving billing approval operations into this page
- Showing unrelated billing center data
- Adding new database concepts or unsupported fields
