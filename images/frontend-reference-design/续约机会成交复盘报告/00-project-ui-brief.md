# Project UI Brief

- Page: 续约机会成交复盘报告
- Route: /customer-success-opportunities/[id]/close-won-report
- Feature goal: 成交后客户价值与入账追踪复盘报告
- Target users/permissions: 客户成功负责人、财务运营、租户管理员、审计员；后端使用 `customer:success_opportunity:view`，页面只读。
- APIs/services: `getCustomerSuccessOpportunityCloseWonReport(opportunityId)` -> `GET /customer-success-opportunities/:id/close-won-report`。
- Entities/fields/statuses: 机会摘要、客户名、预计金额、成交金额、成交日期、调账单数、调账追踪、客户价值、商务策略、决策路径、风险摘要、来源链路、复盘要点、下一步动作。
- Existing components/design system: Next.js App Router，Tailwind CSS，`Card`、`Button`、`StatusBadge`，`CustomerSuccessOpportunityBackground`，中文文案。
- Required states: loading、error、empty/partial data、返回机会详情、进入账单调账与审计追踪链接。
