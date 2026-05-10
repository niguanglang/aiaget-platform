# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform console detail page.

Project context:
- Product/module: 企业 AI Agent 平台 · 客户成功续约机会中心
- Page/route: 续约机会详情 at `/customer-success-opportunities/[id]`
- Target users/roles: 租户管理员，或同时具备 `customer:success_opportunity:manage` 与 `customer:success_action:manage` 的客户成功负责人
- Business goal: 在续约机会详情页把机会转成可负责人、可截止、可追踪的客户成功跟进行动，让分析看板发现的问题能进入执行闭环。
- Existing frontend stack/design system: Next.js App Router + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，lucide 图标，React Query mutation。

Interface contract:
- Service: `createCustomerSuccessOpportunityFollowUpAction(opportunityId, input)`
- API: `POST /customer-success-opportunities/:id/follow-up-actions`
- Input fields: `name?`, `due_at?`, `owner_id?`
- Result fields: `action: CustomerSuccessActionDetail`, `opportunity: CustomerSuccessOpportunityDetail`
- User actions: 返回列表、编辑机会、生成跟进行动、查看生成的成功行动
- Required states: 已绑定行动时禁用重复生成；生成前二次确认；生成中 disabled；生成成功展示中文结果链接；失败展示错误。

Design requirements:
- Keep existing opportunity detail layout.
- Add a compact “跟进行动闭环” card near the source/resource area.
- The card shows current linked customer success action if present.
- If not linked and user has permission, show due date input, optional action name input, and primary button “生成跟进行动”.
- Use subtle border, soft shadow, clean Chinese copy, no crowded form.

Avoid:
- putting this workflow in the list page
- full action edit form inside opportunity detail
- destructive-looking styling
- invented fields beyond input/result contract
