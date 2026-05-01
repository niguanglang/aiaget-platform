# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the real frontend page below.

Project context:
- Page/route: M47 成本与额度中心 at `/billing`.
- Users/roles: 租户管理员、运营管理员、模型管理员、审计员；读取权限 `monitor:log:view`.
- Main task flow: 进入成本与额度中心 -> 查看 24h/7d 成本总览 -> 查看成本趋势 -> 查看供应商和模型成本排行 -> 检查 API Key 额度风险 -> 定位高使用率或过期风险密钥。
- API/service contract:
  - `GET /api/v1/billing/overview?window=24h|7d`
- Data entities and fields:
  - Billing summary: total_cost, model_cost, run_step_cost, total_tokens, model_calls, projected_monthly_cost, quota_usage_rate, risky_api_key_count.
  - Cost trend: bucket, total_cost, model_cost, run_step_cost, total_tokens.
  - Provider/model costs.
  - API key quota usage.

Prototype requirements:
- Use low- to mid-fidelity enterprise admin wireframe style.
- Show clear regions:
  1. Header: title “成本与额度中心”, M47 badges, window switch, refresh.
  2. KPI row for total cost, model cost, step cost, tokens, projected monthly cost, risky keys.
  3. Main cost trend card with bars.
  4. Provider cost and model cost ranking cards/tables.
  5. API Key quota risk panel with usage bars and risk badges.
  6. Empty/loading/error placeholders.
- Component boundaries should map to Card/Button/MetricCard/StatusBadge/EmptyState.

Avoid:
- decorative-only UI
- invented billing payment workflows
- hidden or unreadable data labels
