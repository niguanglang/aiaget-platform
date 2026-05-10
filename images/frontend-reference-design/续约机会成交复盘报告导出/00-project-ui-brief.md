# Project UI Brief

- Page: 续约机会成交复盘报告导出
- Route: /customer-success-opportunities/[id]/close-won-report
- Feature goal: 在成交复盘报告详情页提供 Markdown 导出能力，方便客户成功、财务运营和审计角色离线复盘。
- Target users/permissions: 客户成功负责人、财务运营、租户管理员、审计员；后端使用 `customer:success_opportunity:view`，导出为只读能力。
- APIs/services: `exportCustomerSuccessOpportunityCloseWonReport(opportunityId)` -> `GET /customer-success-opportunities/:id/close-won-report/export`，返回 `text/markdown; charset=utf-8` Blob。
- Entities/fields/statuses: 沿用 `CustomerSuccessOpportunityCloseWonReport`：summary、value_review、source_chain、billing_trace、replay_points、next_actions。
- Existing components/design system: Next.js App Router，Tailwind CSS，`Card`、`Button`、`StatusBadge`，`CustomerSuccessOpportunityBackground`，中文文案。
- Required states: 导出中禁用按钮、导出失败提示、下载 `.md` 文件；不新增编辑、成交入账或跟进行动 mutation。
