# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: AIAget Web 控制台计费商业化中心
- Page/route: 计费商业化中心 at `/billing`
- Target users/roles: 租户管理员、财务运营、具备 `billing:adjustment:manage` 的用户；普通用户可查看但不能创建调账单
- Business goal: 让用户在一个生产级 SaaS/admin 页面内查看订阅、发票账单、账单项、调账记录、成本趋势和额度风险，并围绕账单完成核对与调账闭环
- Existing frontend stack/design system: Next.js + React + Tailwind，使用 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`、lucide icons；控制台风格应密集、克制、便于扫描
- Existing page shell/layout: `/billing` 位于控制台布局中，主内容宽度 `max-w-7xl`，卡片 8px 左右圆角，表格与信息卡混合，中文 UI

Interface contract that must appear in the UI:
- API/service functions: `getBillingOverview({ window })`，`updateBillingSubscription(input)`，`updateBillingQuotaPolicy(id, input)`，`createBillingAdjustment(input)`
- Main entities and fields: 发票 `invoice_no/status/subtotal_amount/discount_amount/tax_amount/total_amount/paid_amount/period_start/period_end/due_at/paid_at/line_items/created_at`；调账 `adjustment_no/type/status/signed_amount/invoice_no/reason/description/effective_at/approved_at/created_at`；订阅、套餐、成本摘要、额度策略、API Key 风险、供应商/模型成本
- Status values/enums: 发票 `DRAFT/OPEN/PAID/VOID/OVERDUE`；调账 `PENDING/APPROVED/APPLIED/REJECTED/VOID`；调账类型 `CREDIT/DEBIT/REFUND/DISCOUNT/CORRECTION`
- User actions: 切换 24h/7d 窗口、刷新、切换套餐周期、选择套餐、编辑额度策略、新建调账单、选择发票、筛选发票状态、展开账单项、查看关联调账
- Required states: loading, empty, error, validation, disabled, success, permission-denied where relevant

Design requirements:
- Make it look like a production SaaS/admin product, not a marketing page.
- Use the project's existing data fields and actions; do not invent unrelated modules.
- Show the primary workflow clearly: select an invoice, inspect its totals and line items, see linked adjustments, then create an adjustment if permitted.
- Include a compact invoice table on the left and a selected invoice detail panel on the right with subtotal/discount/tax/paid/outstanding, due dates, line items, and linked adjustments.
- Use restrained colors with status badges and progress indicators, avoiding decorative gradients or one-note palettes.
- Keep visual language consistent with a Chinese operational console.
- Emphasize hierarchy, spacing, alignment, and repeated-use operational clarity.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to project components
- unreadable tiny text, random charts, placeholder lorem ipsum
- inconsistent actions or states
