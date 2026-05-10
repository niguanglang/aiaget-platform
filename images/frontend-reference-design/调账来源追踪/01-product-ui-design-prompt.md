# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 成本与额度中心
- Page/route: 调账申请与审批记录 at `/billing/adjustments`
- Target users/roles: 财务运营、租户管理员、客户成功负责人；调账写操作需要 `billing:adjustment:manage`
- Business goal: 财务人员在调账列表中快速识别每条调账的来源，并从“续约机会成交入账”产生的调账回到对应续约机会详情页做审计追踪。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，已有 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`、确认弹窗。
- Existing page shell/layout: 控制台内容区，顶部为 `BillingWorkspaceHeader`，下方指标卡和一个调账工作区卡片，卡片内左侧新建调账表单、右侧审批记录表格。

Interface contract that must appear in the UI:
- API/service functions: `getBillingOverview({ window })`、`createBillingAdjustment`、`approveBillingAdjustment`、`applyBillingAdjustment`、`voidBillingAdjustment`
- Main entities and fields: `adjustment_no`、`type`、`status`、`signed_amount`、`invoice_no`、`source_label`、`source_href`、`reason`、`created_at`
- Status values/enums: 调账类型 `CREDIT/DEBIT/REFUND/DISCOUNT/CORRECTION`；调账状态 `PENDING/APPROVED/APPLIED/REJECTED/VOID`
- User actions: 创建调账单、审批通过、应用到账单、作废、打开来源对象、刷新、切换统计窗口
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a real production billing operations page, not a marketing dashboard.
- Use a compact operational layout: metrics at top, left-side create form, right-side table.
- Add a clear but restrained “来源” column in the adjustment table. If a record has `source_href`, show a small linked label such as “续约机会：华中设计院二期续约扩展机会”; otherwise show “手工调账” or the raw source type.
- Preserve list-page responsibility: do not show renewal opportunity details, opportunity forms, long metadata, or approval history inside the table.
- Use subtle borders, soft shadow, neutral cards, small status badges, and balanced spacing.
- Text must be Chinese and must fit in compact table cells.

Avoid:
- Full renewal-opportunity detail panels in the adjustment list
- Decorative gradients that compete with billing data
- Fake fields not listed above
- Overloaded table columns or oversized hero-like typography
