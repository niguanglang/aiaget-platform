# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the real frontend page `/billing`.

Project context:
- Page: M63-3 计费商业化中心
- Users/roles: 租户管理员、平台运营、财务运营
- Main task flow: 查看成本概览 -> 查看当前订阅 -> 比较套餐 -> 切换套餐或计费周期 -> 查看账单 -> 编辑额度策略

API/service contract:
- `getBillingOverview({ window })`
- `updateBillingSubscription(input)`
- `updateBillingQuotaPolicy(id, input)`

Data entities and fields:
- Summary: total_cost, model_cost, run_step_cost, total_tokens, projected_monthly_cost, current_period_cost, overage_cost, next_invoice_amount, active_quota_policy_count
- Plans: name, tier, monthly_base_price, yearly_base_price, included_monthly_cost, included_monthly_tokens, included_monthly_calls, included_storage_gb, overage_unit_price, feature_limits
- Subscription: plan_name, status, billing_cycle, base_price, current_period_start, current_period_end, auto_renew
- Invoices: invoice_no, status, period_start, period_end, total_amount, paid_amount, due_at
- Quota policies: name, subject_type, metric_type, period, limit_value, current_usage, usage_rate, warn_threshold, hard_threshold, action, status

Prototype requirements:
- Use low- to mid-fidelity wireframe style with clear section boundaries.
- Show the following regions:
  1. Header toolbar: title, status chips, 24h/7d segmented control, refresh button
  2. Metric grid: six to eight compact metric cards
  3. Subscription card: current plan, period, auto renew, included quota, overage estimate
  4. Plan catalog: three cards, current plan highlighted, monthly/yearly toggle buttons
  5. Quota policy table/card: usage bar, threshold fields, action/status controls, save button
  6. Invoice table: invoice number, status, period, total, paid, due date
  7. Existing cost analysis sections: cost trend, provider/model costs, API Key quota, conversation cost
- Include placeholders for loading, empty, error and saving disabled states.
- Keep the page realistic for a console dashboard: dense enough for operations, but with enough whitespace to scan.

Avoid:
- polished marketing pricing layout
- invented modules outside billing/cost/quota
- unrealistic navigation
- icons or text that do not map to the existing component library
