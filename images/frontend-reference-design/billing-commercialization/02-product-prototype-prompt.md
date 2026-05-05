# Product Prototype / Wireframe Image Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 计费商业化中心 at `/billing`
- Users/roles: 租户管理员、财务运营、只读计费用户
- Main task flow: 进入计费页 -> 查看摘要和当前订阅 -> 在账单工作区按状态筛选发票 -> 选择一张发票 -> 展开账单项与应付明细 -> 查看关联调账 -> 有权限时创建调账单 -> 看到成功/失败反馈并刷新概览
- API/service contract: `getBillingOverview({ window })` supplies invoices, adjustments, summary, subscription, plans, quota policies, cost trend and cost breakdowns; mutation APIs only cover subscription, quota policy and adjustment creation
- Data entities and fields: use only `BillingInvoiceItem`, `BillingAdjustmentItem`, `BillingSummary`, `BillingSubscriptionItem`, `BillingPlanItem`, `BillingQuotaPolicyItem`, `BillingApiKeyQuotaItem`
- Actions and states: window switch, refresh, invoice status filter, invoice row select, line item expand/collapse, adjustment form validation, disabled permission state, loading, empty, error, success

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture, page regions, user flow, and interaction states.
- Main regions: page header/toolbar, metric card grid, subscription + plan grid, quota policy + invoice workbench grid, adjustment center, cost trend/risk/cost tables.
- Invoice workbench wireframe: left column invoice list with status filter and selected row; right column selected invoice summary, due/paid dates, line item table, linked adjustments list.
- Include explicit empty/error/loading/permission placeholders.
- Make component boundaries obvious so implementation maps to existing `Card`, `StatusBadge`, `Button`, `Input`, tables and utility functions.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
