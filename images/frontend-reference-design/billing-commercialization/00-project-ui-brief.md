# Project UI Brief

- Project/module: AIAget Web 控制台计费商业化中心
- Page/route: `/billing`，Next.js App Router 页面 `apps/web/src/app/(console)/billing/page.tsx` 渲染 `BillingContent`
- Target users/permissions: 控制台租户用户可查看计费中心；`tenant_admin` 或具备 `billing:adjustment:manage` 可创建调账单，缺少权限时调账表单禁用并展示仅查看状态
- Business goal: 在同一页面闭环订阅套餐、发票账单、账单项、调账、成本趋势和额度风险，帮助运营与财务理解本期账单构成并执行调账
- API/service functions: `getBillingOverview({ window })` -> `BillingOverview`；`updateBillingSubscription(input)` -> `BillingSubscriptionItem`；`updateBillingQuotaPolicy(id, input)` -> `BillingQuotaPolicyItem`；`createBillingAdjustment(input)` -> `BillingAdjustmentItem`
- Main entities/fields: `BillingSummary` 成本、词元、调用、预测、调账影响；`BillingInvoiceItem` 的 `invoice_no/status/subtotal_amount/discount_amount/tax_amount/total_amount/paid_amount/period_start/period_end/due_at/paid_at/line_items/created_at`；`BillingAdjustmentItem` 的 `adjustment_no/type/status/signed_amount/invoice_no/reason/description/effective_at/approved_at/created_at`；`BillingSubscriptionItem`、`BillingPlanItem`、`BillingQuotaPolicyItem`、`BillingApiKeyQuotaItem`
- Status/enums: 发票 `DRAFT/OPEN/PAID/VOID/OVERDUE`；调账 `PENDING/APPROVED/APPLIED/REJECTED/VOID`；调账类型 `CREDIT/DEBIT/REFUND/DISCOUNT/CORRECTION`；账期窗口 `24h/7d`
- Existing components/design system: React 19、Next 16、TanStack Query、Tailwind utility classes、`Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`、lucide-react icons、现有控制台密集信息布局
- Required states/actions: loading skeleton/text、empty state、overview error banner、mutation success/error message、调账表单校验、缺权限禁用、发票选择、发票状态筛选、账单项展开/折叠、关联账单过滤调账记录、刷新
- Design constraints: 保持中文文案、现有 API 契约和共享类型；`line_items` 是 `Record<string, unknown> | null`，前端只能防御式解析常见数组/对象形态，不能假设后端新增字段；不改后端文件，不改路由契约
