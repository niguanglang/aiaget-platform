# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Opportunity detail page | `apps/web/src/components/customer-success-opportunities/customer-success-opportunity-detail-content.tsx` | `getCustomerSuccessOpportunity` | 保持详情页职责 |
| Follow-up workflow card | Same detail component | `createCustomerSuccessOpportunityFollowUpAction` | 当前对象操作，不新增页面 |
| Inputs | Native `input` within `Card` | `name`, `due_at` | 简单字段，不引入完整 Action 表单 |
| Confirm/success/error state | `Button`, `Card`, local state, React Query mutation | `CustomerSuccessOpportunityFollowUpActionResult` | 成功后刷新机会详情 |
| Linked action display | `StatusBadge`, `Link` | `linked_resources.customer_success_action` | 已绑定时不重复生成 |
| API client | `apps/web/src/lib/api-client.ts` | shared types | 新增 POST 方法 |
| IA tests | `customer-success-opportunities-route-ia-contract.test.ts` | file source assertions | 约束列表不承载该操作 |
