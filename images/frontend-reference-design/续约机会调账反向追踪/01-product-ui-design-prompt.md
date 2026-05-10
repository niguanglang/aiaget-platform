# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin detail page.

Project context:
- Product/module: 企业 AI Agent 平台 / 客户成功续约机会中心
- Page/route: 续约机会详情 at `/customer-success-opportunities/:id`
- Target users/roles: 客户成功负责人、租户管理员、财务运营、审计员
- Business goal: 用户在续约机会详情页查看成交入账状态，并看到由该机会生成的调账记录摘要，可跳转到账单调账页和审计页继续追踪。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，已有 `Card`、`Button`、`StatusBadge`、确认弹窗和详情页网格布局。
- Existing page shell/layout: 控制台详情页，顶部为机会状态和编辑按钮，中间是指标卡、机会摘要、关联资源、跟进行动卡片和成交入账卡片。

Interface contract that must appear in the UI:
- API/service functions: `getCustomerSuccessOpportunity(id)`、`closeWonCustomerSuccessOpportunity(id, input)`
- Main entities and fields: `billing_adjustments[].adjustment_no`、`type`、`status`、`signed_amount`、`invoice_no`、`reason`、`effective_at`、`source_type/source_id`
- Status values/enums: 调账类型 `DEBIT`；调账状态 `APPLIED/APPROVED/PENDING/VOID`
- User actions: 确认成交入账、查看调账记录、打开审计追踪、查看关联账单
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Keep the opportunity detail page as the owner of opportunity-level workflows.
- In the “成交入账闭环” card, add a compact “已关联调账” summary area below metrics.
- Show each adjustment as a concise row or compact card: 调账单号、状态、金额、账单号、入账时间, with buttons “调账记录” and “审计追踪”.
- If no adjustment exists, show a neutral empty hint and keep the existing create form.
- Use Chinese text only. Visual style should be restrained, operational, and consistent with the current detail page.

Avoid:
- Embedding billing adjustment approval actions in the opportunity detail page
- Full billing adjustment tables or long metadata blobs
- Overloaded charts or marketing-style visuals
