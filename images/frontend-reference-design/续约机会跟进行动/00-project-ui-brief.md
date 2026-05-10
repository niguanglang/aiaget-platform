# Project UI Brief

- Page: 续约机会跟进行动
- Route: /customer-success-opportunities/[id]
- Feature goal: 续约机会详情页一键生成客户成功跟进行动
- Parent layout: 复用 `apps/web/src/app/(console)/customer-success-opportunities/[id]/page.tsx` 详情页，不新增独立菜单。
- Target users and permissions: 租户管理员，或同时具备 `customer:success_opportunity:manage` 与 `customer:success_action:manage` 的用户。
- APIs/services: `createCustomerSuccessOpportunityFollowUpAction(opportunityId, input)` -> `POST /customer-success-opportunities/:id/follow-up-actions`。
- Entities/fields/statuses: 输入只允许 `name`、`due_at`、`owner_id`；后端基于机会阶段、金额、风险、下一步动作自动生成 `CustomerSuccessActionDetail` 并回写机会 `customer_success_action_id`。
- Existing components/design system: Next.js + React Query + Tailwind CSS + shadcn/ui 风格 `Button`、`Card`、`StatusBadge`，图标使用 lucide，中文界面。
- Required states: loading、error、permission-denied、disabled、success、二次确认、已绑定行动提示。
- Page responsibility: 详情页只提供当前机会的完整查看和对象级操作；生成跟进行动是当前对象操作，不进入列表页。
