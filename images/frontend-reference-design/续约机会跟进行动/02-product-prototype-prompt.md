# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the opportunity detail page follow-up workflow.

Project context:
- Route: `/customer-success-opportunities/[id]`
- Main task flow: 打开续约机会详情 -> 查看机会摘要和风险 -> 在“跟进行动闭环”卡片中确认生成 -> 后端创建客户成功行动 -> 页面展示成功结果和“查看行动”入口。
- API/service contract: `createCustomerSuccessOpportunityFollowUpAction(opportunityId, { name?, due_at?, owner_id? })`
- Data entities: `CustomerSuccessOpportunityDetail.linked_resources.customer_success_action`, `CustomerSuccessActionDetail`
- Permissions: `customer:success_opportunity:manage` + `customer:success_action:manage`

Prototype requirements:
- Show detail page header actions: 返回列表、编辑机会、生成跟进行动入口。
- Show a dedicated card titled “跟进行动闭环”.
- Card state A: no linked action, editable action name and due date, confirm button.
- Card state B: existing linked action, display action name/status/score and detail link, generation disabled.
- Card state C: success message after mutation, show new action link and refresh opportunity state.
- Card state D: error message.

Avoid:
- full customer success action CRUD form
- list-page analytics charts
- unrelated fields or menus
